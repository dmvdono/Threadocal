begin;

create extension if not exists pgcrypto;

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid()
);

alter table public.brands add column if not exists owner_id uuid;
alter table public.brands add column if not exists owner_profile_id uuid;
alter table public.brands add column if not exists name text;
alter table public.brands add column if not exists brand_name text;
alter table public.brands add column if not exists username text;
alter table public.brands add column if not exists owner_name text;
alter table public.brands add column if not exists email text;
alter table public.brands add column if not exists slug text;
alter table public.brands add column if not exists tagline text;
alter table public.brands add column if not exists description text;
alter table public.brands add column if not exists bio text;
alter table public.brands add column if not exists category text;
alter table public.brands add column if not exists location text;
alter table public.brands add column if not exists logo_url text;
alter table public.brands add column if not exists logo_moderation_status text not null default 'pending';
alter table public.brands add column if not exists logo_reviewed_at timestamptz;
alter table public.brands add column if not exists logo_reviewed_by uuid;
alter table public.brands add column if not exists banner_url text;
alter table public.brands add column if not exists banner_moderation_status text not null default 'pending';
alter table public.brands add column if not exists banner_reviewed_at timestamptz;
alter table public.brands add column if not exists banner_reviewed_by uuid;
alter table public.brands add column if not exists city text;
alter table public.brands add column if not exists state text;
alter table public.brands add column if not exists zip_code text;
alter table public.brands add column if not exists website_url text;
alter table public.brands add column if not exists instagram_url text;
alter table public.brands add column if not exists tiktok_url text;
alter table public.brands add column if not exists youtube_url text;
alter table public.brands add column if not exists verified boolean not null default false;
alter table public.brands add column if not exists approval_status text not null default 'pending_review';
alter table public.brands add column if not exists pickup_available boolean not null default true;
alter table public.brands add column if not exists created_at timestamptz not null default now();
alter table public.brands add column if not exists updated_at timestamptz not null default now();

alter table public.brands alter column id set default gen_random_uuid();
alter table public.brands alter column logo_moderation_status set default 'pending';
alter table public.brands alter column banner_moderation_status set default 'pending';
alter table public.brands alter column approval_status set default 'pending_review';
alter table public.brands alter column verified set default false;
alter table public.brands alter column pickup_available set default true;
alter table public.brands alter column created_at set default now();
alter table public.brands alter column updated_at set default now();

do $$
declare
  owner_id_data_type text;
begin
  select data_type
  into owner_id_data_type
  from information_schema.columns
  where table_schema = 'public'
  and table_name = 'brands'
  and column_name = 'owner_id';

  if owner_id_data_type = 'uuid' then
    update public.brands
    set owner_profile_id = owner_id
    where owner_profile_id is null
    and owner_id is not null;

    update public.brands
    set owner_id = owner_profile_id
    where owner_id is null
    and owner_profile_id is not null;
  else
    update public.brands
    set owner_profile_id = owner_id::text::uuid
    where owner_profile_id is null
    and owner_id is not null
    and owner_id::text ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$';
  end if;
end $$;

update public.brands
set name = coalesce(nullif(name, ''), nullif(brand_name, ''))
where name is null or name = '';

update public.brands
set brand_name = coalesce(nullif(brand_name, ''), nullif(name, ''))
where brand_name is null or brand_name = '';

update public.brands
set username = coalesce(nullif(username, ''), nullif(slug, ''))
where username is null or username = '';

update public.brands
set slug = coalesce(nullif(slug, ''), nullif(username, ''))
where slug is null or slug = '';

update public.brands
set bio = coalesce(nullif(bio, ''), nullif(description, ''))
where bio is null or bio = '';

update public.brands
set description = coalesce(nullif(description, ''), nullif(bio, ''))
where description is null or description = '';

update public.brands
set location = coalesce(nullif(location, ''), nullif(city, ''))
where location is null or location = '';

update public.brands
set owner_name = profiles.full_name
from public.profiles
where public.brands.owner_profile_id = profiles.id
and (public.brands.owner_name is null or public.brands.owner_name = '');

update public.brands
set email = profiles.email
from public.profiles
where public.brands.owner_profile_id = profiles.id
and (public.brands.email is null or public.brands.email = '');

-- Run these checks before creating the unique owner index in production.
-- If either query returns rows, keep the oldest row for each key and remove or merge the others before continuing.
select owner_profile_id, count(*) as duplicate_brand_rows
from public.brands
where owner_profile_id is not null
group by owner_profile_id
having count(*) > 1;

