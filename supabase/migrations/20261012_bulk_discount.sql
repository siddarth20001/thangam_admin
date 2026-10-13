BEGIN;
create or replace function public.apply_catalog_discount(p_percent numeric)
returns integer language plpgsql security invoker set search_path = '' as $$
declare affected integer;
begin
  if not exists(select 1 from public.admin_users where user_id = auth.uid()) then
    raise exception 'Admin access required' using errcode = '42501';
  end if;
  if p_percent is null or p_percent < 0 or p_percent > 100 or p_percent::text = 'NaN' then
    raise exception 'Discount must be between 0 and 100';
  end if;
  update public.products p set discount_percent = p_percent
  from public.categories c where c.id = p.category_id and c.discountable;
  get diagnostics affected = row_count;
  return affected;
end;
$$;
revoke all on function public.apply_catalog_discount(numeric) from public, anon;
grant execute on function public.apply_catalog_discount(numeric) to authenticated;
COMMIT;
