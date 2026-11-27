-- All prices are maintained here. Quotes preserve the price shown before payment.
create table public.packages (
  label text primary key,
  price_ngn integer not null check (price_ngn between 1 and 10000000),
  description text not null,
  sort_order integer not null unique,
  popular boolean not null default false
);
insert into public.packages(label, price_ngn, description, sort_order, popular) values
  ('1B',100,'A little boost',1,false),('20B',500,'A good start',2,false),
  ('50B',1000,'Room to play',3,false),('120B',2000,'The sweet spot',4,true),
  ('200B',3000,'Big moves',5,false),('500B',5000,'The big one',6,false);
alter table public.packages enable row level security;
revoke all on public.packages from anon, authenticated;
grant select on public.packages to anon, authenticated;
grant update (price_ngn) on public.packages to authenticated;
create policy "Anyone can read packs" on public.packages for select to anon, authenticated using (true);
create policy "Admins can edit prices" on public.packages for update to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));

-- A quote is a private capability. It locks the amount shown before a transfer.
create table public.checkout_quotes (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  username text not null,
  package_label text not null,
  price_ngn integer not null
);
alter table public.checkout_quotes enable row level security;
revoke all on public.checkout_quotes from public, anon, authenticated;

-- A global, atomic burst cap limits writes including the legacy submission RPC.
-- This is not per-user bot protection and can be exhausted by a malicious client.
create table public.submission_limits (
  action text primary key,
  window_start timestamptz not null,
  count integer not null
);
alter table public.submission_limits enable row level security;
revoke all on public.submission_limits from public, anon, authenticated;
create function public.enforce_write_burst() returns trigger
language plpgsql security definer set search_path = public, pg_temp as $$
declare n integer;
begin
  insert into public.submission_limits(action, window_start, count)
  values (tg_table_name, clock_timestamp(), 1)
  on conflict (action) do update set
    count = case when public.submission_limits.window_start < clock_timestamp() - interval '1 minute' then 1 else public.submission_limits.count + 1 end,
    window_start = case when public.submission_limits.window_start < clock_timestamp() - interval '1 minute' then clock_timestamp() else public.submission_limits.window_start end
  returning count into n;
  if n > 60 then raise exception 'Too many requests. Please try again shortly.'; end if;
  return new;
end; $$;
revoke all on function public.enforce_write_burst() from public, anon, authenticated;
create trigger limit_checkout_quotes before insert on public.checkout_quotes for each row execute function public.enforce_write_burst();
create trigger limit_order_submissions before insert on public.orders for each row execute function public.enforce_write_burst();

create function public.create_checkout_quote(p_username text, p_package text)
returns table (quote_id uuid, package_label text, price_ngn integer, created_at timestamptz)
language plpgsql security definer set search_path = public, pg_temp as $$
declare q public.checkout_quotes; v_price integer;
begin
  if p_username is null or trim(p_username) !~ '^[A-Za-z0-9_.]{2,39}$' then raise exception 'Invalid username'; end if;
  select p.price_ngn into v_price from public.packages p where p.label = p_package;
  if v_price is null then raise exception 'Invalid package'; end if;
  insert into public.checkout_quotes(username, package_label, price_ngn)
  values (trim(p_username), p_package, v_price) returning * into q;
  return query select q.id, q.package_label, q.price_ngn, q.created_at;
end; $$;
revoke all on function public.create_checkout_quote(text,text) from public;
grant execute on function public.create_checkout_quote(text,text) to anon, authenticated;

alter table public.orders add column quoted_at timestamptz;
create function public.submit_quoted_order(p_quote_id uuid, p_sender_name text, p_reference text default null)
returns uuid language plpgsql security definer set search_path = public, pg_temp as $$
declare q public.checkout_quotes;
begin
  if p_sender_name is null or length(trim(p_sender_name)) not between 2 and 100 then raise exception 'Invalid sender name'; end if;
  if length(coalesce(p_reference, '')) > 100 then raise exception 'Invalid reference'; end if;
  select * into q from public.checkout_quotes where id = p_quote_id for update;
  if q.id is null then raise exception 'Invalid order reference'; end if;
  if exists (select 1 from public.orders where id = q.id) then return q.id; end if;
  insert into public.orders(id,username,package_label,price_ngn,sender_name,transfer_reference,quoted_at)
  values(q.id,q.username,q.package_label,q.price_ngn,trim(p_sender_name),nullif(trim(p_reference),''),q.created_at);
  return q.id;
end; $$;
revoke all on function public.submit_quoted_order(uuid,text,text) from public;
grant execute on function public.submit_quoted_order(uuid,text,text) to anon, authenticated;

-- UUID is a bearer reference. Never expose username, sender or bank details.
create function public.get_order_status(p_order_id uuid)
returns table (status text, package_label text, price_ngn integer, created_at timestamptz)
language sql stable security definer set search_path = public, pg_temp as $$
  select o.status, o.package_label, o.price_ngn, o.created_at from public.orders o where o.id = p_order_id
  union all
  select 'awaiting_transfer'::text, q.package_label, q.price_ngn, q.created_at from public.checkout_quotes q
    where q.id = p_order_id and not exists (select 1 from public.orders o where o.id = q.id)
  limit 1;
$$;
revoke all on function public.get_order_status(uuid) from public;
grant execute on function public.get_order_status(uuid) to anon, authenticated;
