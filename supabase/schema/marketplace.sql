begin;

create extension if not exists pgcrypto;

alter table public.profiles add column if not exists username text;
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists avatar_path text;
alter table public.profiles add column if not exists city text;
alter table public.profiles add column if not exists state text;
alter table public.profiles add column if not exists zip_code text;
alter table public.profiles add column if not exists updated_at timestamptz not null default now();

alter table public.profiles alter column updated_at set default now();

update public.profiles
set username = lower(username)
where username is not null
and username <> lower(username);

alter table public.profiles
drop constraint if exists profiles_username_format_check;

alter table public.profiles
add constraint profiles_username_format_check
check (
  username is null
  or (
    username = lower(username)
    and length(username) between 3 and 30
    and username ~ '^[a-z0-9_-]+$'
    and username not in (
      'admin',
      'administrator',
      'account',
      'shop',
      'brands',
      'brand',
      'login',
      'signup',
      'checkout',
      'cart',
      'dashboard',
      'orders',
      'api',
      'support',
      'help',
      'threadocal'
    )
  )
) not valid;

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

create table if not exists public.brand_categories (
  id uuid primary key default gen_random_uuid(),
  brand_id uuid not null references public.brands(id) on delete cascade,
  category text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.brand_categories alter column id set default gen_random_uuid();
alter table public.brand_categories alter column sort_order set default 0;
alter table public.brand_categories alter column created_at set default now();
alter table public.brand_categories alter column updated_at set default now();

alter table public.brand_categories
drop constraint if exists brand_categories_category_check;

alter table public.brand_categories
add constraint brand_categories_category_check
check (category in (
  'streetwear',
  'sportswear',
  'vintage',
  'luxury',
  'handmade',
  'sustainable',
  'college-brands',
  'footwear',
  'jewelry',
  'bags-backpacks',
  'hats',
  'accessories',
  'other'
));

alter table public.brand_categories
drop constraint if exists brand_categories_sort_order_check;

alter table public.brand_categories
add constraint brand_categories_sort_order_check
check (sort_order >= 0);

insert into public.brand_categories (brand_id, category, sort_order)
select
  brands.id,
  case
    when lower(trim(brands.category)) in ('streetwear', 'graphic') then 'streetwear'
    when lower(trim(brands.category)) in ('sportswear', 'athletic', 'sportswear / athletic') then 'sportswear'
    when lower(trim(brands.category)) = 'vintage' then 'vintage'
    when lower(trim(brands.category)) = 'luxury' then 'luxury'
    when lower(trim(brands.category)) = 'handmade' then 'handmade'
    when lower(trim(brands.category)) = 'sustainable' then 'sustainable'
    when lower(trim(brands.category)) in ('college brands', 'college-brands', 'college / campus') then 'college-brands'
    when lower(trim(brands.category)) in ('footwear', 'shoes / footwear') then 'footwear'
    when lower(trim(brands.category)) = 'jewelry' then 'jewelry'
    when lower(trim(brands.category)) in ('bags / backpacks', 'bags-backpacks') then 'bags-backpacks'
    when lower(trim(brands.category)) = 'hats' then 'hats'
    when lower(trim(brands.category)) = 'accessories' then 'accessories'
    when lower(trim(brands.category)) = 'other' then 'other'
    else 'other'
  end,
  0
from public.brands
where brands.category is not null
and trim(brands.category) <> ''
and not exists (
  select 1
  from public.brand_categories existing
  where existing.brand_id = brands.id
  and existing.sort_order = 0
);

delete from public.brand_categories duplicate_rows
using public.brand_categories kept_rows
where duplicate_rows.brand_id = kept_rows.brand_id
and lower(duplicate_rows.category) = lower(kept_rows.category)
and (
  duplicate_rows.sort_order > kept_rows.sort_order
  or (
    duplicate_rows.sort_order = kept_rows.sort_order
    and duplicate_rows.created_at > kept_rows.created_at
  )
  or (
    duplicate_rows.sort_order = kept_rows.sort_order
    and duplicate_rows.created_at = kept_rows.created_at
    and duplicate_rows.id::text > kept_rows.id::text
  )
);

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
alter table public.products add column if not exists price numeric(10,2);
alter table public.products add column if not exists price_cents integer not null default 0;
alter table public.products add column if not exists sale_price numeric(10,2);
alter table public.products add column if not exists sale_price_cents integer;
alter table public.products add column if not exists tags text[] not null default '{}';
alter table public.products add column if not exists release_date date;
alter table public.products add column if not exists status text not null default 'draft';
alter table public.products add column if not exists pickup_available boolean not null default true;
alter table public.products add column if not exists created_at timestamptz not null default now();
alter table public.products add column if not exists updated_at timestamptz not null default now();

alter table public.products alter column id set default gen_random_uuid();
alter table public.products alter column price set default 0;
alter table public.products alter column price_cents set default 0;
alter table public.products alter column tags set default '{}';
alter table public.products alter column status set default 'draft';
alter table public.products alter column pickup_available set default true;
alter table public.products alter column created_at set default now();
alter table public.products alter column updated_at set default now();

update public.products
set price_cents = (price * 100)::integer
where price_cents = 0
and price is not null
and price > 0;

update public.products
set price = price_cents::numeric / 100
where price is null
and price_cents is not null;

update public.products
set sale_price_cents = (sale_price * 100)::integer
where sale_price_cents is null
and sale_price is not null;

update public.products
set sale_price = sale_price_cents::numeric / 100
where sale_price is null
and sale_price_cents is not null;

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
alter table public.orders add column if not exists fulfillment_type text;
alter table public.orders add column if not exists status text not null default 'order_placed';
alter table public.orders add column if not exists payment_status text not null default 'pending';
alter table public.orders add column if not exists subtotal numeric(10,2) not null default 0;
alter table public.orders add column if not exists subtotal_cents integer not null default 0;
alter table public.orders add column if not exists subtotal_amount numeric(10,2);
alter table public.orders add column if not exists shipping numeric(10,2) not null default 0;
alter table public.orders add column if not exists shipping_cents integer not null default 0;
alter table public.orders add column if not exists shipping_amount numeric(10,2);
alter table public.orders add column if not exists tax numeric(10,2) not null default 0;
alter table public.orders add column if not exists tax_cents integer not null default 0;
alter table public.orders add column if not exists tax_amount numeric(10,2);
alter table public.orders add column if not exists total numeric(10,2) not null default 0;
alter table public.orders add column if not exists total_cents integer not null default 0;
alter table public.orders add column if not exists total_amount numeric(10,2);
alter table public.orders add column if not exists amount_total numeric(10,2);
alter table public.orders add column if not exists amount_total_cents integer;
alter table public.orders add column if not exists currency text not null default 'usd';
alter table public.orders add column if not exists pickup_location text;
alter table public.orders add column if not exists pickup_slot text;
alter table public.orders add column if not exists pickup_day text;
alter table public.orders add column if not exists pickup_time text;
alter table public.orders add column if not exists shipping_full_name text;
alter table public.orders add column if not exists shipping_line1 text;
alter table public.orders add column if not exists shipping_line2 text;
alter table public.orders add column if not exists shipping_city text;
alter table public.orders add column if not exists shipping_state text;
alter table public.orders add column if not exists shipping_zip_code text;
alter table public.orders add column if not exists shipping_address jsonb;
alter table public.orders add column if not exists tracking_number text;
alter table public.orders add column if not exists carrier text;
alter table public.orders add column if not exists stripe_checkout_session_id text;
alter table public.orders add column if not exists stripe_payment_intent_id text;
alter table public.orders add column if not exists stripe_customer_id text;
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists canceled_at timestamptz;
alter table public.orders add column if not exists canceled_by_profile_id uuid;
alter table public.orders add column if not exists cancellation_reason text;
alter table public.orders add column if not exists cancellation_actor_role text;
alter table public.orders add column if not exists stripe_refund_id text;
alter table public.orders add column if not exists refund_amount_cents integer;
alter table public.orders add column if not exists refund_reason text;
alter table public.orders add column if not exists refund_requested_by_profile_id uuid;
alter table public.orders add column if not exists refund_failure_message text;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists completed_at timestamptz;
alter table public.orders add column if not exists inventory_decremented_at timestamptz;
alter table public.orders add column if not exists inventory_restored_at timestamptz;
alter table public.orders add column if not exists dispute_reason text;
alter table public.orders add column if not exists dispute_notes text;
alter table public.orders add column if not exists created_at timestamptz not null default now();
alter table public.orders add column if not exists updated_at timestamptz not null default now();

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'orders_canceled_by_profile_id_fkey'
  ) then
    alter table public.orders
    add constraint orders_canceled_by_profile_id_fkey
    foreign key (canceled_by_profile_id)
    references public.profiles(id)
    on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'orders_refund_requested_by_profile_id_fkey'
  ) then
    alter table public.orders
    add constraint orders_refund_requested_by_profile_id_fkey
    foreign key (refund_requested_by_profile_id)
    references public.profiles(id)
    on delete set null;
  end if;
