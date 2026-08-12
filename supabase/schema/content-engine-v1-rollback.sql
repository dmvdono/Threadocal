begin;

drop policy if exists "Admins can manage story tags" on public.story_tags;
drop policy if exists "Public can read published story tags" on public.story_tags;
drop policy if exists "Admins can manage story products" on public.story_products;
drop policy if exists "Public can read published story products" on public.story_products;
drop policy if exists "Admins can manage story brands" on public.story_brands;
drop policy if exists "Public can read published story brands" on public.story_brands;
drop policy if exists "Admins can manage editorial stories" on public.editorial_stories;
drop policy if exists "Public can read published editorial stories" on public.editorial_stories;

drop table if exists public.story_tags;
drop table if exists public.story_products;
drop table if exists public.story_brands;
drop table if exists public.editorial_stories;

commit;
