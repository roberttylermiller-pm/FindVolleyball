-- Bucket-level file_size_limit/allowed_mime_types are enforced by
-- Supabase Storage itself, not just client-side form validation — a
-- request that lies about content-type or exceeds the size limit gets
-- rejected server-side regardless of what the upload UI allows.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('listing-photos', 'listing-photos', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- Public read (photos are shown on the public map/detail page); upload
-- restricted to signed-in users, matching the submission flow's auth
-- requirement.
create policy "Public read access to listing photos"
on storage.objects for select
to anon, authenticated
using (bucket_id = 'listing-photos');

create policy "Authenticated users can upload listing photos"
on storage.objects for insert
to authenticated
with check (bucket_id = 'listing-photos');

alter table public.listings
  add column photo_url text;