end $$;

update public.orders
set
  fulfillment_type = coalesce(fulfillment_type, fulfillment_method),
  subtotal_cents = coalesce(nullif(subtotal_cents, 0), round(coalesce(subtotal, subtotal_amount, 0) * 100)::integer),
  shipping_cents = coalesce(nullif(shipping_cents, 0), round(coalesce(shipping, shipping_amount, 0) * 100)::integer),
  tax_cents = coalesce(nullif(tax_cents, 0), round(coalesce(tax, tax_amount, 0) * 100)::integer),
  total_cents = coalesce(nullif(total_cents, 0), round(coalesce(total, total_amount, amount_total, 0) * 100)::integer),
  subtotal = coalesce(nullif(subtotal, 0), subtotal_cents::numeric / 100),
  shipping = coalesce(shipping, shipping_cents::numeric / 100),
  tax = coalesce(tax, tax_cents::numeric / 100),
  total = coalesce(nullif(total, 0), total_cents::numeric / 100),
  subtotal_amount = coalesce(subtotal_amount, subtotal_cents::numeric / 100),
  shipping_amount = coalesce(shipping_amount, shipping_cents::numeric / 100),
  tax_amount = coalesce(tax_amount, tax_cents::numeric / 100),
  total_amount = coalesce(total_amount, total_cents::numeric / 100),
  amount_total = coalesce(amount_total, total_cents::numeric / 100),
  amount_total_cents = coalesce(amount_total_cents, total_cents),
  pickup_day = coalesce(pickup_day, nullif(split_part(coalesce(pickup_slot, ''), ' ', 1), '')),
  pickup_time = coalesce(pickup_time, pickup_slot),
  shipping_address = coalesce(
    shipping_address,
    case
      when shipping_line1 is null then null
      else jsonb_build_object(
        'fullName', shipping_full_name,
        'line1', shipping_line1,
        'line2', shipping_line2,
        'city', shipping_city,
        'state', shipping_state,
        'zipCode', shipping_zip_code
      )
    end
  )
where
  fulfillment_type is null
  or subtotal is null
  or subtotal_amount is null
  or shipping is null
  or shipping_amount is null
  or tax is null
  or tax_amount is null
  or total is null
  or total_amount is null
  or amount_total is null
  or amount_total_cents is null
  or shipping_address is null;

