begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'editorial-images',
  'editorial-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public can read editorial images" on storage.objects;
create policy "Public can read editorial images"
on storage.objects
for select
to anon, authenticated
using (bucket_id = 'editorial-images');

drop policy if exists "Admins can upload editorial images" on storage.objects;
create policy "Admins can upload editorial images"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'editorial-images'
  and exists (
    select 1
    from public.profiles
    where profiles.id = auth.uid()
      and profiles.role = 'admin'
  )
);

commit;