select id, count(*) as duplicate_profile_rows
from public.profiles
group by id
having count(*) > 1;

select lower(email) as email, count(*) as duplicate_profile_email_rows
from public.profiles
where email is not null
group by lower(email)
having count(*) > 1;

create table if not exists public.products (
  id uuid primary key default gen_random_uuid()
);

alter table public.products add column if not exists brand_id uuid;
alter table public.products add column if not exists name text;
alter table public.products add column if not exists slug text;
alter table public.products add column if not exists description text;
alter table public.products add column if not exists category text;
alter table public.products add column if not exists price_cents integer not null default 0;
alter table public.products add column if not exists sale_price_cents integer;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists release_date date;
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists pickup_available boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.products alter column id set default gen_random_uuid();
alter table public.products alter column price_cents set default 0;
alter table public.products alter column tags set default '{}';
alter table public.products alter column status set default 'draft';
alter table public.products alter column pickup_available set default true;
alter table public.products alter column created_at set default now();
alter table public.products alter column updated_at set default now();

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid()
);

alter table public.product_images add column if not exists product_id uuid;
alter table public.product_images add column if not exists image_url text;
alter table public.product_images add column if not exists alt_text text;
alter table public.product_images add column if not exists sort_order integer not null default 0;
alter table public.product_images add column if not exists moderation_status text not null default 'pending';
alter table public.product_images add column if not exists reviewed_at timestamptz;
alter table public.product_images add column if not exists reviewed_by uuid;
alter table public.product_images add column if not exists created_at timestamptz not null default now();

alter table public.product_images alter column id set default gen_random_uuid();
alter table public.product_images alter column sort_order set default 0;
alter table public.product_images alter column moderation_status set default 'pending';
alter table public.product_images alter column created_at set default now();

create table if not exists public.product_variants (
  id uuid primary key default gen_random_uuid()
);

alter table public.product_variants add column if not exists product_id uuid;
alter table public.product_variants add column if not exists size text;
alter table public.product_variants add column if not exists color text;
alter table public.product_variants add column if not exists sku text;
alter table public.product_variants add column if not exists created_at timestamptz not null default now();

alter table public.product_variants alter column id set default gen_random_uuid();
alter table public.product_variants alter column created_at set default now();

create table if not exists public.product_inventory (
  product_variant_id uuid primary key
);

alter table public.product_inventory add column if not exists stock_quantity integer not null default 0;
alter table public.product_inventory add column if not exists updated_at timestamptz not null default now();

alter table public.product_inventory alter column stock_quantity set default 0;
alter table public.product_inventory alter column updated_at set default now();

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid()
);

alter table public.orders add column if not exists customer_profile_id uuid;
alter table public.orders add column if not exists brand_id uuid;
alter table public.orders add column if not exists fulfillment_method text not null default 'shipping';
alter table public.orders add column if not exists status text not null default 'order_placed';
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists subtotal_cents integer not null default 0;
alter table public.orders add column if not exists shipping_cents integer not null default 0;
alter table public.orders add column if not exists tax_cents integer not null default 0;
alter table public.orders add column if not exists total_cents integer not null default 0;
alter table public.orders add column if not exists currency text not null default 'usd';
alter table public.orders add column if not exists pickup_location text;
alter table public.orders add column if not exists pickup_slot text;
alter table public.orders add column if not exists shipping_full_name text;
alter table public.orders add column if not exists shipping_line1 text;
alter table public.orders add column if not exists shipping_line2 text;
alter table public.orders add column if not exists shipping_city text;
alter table public.orders add column if not exists shipping_state text;
alter table public.orders add column if not exists shipping_zip_code text;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists dispute_reason text;
alter table public.orders add column if not exists dispute_notes text;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

alter table public.orders alter column id set default gen_random_uuid();
alter table public.orders alter column fulfillment_method set default 'shipping';
alter table public.orders alter column status set default 'order_placed';
alter table public.orders alter column payment_status set default 'pending';
alter table public.orders alter column subtotal_cents set default 0;
alter table public.orders alter column shipping_cents set default 0;
alter table public.orders alter column tax_cents set default 0;
alter table public.orders alter column total_cents set default 0;
alter table public.orders alter column currency set default 'usd';
alter table public.orders alter column created_at set default now();
alter table public.orders alter column updated_at set default now();