alter table public.orders alter column id set default gen_random_uuid();
alter table public.orders alter column fulfillment_method set default 'shipping';
alter table public.orders alter column fulfillment_type set default 'shipping';
alter table public.orders alter column status set default 'order_placed';
alter table public.orders alter column payment_status set default 'pending';
alter table public.orders alter column subtotal set default 0;
alter table public.orders alter column subtotal_cents set default 0;
alter table public.orders alter column subtotal_amount set default 0;
alter table public.orders alter column shipping set default 0;
alter table public.orders alter column shipping_cents set default 0;
alter table public.orders alter column shipping_amount set default 0;
alter table public.orders alter column tax set default 0;
alter table public.orders alter column tax_cents set default 0;
alter table public.orders alter column tax_amount set default 0;
alter table public.orders alter column total set default 0;
alter table public.orders alter column total_cents set default 0;
alter table public.orders alter column total_amount set default 0;
alter table public.orders alter column amount_total set default 0;
alter table public.orders alter column amount_total_cents set default 0;
alter table public.orders alter column currency set default 'usd';
alter table public.orders alter column created_at set default now();
alter table public.orders alter column updated_at set default now();

create table if not exists public.stripe_webhook_events (
  id text primary key,
  event_type text not null,
  stripe_created_at timestamptz,
  order_id uuid,
  processed_at timestamptz,
  processing_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.stripe_webhook_events add column if not exists event_type text;
alter table public.stripe_webhook_events add column if not exists stripe_created_at timestamptz;
alter table public.stripe_webhook_events add column if not exists order_id uuid;
alter table public.stripe_webhook_events add column if not exists processed_at timestamptz;
alter table public.stripe_webhook_events add column if not exists processing_error text;
alter table public.stripe_webhook_events add column if not exists created_at timestamptz not null default now();
alter table public.stripe_webhook_events add column if not exists updated_at timestamptz not null default now();

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
alter table public.order_items add column if not exists price numeric(10,2) not null default 0;
alter table public.order_items add column if not exists unit_price_cents integer not null default 0;
alter table public.order_items add column if not exists line_total_cents integer not null default 0;
alter table public.order_items add column if not exists created_at timestamptz not null default now();

alter table public.order_items alter column id set default gen_random_uuid();
alter table public.order_items alter column quantity set default 1;
alter table public.order_items alter column price set default 0;
alter table public.order_items alter column unit_price_cents set default 0;
alter table public.order_items alter column line_total_cents set default 0;
alter table public.order_items alter column created_at set default now();

update public.order_items
set
  unit_price_cents = coalesce(nullif(unit_price_cents, 0), round(coalesce(price, 0) * 100)::integer),
  line_total_cents = coalesce(nullif(line_total_cents, 0), round(coalesce(price, 0) * 100)::integer * quantity),
  price = coalesce(nullif(price, 0), unit_price_cents::numeric / 100);

create table if not exists public.product_favorites (
  id uuid primary key default gen_random_uuid()
);

alter table public.product_favorites add column if not exists profile_id uuid;
alter table public.product_favorites add column if not exists product_id uuid;
alter table public.product_favorites add column if not exists created_at timestamptz not null default now();

alter table public.product_favorites alter column id set default gen_random_uuid();
alter table public.product_favorites alter column created_at set default now();

create table if not exists public.brand_follows (
  id uuid primary key default gen_random_uuid()
);

alter table public.brand_follows add column if not exists profile_id uuid;
alter table public.brand_follows add column if not exists brand_id uuid;
alter table public.brand_follows add column if not exists created_at timestamptz not null default now();

alter table public.brand_follows alter column id set default gen_random_uuid();
alter table public.brand_follows alter column created_at set default now();

create table if not exists public.customer_addresses (
  id uuid primary key default gen_random_uuid()
);

alter table public.customer_addresses add column if not exists customer_profile_id uuid;
alter table public.customer_addresses add column if not exists label text;
alter table public.customer_addresses add column if not exists full_name text;
alter table public.customer_addresses add column if not exists address_line_1 text;
alter table public.customer_addresses add column if not exists address_line_2 text;
alter table public.customer_addresses add column if not exists city text;
alter table public.customer_addresses add column if not exists state text;
alter table public.customer_addresses add column if not exists zip_code text;
alter table public.customer_addresses add column if not exists phone text;
alter table public.customer_addresses add column if not exists is_default boolean not null default false;
alter table public.customer_addresses add column if not exists created_at timestamptz not null default now();
alter table public.customer_addresses add column if not exists updated_at timestamptz not null default now();

alter table public.customer_addresses alter column id set default gen_random_uuid();
alter table public.customer_addresses alter column is_default set default false;
alter table public.customer_addresses alter column created_at set default now();
alter table public.customer_addresses alter column updated_at set default now();

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

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_favorites_profile_id_fkey'
    and conrelid = 'public.product_favorites'::regclass
  ) then
    alter table public.product_favorites
    add constraint product_favorites_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'product_favorites_product_id_fkey'
    and conrelid = 'public.product_favorites'::regclass
  ) then
    alter table public.product_favorites
    add constraint product_favorites_product_id_fkey
    foreign key (product_id) references public.products(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brand_follows_profile_id_fkey'
    and conrelid = 'public.brand_follows'::regclass
  ) then
    alter table public.brand_follows
    add constraint brand_follows_profile_id_fkey
    foreign key (profile_id) references public.profiles(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'brand_follows_brand_id_fkey'
    and conrelid = 'public.brand_follows'::regclass
  ) then
    alter table public.brand_follows
    add constraint brand_follows_brand_id_fkey
    foreign key (brand_id) references public.brands(id) on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'customer_addresses_customer_profile_id_fkey'
    and conrelid = 'public.customer_addresses'::regclass
  ) then
    alter table public.customer_addresses
    add constraint customer_addresses_customer_profile_id_fkey
    foreign key (customer_profile_id) references public.profiles(id) on delete cascade;
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
drop constraint if exists products_price_check;

