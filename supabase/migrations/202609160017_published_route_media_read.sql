-- Allow the public/mobile app to consume only media that is attached to a
-- published route. The bucket stays private; RLS authorizes object download.

grant select on public.media_assets, public.route_media to anon, authenticated;

create policy "public read media links for published routes"
on public.route_media
for select
to anon, authenticated
using (
  exists (
    select 1
    from public.routes r
    where r.id = route_media.route_id
      and r.status = 'published'
  )
);

create policy "public read assets used by published routes"
on public.media_assets
for select
to anon, authenticated
using (
  not archived
  and exists (
    select 1
    from public.route_media rm
    join public.routes r on r.id = rm.route_id
    where rm.media_id = media_assets.id
      and r.status = 'published'
  )
);

create policy "public download media used by published routes"
on storage.objects
for select
to anon, authenticated
using (
  bucket_id = 'media'
  and exists (
    select 1
    from public.media_assets ma
    join public.route_media rm on rm.media_id = ma.id
    join public.routes r on r.id = rm.route_id
    where ma.object_key = storage.objects.name
      and not ma.archived
      and r.status = 'published'
  )
);
