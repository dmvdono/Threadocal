begin;

drop policy if exists "Public can read approved brand categories" on public.brand_categories;
drop policy if exists "Brand owners can read their brand categories" on public.brand_categories;
drop policy if exists "Brand owners can insert their brand categories" on public.brand_categories;
drop policy if exists "Brand owners can update their brand categories" on public.brand_categories;
drop policy if exists "Brand owners can delete their brand categories" on public.brand_categories;

revoke all on function public.save_brand_categories(uuid, text[]) from public;
revoke all on function public.save_brand_categories(uuid, text[]) from anon;
revoke all on function public.save_brand_categories(uuid, text[]) from authenticated;
drop function if exists public.save_brand_categories(uuid, text[]);

drop index if exists public.brand_categories_brand_category_key;
drop index if exists public.brand_categories_category_idx;
drop index if exists public.brand_categories_brand_id_idx;

drop table if exists public.brand_categories;

commit;