alter table public.products
add constraint products_price_check
check (price is null or price >= 0);

alter table public.products
drop constraint if exists products_sale_price_cents_check;

alter table public.products
add constraint products_sale_price_cents_check
check (sale_price_cents is null or sale_price_cents >= 0);

alter table public.products
drop constraint if exists products_sale_price_check;

alter table public.products
add constraint products_sale_price_check
check (sale_price is null or sale_price >= 0);

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
drop constraint if exists orders_fulfillment_type_check;

alter table public.orders
add constraint orders_fulfillment_type_check
check (fulfillment_type in ('shipping', 'local_pickup'));

alter table public.orders
drop constraint if exists orders_status_check;

alter table public.orders
add constraint orders_status_check
check (status in ('order_placed', 'brand_preparing', 'shipped', 'delivered', 'ready_for_pickup', 'picked_up', 'completed', 'disputed', 'canceled', 'cancelled'));

alter table public.orders
drop constraint if exists orders_payment_status_check;

alter table public.orders
add constraint orders_payment_status_check
check (payment_status in ('pending', 'paid', 'failed', 'expired', 'refund_pending', 'refunded', 'refund_failed'));

alter table public.orders
drop constraint if exists orders_refund_amount_cents_check;

alter table public.orders
add constraint orders_refund_amount_cents_check
check (refund_amount_cents is null or (refund_amount_cents >= 0 and refund_amount_cents <= total_cents));

alter table public.orders
drop constraint if exists orders_cancellation_actor_role_check;

alter table public.orders
add constraint orders_cancellation_actor_role_check
check (cancellation_actor_role is null or cancellation_actor_role in ('customer', 'brand_owner', 'admin', 'system'));

alter table public.order_items
drop constraint if exists order_items_quantity_check;

alter table public.order_items
add constraint order_items_quantity_check
check (quantity > 0);

alter table public.customer_addresses
drop constraint if exists customer_addresses_required_fields_check;

alter table public.customer_addresses
add constraint customer_addresses_required_fields_check
check (
  nullif(label, '') is not null
  and nullif(full_name, '') is not null
  and nullif(address_line_1, '') is not null
  and nullif(city, '') is not null
  and nullif(state, '') is not null
  and nullif(zip_code, '') is not null
) not valid;

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
create index if not exists brand_categories_brand_id_idx on public.brand_categories using btree (brand_id);
create index if not exists brand_categories_category_idx on public.brand_categories using btree (lower(category));
create unique index if not exists brand_categories_brand_category_key on public.brand_categories using btree (brand_id, lower(category));
create index if not exists products_brand_id_idx on public.products using btree (brand_id);
create index if not exists products_status_idx on public.products using btree (status);
create index if not exists product_images_product_id_idx on public.product_images using btree (product_id);
create index if not exists product_images_moderation_status_idx on public.product_images using btree (moderation_status);
create index if not exists product_variants_product_id_idx on public.product_variants using btree (product_id);
create unique index if not exists orders_stripe_checkout_session_id_key on public.orders using btree (stripe_checkout_session_id) where stripe_checkout_session_id is not null;
create index if not exists orders_stripe_payment_intent_id_idx on public.orders using btree (stripe_payment_intent_id) where stripe_payment_intent_id is not null;
create unique index if not exists orders_stripe_refund_id_key on public.orders using btree (stripe_refund_id) where stripe_refund_id is not null;
create index if not exists orders_payment_status_idx on public.orders using btree (payment_status);
create index if not exists orders_inventory_decremented_at_idx on public.orders using btree (inventory_decremented_at);
create index if not exists orders_inventory_restored_at_idx on public.orders using btree (inventory_restored_at);
create index if not exists orders_canceled_at_idx on public.orders using btree (canceled_at);
create index if not exists orders_customer_profile_id_idx on public.orders using btree (customer_profile_id);
create index if not exists orders_brand_id_idx on public.orders using btree (brand_id);
create index if not exists orders_status_idx on public.orders using btree (status);
create index if not exists orders_fulfillment_method_idx on public.orders using btree (fulfillment_method);
create index if not exists stripe_webhook_events_processed_at_idx on public.stripe_webhook_events using btree (processed_at);
create index if not exists order_items_order_id_idx on public.order_items using btree (order_id);
create index if not exists order_items_product_variant_id_idx on public.order_items using btree (product_variant_id);
create unique index if not exists product_favorites_profile_product_key on public.product_favorites using btree (profile_id, product_id);
create index if not exists product_favorites_profile_id_idx on public.product_favorites using btree (profile_id);
create index if not exists product_favorites_product_id_idx on public.product_favorites using btree (product_id);
create unique index if not exists brand_follows_profile_brand_key on public.brand_follows using btree (profile_id, brand_id);
create index if not exists brand_follows_profile_id_idx on public.brand_follows using btree (profile_id);
create index if not exists brand_follows_brand_id_idx on public.brand_follows using btree (brand_id);
do $$
begin
  if not exists (
    select 1
    from public.profiles
    where username is not null
    group by lower(username)
    having count(*) > 1
  ) then
    create unique index if not exists profiles_username_lower_key
    on public.profiles using btree (lower(username))
    where username is not null;
  else
    raise notice 'Skipped profiles_username_lower_key because duplicate profile usernames exist. Resolve duplicates, then rerun this migration.';
  end if;
