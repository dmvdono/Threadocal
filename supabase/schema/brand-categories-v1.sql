begin;

create extension if not exists pgcrypto;

create table if not exists public.brand_categories (
  id uuid primary key default gen_random_uuid()
);

alter table public.brand_categories add column if not exists brand_id uuid;
alter table public.brand_categories add column if not exists category text;
alter table public.brand_categories add column if not exists sort_order integer;
alter table public.brand_categories add column if not exists created_at timestamptz;
alter table public.brand_categories add column if not exists updated_at timestamptz;

alter table public.brand_categories alter column id set default gen_random_uuid();
alter table public.brand_categories alter column category set not null;
alter table public.brand_categories alter column sort_order set default 0;
update public.brand_categories set sort_order = 0 where sort_order is null;
alter table public.brand_categories alter column sort_order set not null;
alter table public.brand_categories alter column created_at set default now();
update public.brand_categories set created_at = now() where created_at is null;
alter table public.brand_categories alter column created_at set not null;
alter table public.brand_categories alter column updated_at set default now();
update public.brand_categories set updated_at = now() where updated_at is null;
alter table public.brand_categories alter column updated_at set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'brand_categories_brand_id_fkey'
      and conrelid = 'public.brand_categories'::regclass
  ) then
    alter table public.brand_categories
    add constraint brand_categories_brand_id_fkey
    foreign key (brand_id) references public.brands(id) on delete cascade;
  end if;
end $$;

alter table public.brand_categories alter column brand_id set not null;

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
    when lower(trim(brands.category)) in ('sportswear', 'athletic', 'sportswear / athletic', 'sportswear-athletic') then 'sportswear'
    when lower(trim(brands.category)) = 'vintage' then 'vintage'
    when lower(trim(brands.category)) = 'luxury' then 'luxury'
    when lower(trim(brands.category)) = 'handmade' then 'handmade'
    when lower(trim(brands.category)) = 'sustainable' then 'sustainable'
    when lower(trim(brands.category)) in ('college brands', 'college-brands', 'college / campus', 'college-campus') then 'college-brands'
    when lower(trim(brands.category)) in ('footwear', 'shoes', 'shoes / footwear', 'shoes-footwear') then 'footwear'
    when lower(trim(brands.category)) = 'jewelry' then 'jewelry'
    when lower(trim(brands.category)) in ('bags', 'backpacks', 'bags / backpacks', 'bags-backpacks') then 'bags-backpacks'
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

create index if not exists brand_categories_brand_id_idx
on public.brand_categories using btree (brand_id);

create index if not exists brand_categories_category_idx
on public.brand_categories using btree (lower(category));

create unique index if not exists brand_categories_brand_category_key
on public.brand_categories using btree (brand_id, lower(category));

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
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  )
  into v_is_admin;

  select exists (
    select 1
    from public.brands
    where id = p_brand_id
      and (
        owner_profile_id = auth.uid()
        or owner_id::text = auth.uid()::text
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
        when lower(trim(v_category)) in ('sportswear', 'athletic', 'sportswear / athletic', 'sportswear-athletic') then 'sportswear'
        when lower(trim(v_category)) = 'vintage' then 'vintage'
        when lower(trim(v_category)) = 'luxury' then 'luxury'
        when lower(trim(v_category)) = 'handmade' then 'handmade'
        when lower(trim(v_category)) = 'sustainable' then 'sustainable'
        when lower(trim(v_category)) in ('college brands', 'college-brands', 'college / campus', 'college-campus') then 'college-brands'
        when lower(trim(v_category)) in ('footwear', 'shoes', 'shoes / footwear', 'shoes-footwear') then 'footwear'
        when lower(trim(v_category)) = 'jewelry' then 'jewelry'
        when lower(trim(v_category)) in ('bags', 'backpacks', 'bags / backpacks', 'bags-backpacks') then 'bags-backpacks'
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
revoke all on function public.save_brand_categories(uuid, text[]) from authenticated;
grant execute on function public.save_brand_categories(uuid, text[]) to authenticated;

alter table public.brand_categories enable row level security;

grant select on public.brand_categories to anon, authenticated;
grant insert, update, delete on public.brand_categories to authenticated;

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
        or brands.owner_id::text = auth.uid()::text
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
        or brands.owner_id::text = auth.uid()::text
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
        or brands.owner_id::text = auth.uid()::text
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
        or brands.owner_id::text = auth.uid()::text
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
        or brands.owner_id::text = auth.uid()::text
        or exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
      )
  )
);

commit;
