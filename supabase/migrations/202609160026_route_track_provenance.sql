create or replace function private.admin_import_route_track(
  target_route_id uuid,
  geometry_wkt text,
  track_format text,
  track_source_kind text,
  track_source_url text default null,
  track_original_filename text default null,
  track_source_hash text default null,
  track_source_id uuid default null,
  track_notes text default '',
  actor uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  new_geometry_version integer;
  linked_source_route_id uuid;
begin
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;
  if track_format not in ('gpx','kml','geojson','manual') then
    raise exception 'invalid track format';
  end if;
  if track_source_kind not in ('official','field','community','manual') then
    raise exception 'invalid track source kind';
  end if;
  if track_source_url is not null and track_source_url !~ '^https?://' then
    raise exception 'invalid track source url';
  end if;
  if track_source_id is not null then
    select s.route_id into linked_source_route_id
    from public.route_sources s
    where s.id=track_source_id;
    if linked_source_route_id is null or linked_source_route_id<>target_route_id then
      raise exception 'track source does not belong to route';
    end if;
  end if;

  new_geometry_version := private.admin_save_route_geometry(target_route_id,geometry_wkt,actor);

  insert into public.route_track_sources(
    route_id,geometry_version,source_id,source_url,format,source_kind,
    original_filename,source_hash,notes
  ) values (
    target_route_id,new_geometry_version,track_source_id,track_source_url,track_format,track_source_kind,
    nullif(btrim(coalesce(track_original_filename,'')),''),nullif(btrim(coalesce(track_source_hash,'')),''),btrim(coalesce(track_notes,''))
  );

  insert into public.route_validation_status(route_id,track_status,verified_by,verified_at,updated_at)
  values(target_route_id,'imported',null,null,now())
  on conflict(route_id) do update
    set track_status='imported', verified_by=null, verified_at=null, updated_at=now();

  perform private.write_admin_audit(
    'route.track.import','routes',target_route_id::text,null,
    jsonb_build_object(
      'geometry_version',new_geometry_version,
      'format',track_format,
      'source_kind',track_source_kind,
      'source_id',track_source_id,
      'source_url',track_source_url,
      'source_hash',track_source_hash
    ),actor
  );

  return new_geometry_version;
end;
$$;

revoke all on function private.admin_import_route_track(uuid,text,text,text,text,text,text,uuid,text,uuid) from public;
grant execute on function private.admin_import_route_track(uuid,text,text,text,text,text,text,uuid,text,uuid) to authenticated;

create or replace function public.admin_import_route_track(
  target_route_id uuid,
  geometry_wkt text,
  track_format text,
  track_source_kind text,
  track_source_url text default null,
  track_original_filename text default null,
  track_source_hash text default null,
  track_source_id uuid default null,
  track_notes text default ''
)
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.admin_import_route_track(
    target_route_id,geometry_wkt,track_format,track_source_kind,track_source_url,
    track_original_filename,track_source_hash,track_source_id,track_notes,auth.uid()
  );
$$;

revoke all on function public.admin_import_route_track(uuid,text,text,text,text,text,text,uuid,text) from public;
grant execute on function public.admin_import_route_track(uuid,text,text,text,text,text,text,uuid,text) to authenticated;