end $$;
create index if not exists profiles_username_idx on public.profiles using btree (username) where username is not null;
create index if not exists customer_addresses_customer_profile_id_idx on public.customer_addresses using btree (customer_profile_id);
create index if not exists customer_addresses_updated_at_idx on public.customer_addresses using btree (updated_at);
do $$
begin
  if not exists (
    select 1
    from public.customer_addresses
    where is_default
    group by customer_profile_id
    having count(*) > 1
  ) then
    create unique index if not exists customer_addresses_one_default_key
    on public.customer_addresses using btree (customer_profile_id)
    where is_default;
  else
    raise notice 'Skipped customer_addresses_one_default_key because duplicate default addresses exist. Resolve duplicates, then rerun this migration.';
  end if;
end $$;

create or replace function public.get_brand_follower_counts(p_brand_ids uuid[])
returns table (brand_id uuid, follower_count bigint)
language sql
security definer
set search_path = public
as $$
  select brand_follows.brand_id, count(*)::bigint as follower_count
  from public.brand_follows
  join public.brands on brands.id = brand_follows.brand_id
  where brand_follows.brand_id = any(p_brand_ids)
  and brands.approval_status = 'approved'
  group by brand_follows.brand_id;
$$;

grant execute on function public.get_brand_follower_counts(uuid[]) to anon, authenticated;

create or replace function public.save_brand_categories(
  p_brand_id uuid,
  p_categories text[]
)
returns text[]
language plpgsql
security definer
set search_path = public
as $$
declare
  v_is_admin boolean;
  v_is_owner boolean;
  v_category text;
  v_normalized text;
  v_categories text[] := '{}';
  v_sort_order integer := 0;
begin
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  into v_is_admin;

  select exists (
    select 1
    from public.brands
    where id = p_brand_id
    and (
      owner_profile_id = auth.uid()
      or owner_id = auth.uid()
    )
  )
  into v_is_owner;

  if not coalesce(v_is_admin, false) and not coalesce(v_is_owner, false) then
    raise exception 'You can only manage categories for brands you own.'
      using errcode = '42501';
  end if;

  if p_categories is null or cardinality(p_categories) = 0 then
    raise exception 'At least one brand category is required.'
      using errcode = 'P0001';
  end if;

  foreach v_category in array p_categories
  loop
    v_normalized :=
      case
        when lower(trim(v_category)) in ('streetwear', 'graphic') then 'streetwear'
        when lower(trim(v_category)) in ('sportswear', 'athletic', 'sportswear / athletic') then 'sportswear'
        when lower(trim(v_category)) = 'vintage' then 'vintage'
        when lower(trim(v_category)) = 'luxury' then 'luxury'
        when lower(trim(v_category)) = 'handmade' then 'handmade'
        when lower(trim(v_category)) = 'sustainable' then 'sustainable'
        when lower(trim(v_category)) in ('college brands', 'college-brands', 'college / campus') then 'college-brands'
        when lower(trim(v_category)) in ('footwear', 'shoes / footwear') then 'footwear'
        when lower(trim(v_category)) = 'jewelry' then 'jewelry'
        when lower(trim(v_category)) in ('bags / backpacks', 'bags-backpacks') then 'bags-backpacks'
        when lower(trim(v_category)) = 'hats' then 'hats'
        when lower(trim(v_category)) = 'accessories' then 'accessories'
        when lower(trim(v_category)) = 'other' then 'other'
        else null
      end;

    if v_normalized is null then
      raise exception 'Unsupported brand category: %', v_category
        using errcode = 'P0001';
    end if;

    if not v_normalized = any(v_categories) then
      v_categories := array_append(v_categories, v_normalized);
    end if;
  end loop;

  if cardinality(v_categories) = 0 then
    raise exception 'At least one brand category is required.'
      using errcode = 'P0001';
  end if;

  perform 1
  from public.brands
  where id = p_brand_id
  for update;

  if not found then
    raise exception 'Brand not found.'
      using errcode = 'P0001';
  end if;

  delete from public.brand_categories
  where brand_id = p_brand_id;

  foreach v_category in array v_categories
  loop
    insert into public.brand_categories (brand_id, category, sort_order, updated_at)
    values (p_brand_id, v_category, v_sort_order, now());
    v_sort_order := v_sort_order + 1;
  end loop;

  update public.brands
  set category = v_categories[1],
      updated_at = now()
  where id = p_brand_id;

  return v_categories;
end;
$$;

revoke all on function public.save_brand_categories(uuid, text[]) from public;
revoke all on function public.save_brand_categories(uuid, text[]) from anon;
grant execute on function public.save_brand_categories(uuid, text[]) to authenticated;

