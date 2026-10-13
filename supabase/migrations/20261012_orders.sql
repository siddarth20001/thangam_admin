BEGIN;
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number bigint generated always as identity unique,
  customer_name text not null check (length(trim(customer_name)) > 0),
  customer_phone text not null,
  customer_email text,
  total numeric(12,2) not null check (total >= 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled')),
  created_at timestamptz not null default now()
);
alter table public.orders enable row level security;
grant select, insert, update, delete on public.orders to authenticated;
grant usage, select on sequence public.orders_order_number_seq to authenticated;
create policy "Admin order access" on public.orders for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
COMMIT;
