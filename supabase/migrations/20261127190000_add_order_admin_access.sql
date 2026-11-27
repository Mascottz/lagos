create table public.admin_users (user_id uuid primary key references auth.users(id) on delete cascade);
alter table public.admin_users enable row level security;
revoke all on public.admin_users from anon, authenticated;
grant select on public.admin_users to authenticated;
create policy "Admins can see their own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());
grant select on public.orders to authenticated;
grant update (status) on public.orders to authenticated;
create policy "Admins can read orders" on public.orders for select to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "Admins can update order status" on public.orders for update to authenticated using (exists (select 1 from public.admin_users where user_id = auth.uid())) with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