create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid()
);

alter table public.order_items add column if not exists order_id uuid;
alter table public.order_items add column if not exists product_id uuid;
alter table public.order_items add column if not exists product_variant_id uuid;
alter table public.order_items add column if not exists product_name text;
alter table public.order_items add column if not exists brand_name text;
alter table public.order_items add column if not exists selected_size text;
alter table public.order_items add column if not exists selected_color text;
alter table public.order_items add column if not exists sku text;
alter table public.order_items add column if not exists quantity integer not null default 1;
alter table public.order_items add column if not exists unit_price_cents integer not null default 0;
alter table public.order_items add column if not exists line_total_cents integer not null default 0;
alter table public.order_items add column if not exists created_at timestamptz not null default now();

alter table public.order_items alter column id set default gen_random_uuid();
alter table public.order_items alter column quantity set default 1;
alter table public.order_items alter column unit_price_cents set default 0;
alter table public.order_items alter column line_total_cents set default 0;
alter table public.order_items alter column created_at set default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brands_owner_profile_id_fkey'
    and conrelid = 'public.brands'::regclass
  ) then
    alter table public.brands
    add constraint brands_owner_profile_id_fkey
    foreign key (owner_profile_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_customer_profile_id_fkey'
    and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
    add constraint orders_customer_profile_id_fkey
    foreign key (customer_profile_id) references public.profiles(id) on delete set null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'orders_brand_id_fkey'
    and conrelid = 'public.orders'::regclass
  ) then
    alter table public.orders
    add constraint orders_brand_id_fkey
    foreign key (brand_id) references public.brands(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'order_items_order_id_fkey'
    and conrelid = 'public.order_items'::regclass
  ) then
    alter table public.order_items
    add constraint order_items_order_id_fkey
    foreign key (order_id) references public.orders(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'products_brand_id_fkey'
    and conrelid = 'public.products'::regclass
  ) then
    alter table public.products
    add constraint products_brand_id_fkey
    foreign key (brand_id) references public.brands(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_images_product_id_fkey'
    and conrelid = 'public.product_images'::regclass
  ) then
    alter table public.product_images
    add constraint product_images_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_variants_product_id_fkey'
    and conrelid = 'public.product_variants'::regclass
  ) then
    alter table public.product_variants
    add constraint product_variants_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_inventory_product_variant_id_fkey'
    and conrelid = 'public.product_inventory'::regclass
  ) then
    alter table public.product_inventory
    add constraint product_inventory_product_variant_id_fkey
    foreign key (product_variant_id) references public.product_variants(id) on delete cascade;
  end if;
end $$;

alter table public.brands
drop constraint if exists brands_approval_status_check;

alter table public.brands
add constraint brands_approval_status_check
check (approval_status in ('pending_review', 'approved', 'rejected', 'suspended'));

alter table public.brands
drop constraint if exists brands_logo_moderation_status_check;

alter table public.brands
add constraint brands_logo_moderation_status_check
check (logo_moderation_status in ('pending', 'approved', 'rejected'));

alter table public.brands
drop constraint if exists brands_banner_moderation_status_check;

alter table public.brands
add constraint brands_banner_moderation_status_check
check (banner_moderation_status in ('pending', 'approved', 'rejected'));

alter table public.products
drop constraint if exists products_status_check;

alter table public.products
add constraint products_status_check
check (status in ('draft', 'published', 'hidden', 'archived'));

alter table public.products
drop constraint if exists products_price_cents_check;

alter table public.products
add constraint products_price_cents_check
check (price_cents >= 0);

alter table public.products
drop constraint if exists products_sale_price_cents_check;

alter table public.products
add constraint products_sale_price_cents_check
check (sale_price_cents is null or sale_price_cents >= 0);

alter table public.product_inventory
drop constraint if exists product_inventory_stock_quantity_check;

alter table public.product_inventory
add constraint product_inventory_stock_quantity_check
check (stock_quantity >= 0);

alter table public.product_images
drop constraint if exists product_images_moderation_status_check;

alter table public.product_images
add constraint product_images_moderation_status_check
check (moderation_status in ('pending', 'approved', 'rejected'));

alter table public.orders
drop constraint if exists orders_fulfillment_method_check;

alter table public.orders
add constraint orders_fulfillment_method_check
check (fulfillment_method in ('shipping', 'local_pickup'));

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (status in ('order_placed', 'brand_preparing', 'shipped', 'delivered', 'ready_for_pickup', 'picked_up', 'completed', 'disputed', 'cancelled'));

