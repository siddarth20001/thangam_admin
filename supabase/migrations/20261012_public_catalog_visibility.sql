BEGIN;
-- Public storefront users may read only enabled products. Admins keep their existing full access.
drop policy if exists "Storefront active products" on public.products;
create policy "Storefront active products" on public.products
  for select to anon, authenticated using (active = true);
drop policy if exists "Storefront categories" on public.categories;
create policy "Storefront categories" on public.categories
  for select to anon, authenticated using (true);
COMMIT;
