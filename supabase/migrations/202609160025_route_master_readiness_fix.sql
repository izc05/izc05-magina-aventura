create or replace function private.route_v2_readiness(target_route_id uuid)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  current_content_version integer;
  current_geometry_version integer;
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
    into current_content_version, current_geometry_version
  from public.routes r
  where r.id = target_route_id;

  if not found then
    raise exception 'route not found';
  end if;

  select exists(
    select 1 from public.route_versions v
    where v.route_id=target_route_id and v.version=current_content_version
  ) into has_content;

  select exists(
    select 1 from public.route_geometries g
    where g.route_id=target_route_id and g.version=current_geometry_version
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
        and ts.geometry_version=current_geometry_version
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
