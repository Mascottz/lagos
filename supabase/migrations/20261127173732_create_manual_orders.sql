create table public.orders (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  username text not null,
  package_label text not null,
  price_ngn integer not null,
  sender_name text not null,
  transfer_reference text,
  status text not null default 'pending_review' check (status in ('pending_review', 'paid', 'delivered', 'cancelled'))
);
alter table public.orders enable row level security;
revoke all on public.orders from anon, authenticated;
create or replace function public.submit_manual_order(p_username text, p_package text, p_sender_name text, p_reference text default null)
returns uuid language plpgsql security definer set search_path = public as $$
declare v_price integer; v_id uuid;
begin
  if length(trim(p_username)) < 2 or length(trim(p_username)) > 40 or p_username !~ '^[A-Za-z0-9_.@]+$' then raise exception 'Invalid username'; end if;
  if length(trim(p_sender_name)) < 2 or length(trim(p_sender_name)) > 100 then raise exception 'Invalid sender name'; end if;
  if length(coalesce(p_reference, '')) > 100 then raise exception 'Invalid reference'; end if;
  v_price := case p_package when '1B' then 100 when '20B' then 500 when '50B' then 1000 when '120B' then 2000 when '200B' then 3000 when '500B' then 5000 else null end;
  if v_price is null then raise exception 'Invalid package'; end if;
  insert into public.orders(username, package_label, price_ngn, sender_name, transfer_reference) values (trim(p_username), p_package, v_price, trim(p_sender_name), nullif(trim(p_reference), '')) returning id into v_id;
  return v_id;
end; $$;
revoke all on function public.submit_manual_order(text,text,text,text) from public;
grant execute on function public.submit_manual_order(text,text,text,text) to anon, authenticated;