create or replace function public.set_default_customer_address(p_address_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_customer_profile_id uuid;
begin
  select customer_profile_id
  into v_customer_profile_id
  from public.customer_addresses
  where id = p_address_id
  for update;

  if not found then
    raise exception 'Address not found.' using errcode = 'P0001';
  end if;

  if v_customer_profile_id <> auth.uid() then
    raise exception 'You can only update your own default address.' using errcode = '42501';
  end if;

  if not exists (select 1 from public.profiles where id = auth.uid() and role = 'customer') then
    raise exception 'Saved addresses are only available to customer accounts.' using errcode = '42501';
  end if;

  update public.customer_addresses
  set is_default = false, updated_at = now()
  where customer_profile_id = v_customer_profile_id
  and id <> p_address_id;

  update public.customer_addresses
  set is_default = true, updated_at = now()
  where id = p_address_id
  and customer_profile_id = v_customer_profile_id;

  return p_address_id;
end;
$$;

grant execute on function public.set_default_customer_address(uuid) to authenticated;

create or replace function public.finalize_paid_order(
  p_stripe_checkout_session_id text,
  p_stripe_payment_intent_id text default null,
  p_stripe_customer_id text default null,
  p_paid_at timestamptz default now()
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_restorable_variant_count integer;
  v_missing_variant_id uuid;
begin
  select *
  into v_order
  from public.orders
  where stripe_checkout_session_id = p_stripe_checkout_session_id
  for update;

  if not found then
    return null;
  end if;

  if v_order.payment_status = 'refunded' then
    return v_order.id;
  end if;

  if v_order.payment_status <> 'paid' then
    update public.orders
    set
      payment_status = 'paid',
      stripe_payment_intent_id = coalesce(p_stripe_payment_intent_id, stripe_payment_intent_id),
      stripe_customer_id = coalesce(p_stripe_customer_id, stripe_customer_id),
      paid_at = coalesce(p_paid_at, now()),
      updated_at = now()
    where id = v_order.id;
  else
    update public.orders
    set
      stripe_payment_intent_id = coalesce(stripe_payment_intent_id, p_stripe_payment_intent_id),
      stripe_customer_id = coalesce(stripe_customer_id, p_stripe_customer_id),
      paid_at = coalesce(paid_at, p_paid_at, now()),
      updated_at = now()
    where id = v_order.id;
  end if;

  if v_order.inventory_decremented_at is null then
    for v_item in
      select product_variant_id, quantity
      from public.order_items
      where order_id = v_order.id
      and product_variant_id is not null
    loop
      perform 1
      from public.product_inventory
      where product_variant_id = v_item.product_variant_id
      and stock_quantity >= v_item.quantity
      for update;

      if not found then
        raise exception 'Insufficient inventory for product_variant_id %', v_item.product_variant_id
          using errcode = 'P0001';
      end if;

      update public.product_inventory
      set
        stock_quantity = stock_quantity - v_item.quantity,
        updated_at = now()
      where product_variant_id = v_item.product_variant_id
      and stock_quantity >= v_item.quantity;

      if not found then
        raise exception 'Inventory decrement failed for product_variant_id %', v_item.product_variant_id
          using errcode = 'P0001';
      end if;
    end loop;

    update public.orders
    set
      inventory_decremented_at = now(),
      updated_at = now()
    where id = v_order.id
    and inventory_decremented_at is null;
  end if;

  return v_order.id;
end;
$$;

create or replace function public.restore_order_inventory(
  p_order_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_order public.orders%rowtype;
  v_item record;
  v_restorable_variant_count integer;
  v_missing_variant_id uuid;
begin
  select *
  into v_order
  from public.orders
  where id = p_order_id
  for update;

  if not found then
    return null;
  end if;

  if v_order.inventory_restored_at is not null then
    return v_order.id;
  end if;

  if v_order.inventory_decremented_at is null then
    return v_order.id;
  end if;

  if v_order.payment_status <> 'refunded' then
    raise exception 'Order % is not confirmed refunded', v_order.id
      using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.order_items
    where order_id = v_order.id
    and product_variant_id is not null
    and (quantity is null or quantity <= 0)
  ) then
    raise exception 'Order % has invalid inventory restoration quantity', v_order.id
      using errcode = 'P0001';
  end if;

  select count(*)
  into v_restorable_variant_count
  from (
    select product_variant_id
    from public.order_items
    where order_id = v_order.id
    and product_variant_id is not null
    group by product_variant_id
  ) grouped_variants;

  if v_restorable_variant_count = 0 then
    raise exception 'Order % has no restorable inventory variants', v_order.id
      using errcode = 'P0001';
  end if;

  select grouped_variants.product_variant_id
  into v_missing_variant_id
  from (
    select product_variant_id, sum(quantity)::integer as quantity
    from public.order_items
    where order_id = v_order.id
    and product_variant_id is not null
    group by product_variant_id
  ) grouped_variants
  left join public.product_inventory
    on product_inventory.product_variant_id = grouped_variants.product_variant_id
  where product_inventory.product_variant_id is null
  limit 1;

  if v_missing_variant_id is not null then
    raise exception 'Inventory row missing for product_variant_id %', v_missing_variant_id
      using errcode = 'P0001';
  end if;

  for v_item in
    select grouped_variants.product_variant_id, grouped_variants.quantity
    from (
      select product_variant_id, sum(quantity)::integer as quantity
      from public.order_items
      where order_id = v_order.id
      and product_variant_id is not null
      group by product_variant_id
    ) grouped_variants
    join public.product_inventory
      on product_inventory.product_variant_id = grouped_variants.product_variant_id
    order by grouped_variants.product_variant_id
    for update of product_inventory
  loop

    update public.product_inventory
    set
      stock_quantity = stock_quantity + v_item.quantity,
      updated_at = now()
    where product_variant_id = v_item.product_variant_id;

    if not found then
      raise exception 'Inventory restoration failed for product_variant_id %', v_item.product_variant_id
        using errcode = 'P0001';
    end if;
  end loop;

  update public.orders
  set
    inventory_restored_at = now(),
    updated_at = now()
  where id = v_order.id
  and inventory_restored_at is null;

  return v_order.id;
end;
$$;

revoke all on function public.restore_order_inventory(uuid) from public;
revoke all on function public.restore_order_inventory(uuid) from anon;
revoke all on function public.restore_order_inventory(uuid) from authenticated;
grant execute on function public.restore_order_inventory(uuid) to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('brand-logos', 'brand-logos', true, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('brand-banners', 'brand-banners', true, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('product-images', 'product-images', true, 26214400, array['image/jpeg', 'image/png', 'image/webp']),
  ('customer-avatars', 'customer-avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
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

drop policy if exists "Customers can read their profile images" on storage.objects;
create policy "Customers can read their profile images"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "Customers can upload their profile images" on storage.objects;
create policy "Customers can upload their profile images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

drop policy if exists "Customers can update their profile images" on storage.objects;
create policy "Customers can update their profile images"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
)
with check (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

drop policy if exists "Customers can delete their profile images" on storage.objects;
create policy "Customers can delete their profile images"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'customer-avatars'
  and (storage.foldername(name))[1] = auth.uid()::text
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

alter table public.brands enable row level security;
alter table public.brand_categories enable row level security;
alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.product_variants enable row level security;
alter table public.product_inventory enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.product_favorites enable row level security;
alter table public.brand_follows enable row level security;
alter table public.customer_addresses enable row level security;

grant select on public.profiles to authenticated;
revoke update on public.profiles from authenticated;
grant update (full_name, username, avatar_url, avatar_path, city, state, zip_code, updated_at) on public.profiles to authenticated;
grant select on public.brands, public.brand_categories, public.products, public.product_images, public.product_variants, public.product_inventory to anon, authenticated;
grant insert, update, delete on public.brands, public.brand_categories, public.products, public.product_images, public.product_variants, public.product_inventory to authenticated;
grant select on public.orders, public.order_items to authenticated;
grant insert, update on public.orders, public.order_items to authenticated;
grant select, insert, delete on public.product_favorites, public.brand_follows to authenticated;
grant select, insert, update, delete on public.customer_addresses to authenticated;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Users can read their own profile"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "Customers can update editable profile fields" on public.profiles;
create policy "Customers can update editable profile fields"
on public.profiles
for update
to authenticated
using (
  id = auth.uid()
  and role = 'customer'
)
with check (
  id = auth.uid()
  and role = 'customer'
);

drop policy if exists "Customers can read their addresses" on public.customer_addresses;
create policy "Customers can read their addresses"
on public.customer_addresses
for select
to authenticated
using (
  customer_profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

drop policy if exists "Customers can insert their addresses" on public.customer_addresses;
create policy "Customers can insert their addresses"
on public.customer_addresses
for insert
to authenticated
with check (
  customer_profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

drop policy if exists "Customers can update their addresses" on public.customer_addresses;
create policy "Customers can update their addresses"
on public.customer_addresses
for update
to authenticated
using (
  customer_profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
)
with check (
  customer_profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

drop policy if exists "Customers can delete their addresses" on public.customer_addresses;
create policy "Customers can delete their addresses"
on public.customer_addresses
for delete
to authenticated
using (
  customer_profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
);

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

drop policy if exists "Public can read approved brand categories" on public.brand_categories;
create policy "Public can read approved brand categories"
on public.brand_categories
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.brands
    where brands.id = brand_categories.brand_id
    and brands.approval_status = 'approved'
  )
);

drop policy if exists "Brand owners can read their brand categories" on public.brand_categories;
create policy "Brand owners can read their brand categories"
on public.brand_categories
for select
to authenticated
using (
  exists (
    select 1
    from public.brands
    where brands.id = brand_categories.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or brands.owner_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Brand owners can insert their brand categories" on public.brand_categories;
create policy "Brand owners can insert their brand categories"
on public.brand_categories
for insert
to authenticated
with check (
  exists (
    select 1
    from public.brands
    where brands.id = brand_categories.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or brands.owner_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Brand owners can update their brand categories" on public.brand_categories;
create policy "Brand owners can update their brand categories"
on public.brand_categories
for update
to authenticated
using (
  exists (
    select 1
    from public.brands
    where brands.id = brand_categories.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or brands.owner_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
)
with check (
  exists (
    select 1
    from public.brands
    where brands.id = brand_categories.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or brands.owner_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Brand owners can delete their brand categories" on public.brand_categories;
create policy "Brand owners can delete their brand categories"
on public.brand_categories
for delete
to authenticated
using (
  exists (
    select 1
    from public.brands
    where brands.id = brand_categories.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or brands.owner_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
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
      or brands.owner_id = auth.uid()
      or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
    )
  )
);

drop policy if exists "Customers can read their product favorites" on public.product_favorites;
create policy "Customers can read their product favorites"
on public.product_favorites
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "Customers can favorite public products" on public.product_favorites;
create policy "Customers can favorite public products"
on public.product_favorites
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
  and exists (
    select 1
    from public.products
    join public.brands on brands.id = products.brand_id
    where products.id = product_favorites.product_id
    and products.status = 'published'
    and brands.approval_status = 'approved'
  )
);

drop policy if exists "Customers can delete their product favorites" on public.product_favorites;
create policy "Customers can delete their product favorites"
on public.product_favorites
for delete
to authenticated
using (profile_id = auth.uid());

drop policy if exists "Customers can read their brand follows" on public.brand_follows;
create policy "Customers can read their brand follows"
on public.brand_follows
for select
to authenticated
using (profile_id = auth.uid());

drop policy if exists "Customers can follow approved brands" on public.brand_follows;
create policy "Customers can follow approved brands"
on public.brand_follows
for insert
to authenticated
with check (
  profile_id = auth.uid()
  and exists (select 1 from public.profiles where id = auth.uid() and role = 'customer')
  and exists (
    select 1
    from public.brands
    where brands.id = brand_follows.brand_id
    and brands.approval_status = 'approved'
  )
);

drop policy if exists "Customers can delete their brand follows" on public.brand_follows;
create policy "Customers can delete their brand follows"
on public.brand_follows
for delete
to authenticated
using (profile_id = auth.uid());

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

create table if not exists public.disputes (
  id uuid primary key default gen_random_uuid()
);

alter table public.disputes add column if not exists order_id uuid;
alter table public.disputes add column if not exists customer_profile_id uuid;
alter table public.disputes add column if not exists brand_id uuid;
alter table public.disputes add column if not exists status text not null default 'open';
alter table public.disputes add column if not exists customer_reason text;
alter table public.disputes add column if not exists customer_notes text;
alter table public.disputes add column if not exists brand_response text;
alter table public.disputes add column if not exists brand_responded_at timestamptz;
alter table public.disputes add column if not exists admin_notes text;
alter table public.disputes add column if not exists resolution text;
alter table public.disputes add column if not exists resolved_at timestamptz;
alter table public.disputes add column if not exists resolved_by_profile_id uuid;
alter table public.disputes add column if not exists created_at timestamptz not null default now();
alter table public.disputes add column if not exists updated_at timestamptz not null default now();

update public.disputes
set
  customer_profile_id = coalesce(disputes.customer_profile_id, orders.customer_profile_id),
  brand_id = coalesce(disputes.brand_id, orders.brand_id),
  customer_reason = coalesce(nullif(disputes.customer_reason, ''), orders.dispute_reason, 'Customer reported an issue'),
  customer_notes = coalesce(disputes.customer_notes, orders.dispute_notes),
  updated_at = now()
from public.orders
where disputes.order_id = orders.id;

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'disputes'
    and column_name = 'reason'
  ) then
    execute $sql$
      update public.disputes
      set customer_reason = coalesce(nullif(customer_reason, ''), reason)
      where reason is not null
    $sql$;
  end if;

  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
    and table_name = 'disputes'
    and column_name = 'evidence'
  ) then
    execute $sql$
      update public.disputes
      set customer_notes = coalesce(customer_notes, evidence)
      where evidence is not null
    $sql$;
  end if;
end $$;

insert into public.disputes (
  order_id,
  customer_profile_id,
  brand_id,
  status,
  customer_reason,
  customer_notes,
  created_at,
  updated_at
)
select
  orders.id,
  orders.customer_profile_id,
  orders.brand_id,
  'open',
  coalesce(nullif(orders.dispute_reason, ''), 'Customer reported an issue'),
  orders.dispute_notes,
  orders.updated_at,
  orders.updated_at
from public.orders
where (orders.dispute_reason is not null or orders.dispute_notes is not null or orders.status = 'disputed')
and not exists (
  select 1
  from public.disputes
  where disputes.order_id = orders.id
  and disputes.status in ('open', 'under_review')
);

alter table public.disputes
alter column order_id set not null;

alter table public.disputes
alter column customer_reason set not null;

alter table public.disputes
drop constraint if exists disputes_status_check;

alter table public.disputes
add constraint disputes_status_check
check (status in ('open', 'under_review', 'resolved_customer', 'resolved_brand', 'closed'));

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'disputes_order_id_fkey'
  ) then
    alter table public.disputes
    add constraint disputes_order_id_fkey
    foreign key (order_id)
    references public.orders(id)
    on delete cascade;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'disputes_customer_profile_id_fkey'
  ) then
    alter table public.disputes
    add constraint disputes_customer_profile_id_fkey
    foreign key (customer_profile_id)
    references public.profiles(id)
    on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'disputes_brand_id_fkey'
  ) then
    alter table public.disputes
    add constraint disputes_brand_id_fkey
    foreign key (brand_id)
    references public.brands(id)
    on delete set null;
  end if;

  if not exists (
    select 1 from pg_constraint where conname = 'disputes_resolved_by_profile_id_fkey'
  ) then
    alter table public.disputes
    add constraint disputes_resolved_by_profile_id_fkey
    foreign key (resolved_by_profile_id)
    references public.profiles(id)
    on delete set null;
  end if;
end $$;

create index if not exists disputes_order_id_idx on public.disputes using btree (order_id);
create index if not exists disputes_customer_profile_id_idx on public.disputes using btree (customer_profile_id);
create index if not exists disputes_brand_id_idx on public.disputes using btree (brand_id);
create index if not exists disputes_status_idx on public.disputes using btree (status);
create index if not exists disputes_created_at_idx on public.disputes using btree (created_at desc);

with ranked_active_disputes as (
  select
    id,
    row_number() over (partition by order_id order by created_at desc, id desc) as active_rank
  from public.disputes
  where status in ('open', 'under_review')
)
update public.disputes
set
  status = 'closed',
  resolution = coalesce(resolution, 'Closed by marketplace migration because a newer active dispute exists for this order.'),
  resolved_at = coalesce(resolved_at, now()),
  updated_at = now()
from ranked_active_disputes
where disputes.id = ranked_active_disputes.id
and ranked_active_disputes.active_rank > 1;

create unique index if not exists disputes_one_active_per_order_idx
on public.disputes using btree (order_id)
where status in ('open', 'under_review');

alter table public.disputes enable row level security;

drop policy if exists "Order participants can read disputes" on public.disputes;
create policy "Order participants can read disputes"
on public.disputes
for select
to authenticated
using (
  customer_profile_id = auth.uid()
  or exists (
    select 1
    from public.brands
    where brands.id = disputes.brand_id
    and (
      brands.owner_profile_id = auth.uid()
      or brands.owner_id = auth.uid()
    )
  )
  or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
);

drop policy if exists "Customers can create disputes for their orders" on public.disputes;
drop policy if exists "Admins can update disputes" on public.disputes;

revoke insert, update, delete on table public.disputes from anon;
revoke insert, update, delete on table public.disputes from authenticated;

commit;
