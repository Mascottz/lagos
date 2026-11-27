create function public.admin_get_unsubmitted_quote(p_quote_id uuid)
returns table (id uuid, created_at timestamptz, username text, package_label text, price_ngn integer)
language plpgsql security definer set search_path = public, pg_temp as $$
begin
  if not exists (select 1 from public.admin_users where user_id = auth.uid()) then raise exception 'Not authorized'; end if;
  return query select q.id, q.created_at, q.username, q.package_label, q.price_ngn
    from public.checkout_quotes q where q.id = p_quote_id
      and not exists (select 1 from public.orders o where o.id = q.id);
end; $$;
revoke all on function public.admin_get_unsubmitted_quote(uuid) from public, anon;
grant execute on function public.admin_get_unsubmitted_quote(uuid) to authenticated;
