create or replace function private.route_v2_readiness(target_route_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  content_version integer;
  geometry_version integer;
  has_content boolean := false;
  has_geometry boolean := false;
  has_official_source boolean := false;
  track_verified boolean := false;
  editorial_verified boolean := false;
  safety_reviewed boolean := false;
  blocking_incidents integer := 0;
  validation public.route_validation_status%rowtype;
  reasons text[] := '{}';
  ready boolean := false;
begin
  select r.current_content_version, r.current_geometry_version
    into content_version, geometry_version
  from public.routes r
  where r.id = target_route_id;

  if not found then
    raise exception 'route not found';
  end if;

  select exists(
    select 1 from public.route_versions v
    where v.route_id=target_route_id and v.version=content_version
  ) into has_content;

  select exists(
    select 1 from public.route_geometries g
    where g.route_id=target_route_id and g.version=geometry_version
  ) into has_geometry;

  select exists(
    select 1 from public.route_sources s
    where s.route_id=target_route_id and s.official=true
  ) into has_official_source;

  select * into validation
  from public.route_validation_status v
  where v.route_id=target_route_id;

  editorial_verified := found and validation.editorial_status='verified';
  safety_reviewed := found and validation.safety_status='reviewed';

  track_verified := found
    and validation.track_status='verified'
    and has_geometry
    and exists(
      select 1 from public.route_track_sources ts
      where ts.route_id=target_route_id
        and ts.geometry_version=geometry_version
        and ts.validated_at is not null
        and ts.validated_by is not null
    );

  select count(*)::integer into blocking_incidents
  from public.route_safety_incidents i
  where i.route_id=target_route_id
    and i.status='open'
    and i.blocks_adventure=true
    and i.starts_at <= now()
    and (i.ends_at is null or i.ends_at > now());

  if not has_content then reasons := array_append(reasons,'Falta contenido actual'); end if;
  if not has_geometry then reasons := array_append(reasons,'Falta geometría actual'); end if;
  if not has_official_source then reasons := array_append(reasons,'Falta fuente oficial'); end if;
  if not track_verified then reasons := array_append(reasons,'Falta track verificado'); end if;
  if not editorial_verified then reasons := array_append(reasons,'Falta validación editorial'); end if;
  if not safety_reviewed then reasons := array_append(reasons,'Falta revisión de seguridad'); end if;
  if blocking_incidents > 0 then reasons := array_append(reasons,'Existe una incidencia bloqueante'); end if;

  ready := has_content
    and has_geometry
    and has_official_source
    and track_verified
    and editorial_verified
    and safety_reviewed
    and blocking_incidents=0;

  return jsonb_build_object(
    'has_content',has_content,
    'has_geometry',has_geometry,
    'has_official_source',has_official_source,
    'track_verified',track_verified,
    'editorial_verified',editorial_verified,
    'safety_reviewed',safety_reviewed,
    'blocking_incidents',blocking_incidents,
    'ready',ready,
    'reasons',to_jsonb(reasons)
  );
end;
$$;

revoke all on function private.route_v2_readiness(uuid) from public;
grant execute on function private.route_v2_readiness(uuid) to authenticated;

create or replace function private.admin_route_master_snapshot(target_route_id uuid, actor uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  route_payload jsonb;
  content_payload jsonb;
  geometry_payload jsonb;
  validation_payload jsonb;
  access_payload jsonb;
  sources_payload jsonb;
  track_payload jsonb;
  checkpoints_payload jsonb;
  discoveries_payload jsonb;
  media_payload jsonb;
  safety_payload jsonb;
  readiness_payload jsonb;
begin
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'id',r.id,
    'route_code',r.route_code,
    'title',r.title,
    'slug',r.slug,
    'status',r.status,
    'municipality_id',r.municipality_id,
    'municipality',m.name,
    'municipality_slug',m.slug,
    'current_content_version',r.current_content_version,
    'current_geometry_version',r.current_geometry_version,
    'created_at',r.created_at,
    'updated_at',r.updated_at
  ) into route_payload
  from public.routes r
  join public.municipalities m on m.id=r.municipality_id
  where r.id=target_route_id;

  if route_payload is null then
    raise exception 'route not found';
  end if;

  select to_jsonb(v) into content_payload
  from public.route_versions v
  join public.routes r on r.id=v.route_id and r.current_content_version=v.version
  where v.route_id=target_route_id;

  select jsonb_build_object(
    'version',g.version,
    'coordinates',(extensions.st_asgeojson(g.geometry)::jsonb)->'coordinates',
    'start',jsonb_build_array(extensions.st_x(g.start_point),extensions.st_y(g.start_point)),
    'created_at',g.created_at
  ) into geometry_payload
  from public.route_geometries g
  join public.routes r on r.id=g.route_id and r.current_geometry_version=g.version
  where g.route_id=target_route_id;

  select to_jsonb(v) into validation_payload
  from public.route_validation_status v
  where v.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',a.id,
    'kind',a.kind,
    'name',a.name,
    'lng',extensions.st_x(a.position),
    'lat',extensions.st_y(a.position),
    'notes',a.notes,
    'active',a.active,
    'created_at',a.created_at,
    'updated_at',a.updated_at
  ) order by a.kind,a.name),'[]'::jsonb)
  into access_payload
  from public.route_access_points a
  where a.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',s.id,
    'label',s.label,
    'url',s.url,
    'source_type',s.source_type,
    'official',s.official,
    'checked_at',s.checked_at,
    'notes',s.notes,
    'created_at',s.created_at,
    'updated_at',s.updated_at
  ) order by s.official desc,s.label),'[]'::jsonb)
  into sources_payload
  from public.route_sources s
  where s.route_id=target_route_id;

  select jsonb_build_object(
    'route_id',ts.route_id,
    'geometry_version',ts.geometry_version,
    'source_id',ts.source_id,
    'source_url',ts.source_url,
    'format',ts.format,
    'source_kind',ts.source_kind,
    'original_filename',ts.original_filename,
    'source_hash',ts.source_hash,
    'imported_at',ts.imported_at,
    'validated_at',ts.validated_at,
    'validated_by',ts.validated_by,
    'notes',ts.notes
  ) into track_payload
  from public.route_track_sources ts
  join public.routes r on r.id=ts.route_id and r.current_geometry_version=ts.geometry_version
  where ts.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',c.id,
    'name',c.name,
    'lng',extensions.st_x(c.position),
    'lat',extensions.st_y(c.position),
    'radius_m',c.trigger_radius_m,
    'required',c.required,
    'active',c.active
  ) order by c.name),'[]'::jsonb)
  into checkpoints_payload
  from public.checkpoints c
  where c.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',d.id,
    'name',d.name,
    'category',d.category,
    'lng',extensions.st_x(d.position),
    'lat',extensions.st_y(d.position),
    'radius_m',d.trigger_radius_m,
    'reward_xp',d.reward_xp,
    'reward_olives',d.reward_olives,
    'active',d.active
  ) order by d.category,d.name),'[]'::jsonb)
  into discoveries_payload
  from public.discoveries d
  where d.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',ma.id,
    'title',ma.title,
    'object_key',ma.object_key,
    'mime_type',ma.mime_type,
    'alt_text',ma.alt_text,
    'archived',ma.archived,
    'kind',rm.kind,
    'sort_order',rm.sort_order
  ) order by rm.sort_order,ma.title),'[]'::jsonb)
  into media_payload
  from public.route_media rm
  join public.media_assets ma on ma.id=rm.media_id
  where rm.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',i.id,
    'title',i.title,
    'description',i.description,
    'severity',i.severity,
    'status',i.status,
    'starts_at',i.starts_at,
    'ends_at',i.ends_at,
    'blocks_adventure',i.blocks_adventure,
    'resolved_at',i.resolved_at
  ) order by i.starts_at desc),'[]'::jsonb)
  into safety_payload
  from public.route_safety_incidents i
  where i.route_id=target_route_id;

  readiness_payload := private.route_v2_readiness(target_route_id);

  return jsonb_build_object(
    'route',route_payload,
    'content',content_payload,
    'geometry',geometry_payload,
    'validation',validation_payload,
    'access_points',access_payload,
    'sources',sources_payload,
    'track_source',track_payload,
    'checkpoints',checkpoints_payload,
    'discoveries',discoveries_payload,
    'media',media_payload,
    'safety',safety_payload,
    'readiness',readiness_payload
  );
end;
$$;

revoke all on function private.admin_route_master_snapshot(uuid,uuid) from public;
grant execute on function private.admin_route_master_snapshot(uuid,uuid) to authenticated;

create or replace function public.admin_route_master_snapshot(target_route_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select private.admin_route_master_snapshot(target_route_id,auth.uid());
$$;

revoke all on function public.admin_route_master_snapshot(uuid) from public;
grant execute on function public.admin_route_master_snapshot(uuid) to authenticated;
