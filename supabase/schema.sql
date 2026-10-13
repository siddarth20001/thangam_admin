-- Run once in the Supabase SQL editor. No catalog rows are inserted automatically.
create table public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade
);
alter table public.admin_users enable row level security;
create policy "Admins can read own membership" on public.admin_users for select to authenticated using (user_id = auth.uid());
create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique check (length(trim(name)) > 0),
  discountable boolean not null default true
);
create table public.products (
  id uuid primary key default gen_random_uuid(),
  serial integer not null unique check (serial > 0),
  name text not null check (length(trim(name)) > 0),
  price numeric(12,2) not null check (price >= 0),
  unit text not null,
  category_id uuid not null references public.categories(id) on delete restrict,
  discount_percent numeric(5,2) not null default 0 check (discount_percent >= 0 and discount_percent <= 100),
  active boolean not null default true
);
alter table public.categories enable row level security;
alter table public.products enable row level security;
create policy "Admin category access" on public.categories for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
create policy "Admin product access" on public.products for all to authenticated
  using (exists (select 1 from public.admin_users where user_id = auth.uid()))
  with check (exists (select 1 from public.admin_users where user_id = auth.uid()));
-- Create an admin in Authentication > Users, then add its UUID using the SQL editor:
-- insert into public.admin_users (user_id) values ('YOUR_ADMIN_USER_UUID');
-- Public website read policies can be added when the website requirements are defined.