alter table public.orders
drop constraint if exists orders_payment_status_check;

alter table public.orders
add constraint orders_payment_status_check
check (payment_status in ('pending', 'paid', 'failed', 'refunded'));

alter table public.order_items
drop constraint if exists order_items_quantity_check;

alter table public.order_items
add constraint order_items_quantity_check
check (quantity > 0);

create unique index if not exists brands_slug_key on public.brands using btree (slug);
do $$
begin
  if not exists (
    select 1
    from public.brands
    where owner_profile_id is not null
    group by owner_profile_id
    having count(*) > 1
  ) then
    create unique index if not exists brands_owner_profile_id_key
    on public.brands using btree (owner_profile_id)
    where owner_profile_id is not null;
  else
    raise notice 'Skipped brands_owner_profile_id_key because duplicate owner_profile_id rows exist. Merge duplicates, then rerun this migration.';
  end if;
end $$;
create unique index if not exists products_brand_id_slug_key on public.products using btree (brand_id, slug);
create unique index if not exists product_variants_product_id_size_color_key on public.product_variants using btree (product_id, size, color);

create index if not exists brands_owner_profile_id_idx on public.brands using btree (owner_profile_id);
create index if not exists brands_approval_status_idx on public.brands using btree (approval_status);
create index if not exists brands_logo_moderation_status_idx on public.brands using btree (logo_moderation_status);
create index if not exists brands_banner_moderation_status_idx on public.brands using btree (banner_moderation_status);
create index if not exists products_brand_id_idx on public.products using btree (brand_id);
create index if not exists products_status_idx on public.products using btree (status);
create index if not exists product_images_product_id_idx on public.product_images using btree (product_id);
create index if not exists product_images_moderation_status_idx on public.product_images using btree (moderation_status);
create index if not exists product_variants_product_id_idx on public.product_variants using btree (product_id);
create unique index if not exists orders_stripe_checkout_session_id_key on public.orders using btree (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
create index if not exists orders_customer_profile_id_idx on public.orders using btree (customer_profile_id);
create index if not exists orders_brand_id_idx on public.orders using btree (brand_id);
create index if not exists orders_status_idx on public.orders using btree (status);
create index if not exists orders_fulfillment_method_idx on public.orders using btree (fulfillment_method);
create index if not exists order_items_order_id_idx on public.order_items using btree (order_id);
create index if not exists order_items_product_variant_id_idx on public.order_items using btree (product_variant_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('brand-logos', 'brand-logos', true, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('brand-banners', 'brand-banners', true, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-images', 'product-images', true, 26214400, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read marketplace image uploads" on storage.objects;
create policy "Public can read marketplace image uploads"
on storage.objects
for select
to anon, authenticated
using (bucket_id in ('brand-logos', 'brand-banners', 'product-images'));

drop policy if exists "Brand owners can upload marketplace images" on storage.objects;
create policy "Brand owners can upload marketplace images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id in ('brand-logos', 'brand-banners', 'product-images')
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('brand_owner', 'admin'))
);

drop policy if exists "Brand owners can update marketplace images" on storage.objects;
create policy "Brand owners can update marketplace images"
on storage.objects
for update
to authenticated
using (
  bucket_id in ('brand-logos', 'brand-banners', 'product-images')
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('brand_owner', 'admin'))
)
with check (
  bucket_id in ('brand-logos', 'brand-banners', 'product-images')
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('brand_owner', 'admin'))
);

alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;

grant select on public.brands, public.products, public.product_images, public.product_variants, public.product_inventory to anon, authenticated;
grant insert, update, delete on public.brands, public.products, public.product_images, public.product_variants, public.product_inventory to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant insert, update on public.orders, public.order_items to authenticated;

drop policy if exists "Customers can read approved brands" on public.brands;
create policy "Customers can read approved brands"
on public.brands
for select
to anon, authenticated
using (approval_status = 'approved');

drop policy if exists "Brand owners can read their brands" on public.brands;
create policy "Brand owners can read their brands"
on public.brands
for select
to authenticated
using (
  owner_profile_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Brand owners can insert their brands" on public.brands;
create policy "Brand owners can insert their brands"
on public.brands
for insert
to authenticated
with check (
  owner_profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role in ('brand_owner', 'admin'))
);

