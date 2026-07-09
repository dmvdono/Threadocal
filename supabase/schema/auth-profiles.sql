begin;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  role text not null check (role in ('customer', 'brand_owner', 'admin')),
  city text,
  state text,
  zip_code text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

grant usage on schema public to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user_profile();

drop policy if exists "Profiles are viewable by their owner" on public.profiles;
create policy "Profiles are viewable by their owner"
on public.profiles
for select
to authenticated
using (auth.uid() = id);

drop policy if exists "Users can create their own profile" on public.profiles;
create policy "Users can create their own profile"
on public.profiles
for insert
to authenticated
with check (auth.uid() = id);

drop policy if exists "Users can update their own profile" on public.profiles;
create policy "Users can update their own profile"
on public.profiles
for update
to authenticated
using (auth.uid() = id)
with check (auth.uid() = id);

commit;
