begin;

create extension if not exists pgcrypto;

create table if not exists public.editorial_stories (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  subtitle text,
  excerpt text,
  body text not null default '',
  status text not null default 'draft',
  story_type text not null default 'brand-spotlight',
  author_name text,
  published_at timestamptz,
  featured boolean not null default false,
  hero_image_url text,
  hero_image_alt text,
  city text,
  state text,
  read_time_minutes integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.editorial_stories add column if not exists subtitle text;
alter table public.editorial_stories add column if not exists excerpt text;
alter table public.editorial_stories add column if not exists body text not null default '';
alter table public.editorial_stories add column if not exists status text not null default 'draft';
alter table public.editorial_stories add column if not exists story_type text not null default 'brand-spotlight';
alter table public.editorial_stories add column if not exists author_name text;
alter table public.editorial_stories add column if not exists published_at timestamptz;
alter table public.editorial_stories add column if not exists featured boolean not null default false;
alter table public.editorial_stories add column if not exists hero_image_url text;
alter table public.editorial_stories add column if not exists hero_image_alt text;
alter table public.editorial_stories add column if not exists city text;
alter table public.editorial_stories add column if not exists state text;
alter table public.editorial_stories add column if not exists read_time_minutes integer;
alter table public.editorial_stories add column if not exists created_at timestamptz not null default now();
alter table public.editorial_stories add column if not exists updated_at timestamptz not null default now();

alter table public.editorial_stories alter column id set default gen_random_uuid();
alter table public.editorial_stories alter column body set default '';
alter table public.editorial_stories alter column status set default 'draft';
alter table public.editorial_stories alter column story_type set default 'brand-spotlight';
alter table public.editorial_stories alter column featured set default false;
alter table public.editorial_stories alter column created_at set default now();
alter table public.editorial_stories alter column updated_at set default now();

alter table public.editorial_stories
drop constraint if exists editorial_stories_slug_format_check;

alter table public.editorial_stories
add constraint editorial_stories_slug_format_check
check (
  slug = lower(slug)
  and length(slug) between 3 and 90
  and slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
);

alter table public.editorial_stories
drop constraint if exists editorial_stories_status_check;

alter table public.editorial_stories
add constraint editorial_stories_status_check
check (status in ('draft', 'published', 'unpublished'));

alter table public.editorial_stories
drop constraint if exists editorial_stories_story_type_check;

alter table public.editorial_stories
add constraint editorial_stories_story_type_check
check (story_type in (
  'founder-story',
  'brand-spotlight',
  'drop-coverage',
  'city-guide',
  'style-guide',
  'creator-story',
  'community',
  'original'
));

alter table public.editorial_stories
drop constraint if exists editorial_stories_read_time_check;

alter table public.editorial_stories
add constraint editorial_stories_read_time_check
check (read_time_minutes is null or read_time_minutes between 1 and 60);

create table if not exists public.story_brands (
  story_id uuid not null references public.editorial_stories(id) on delete cascade,
  brand_id uuid not null references public.brands(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (story_id, brand_id)
);

create table if not exists public.story_products (
  story_id uuid not null references public.editorial_stories(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (story_id, product_id)
);

create table if not exists public.story_tags (
  story_id uuid not null references public.editorial_stories(id) on delete cascade,
  tag text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  primary key (story_id, tag)
);

alter table public.story_brands alter column sort_order set default 0;
alter table public.story_products alter column sort_order set default 0;
alter table public.story_tags alter column sort_order set default 0;

alter table public.story_brands
drop constraint if exists story_brands_sort_order_check;
alter table public.story_brands
add constraint story_brands_sort_order_check
check (sort_order >= 0);

alter table public.story_products
drop constraint if exists story_products_sort_order_check;
alter table public.story_products
add constraint story_products_sort_order_check
check (sort_order >= 0);

alter table public.story_tags
drop constraint if exists story_tags_sort_order_check;
alter table public.story_tags
add constraint story_tags_sort_order_check
check (sort_order >= 0);

alter table public.story_tags
drop constraint if exists story_tags_tag_format_check;
alter table public.story_tags
add constraint story_tags_tag_format_check
check (
  tag = lower(tag)
  and length(tag) between 2 and 50
  and tag ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'
);

create unique index if not exists editorial_stories_slug_key
on public.editorial_stories using btree (slug);

create index if not exists editorial_stories_status_published_at_idx
on public.editorial_stories using btree (status, published_at desc);

create index if not exists editorial_stories_story_type_idx
on public.editorial_stories using btree (story_type);

create index if not exists editorial_stories_featured_idx
on public.editorial_stories using btree (featured, published_at desc)
where status = 'published';

create index if not exists story_brands_brand_id_idx
on public.story_brands using btree (brand_id);

create index if not exists story_products_product_id_idx
on public.story_products using btree (product_id);

create index if not exists story_tags_tag_idx
on public.story_tags using btree (tag);

alter table public.editorial_stories enable row level security;
alter table public.story_brands enable row level security;
alter table public.story_products enable row level security;
alter table public.story_tags enable row level security;

grant select on public.editorial_stories, public.story_brands, public.story_products, public.story_tags to anon, authenticated;
grant insert, update, delete on public.editorial_stories, public.story_brands, public.story_products, public.story_tags to authenticated;

drop policy if exists "Public can read published editorial stories" on public.editorial_stories;
create policy "Public can read published editorial stories"
on public.editorial_stories
for select
to anon, authenticated
using (status = 'published');

drop policy if exists "Admins can manage editorial stories" on public.editorial_stories;
create policy "Admins can manage editorial stories"
on public.editorial_stories
for all
to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Public can read published story brands" on public.story_brands;
create policy "Public can read published story brands"
on public.story_brands
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.editorial_stories
    where editorial_stories.id = story_brands.story_id
      and editorial_stories.status = 'published'
  )
  and exists (
    select 1
    from public.brands
    where brands.id = story_brands.brand_id
      and brands.approval_status = 'approved'
  )
);

drop policy if exists "Admins can manage story brands" on public.story_brands;
create policy "Admins can manage story brands"
on public.story_brands
for all
to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Public can read published story products" on public.story_products;
create policy "Public can read published story products"
on public.story_products
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.editorial_stories
    where editorial_stories.id = story_products.story_id
      and editorial_stories.status = 'published'
  )
  and exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = story_products.product_id
      and products.status = 'published'
      and brands.approval_status = 'approved'
  )
);

drop policy if exists "Admins can manage story products" on public.story_products;
create policy "Admins can manage story products"
on public.story_products
for all
to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

drop policy if exists "Public can read published story tags" on public.story_tags;
create policy "Public can read published story tags"
on public.story_tags
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.editorial_stories
    where editorial_stories.id = story_tags.story_id
      and editorial_stories.status = 'published'
  )
);

drop policy if exists "Admins can manage story tags" on public.story_tags;
create policy "Admins can manage story tags"
on public.story_tags
for all
to authenticated
using (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'))
with check (exists (select 1 from public.profiles where id = auth.uid() and role = 'admin'));

commit;