drop policy if exists "Brand owners can update their brands" on public.brands;
create policy "Brand owners can update their brands"
on public.brands
for update
to authenticated
using (
  owner_profile_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  owner_profile_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Brand owners can delete their brands" on public.brands;
create policy "Brand owners can delete their brands"
on public.brands
for delete
to authenticated
using (
  owner_profile_id = auth.uid()
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Customers can read published products" on public.products;
create policy "Customers can read published products"
on public.products
for select
to anon, authenticated
using (
  status = 'published'
  and exists (
    select 1 from public.brands
    where brands.id = products.brand_id
    and brands.approval_status = 'approved'
  )
);

drop policy if exists "Brand owners can manage their products" on public.products;
create policy "Brand owners can manage their products"
on public.products
for all
to authenticated
using (
  exists (
    select 1 from public.brands
    where brands.id = products.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
)
with check (
  exists (
    select 1 from public.brands
    where brands.id = products.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Customers can read published product images" on public.product_images;
create policy "Customers can read published product images"
on public.product_images
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_images.product_id
    and products.status = 'published'
    and brands.approval_status = 'approved'
    and product_images.moderation_status = 'approved'
  )
);

drop policy if exists "Brand owners can manage product images" on public.product_images;
create policy "Brand owners can manage product images"
on public.product_images
for all
to authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_images.product_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
)
with check (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_images.product_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Customers can read published product variants" on public.product_variants;
create policy "Customers can read published product variants"
on public.product_variants
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_variants.product_id
    and products.status = 'published'
    and brands.approval_status = 'approved'
  )
);

drop policy if exists "Brand owners can manage product variants" on public.product_variants;
create policy "Brand owners can manage product variants"
on public.product_variants
for all
to authenticated
using (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_variants.product_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
)
with check (
  exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_variants.product_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Customers can read published product inventory" on public.product_inventory;
create policy "Customers can read published product inventory"
on public.product_inventory
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.product_variants
    join public.products on products.id = product_variants.product_id
    join public.brands on brands.id = products.brand_id
    where product_variants.id = product_inventory.product_variant_id
    and products.status = 'published'
    and brands.approval_status = 'approved'
  )
);

drop policy if exists "Brand owners can manage product inventory" on public.product_inventory;
create policy "Brand owners can manage product inventory"
on public.product_inventory
for all
to authenticated
using (
  exists (
    select 1
    from public.product_variants
    join public.products on products.id = product_variants.product_id
    join public.brands on brands.id = products.brand_id
    where product_variants.id = product_inventory.product_variant_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
)
with check (
  exists (
    select 1
    from public.product_variants
    join public.products on products.id = product_variants.product_id
    join public.brands on brands.id = products.brand_id
    where product_variants.id = product_inventory.product_variant_id
    and (
      brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Customers can read their orders" on public.orders;
create policy "Customers can read their orders"
on public.orders
for select
to authenticated
using (
  customer_profile_id = auth.uid()
  or exists (
    select 1 from public.brands
    where brands.id = orders.brand_id
    and brands.owner_profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Customers can insert their pending orders" on public.orders;
create policy "Customers can insert their pending orders"
on public.orders
for insert
to authenticated
with check (
  customer_profile_id = auth.uid()
  and payment_status = 'pending'
);

drop policy if exists "Brand owners and admins can update orders" on public.orders;
create policy "Brand owners and admins can update orders"
on public.orders
for update
to authenticated
using (
  customer_profile_id = auth.uid()
  or exists (
    select 1 from public.brands
    where brands.id = orders.brand_id
    and brands.owner_profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
)
with check (
  customer_profile_id = auth.uid()
  or exists (
    select 1 from public.brands
    where brands.id = orders.brand_id
    and brands.owner_profile_id = auth.uid()
  )
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Order participants can read order items" on public.order_items;
create policy "Order participants can read order items"
on public.order_items
for select
to authenticated
using (
  exists (
    select 1 from public.orders
    left join public.brands on brands.id = orders.brand_id
    where orders.id = order_items.order_id
    and (
      orders.customer_profile_id = auth.uid()
      or brands.owner_profile_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Customers can insert their pending order items" on public.order_items;
create policy "Customers can insert their pending order items"
on public.order_items
for insert
to authenticated
with check (
  exists (
    select 1 from public.orders
    where orders.id = order_items.order_id
    and orders.customer_profile_id = auth.uid()
    and orders.payment_status = 'pending'
  )
);

commit;
