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
  operational_blocking_incidents integer := 0;
  catalog_blocking_restrictions integer := 0;
  blocking_incidents integer := 0;
  validation public.route_validation_status%rowtype;
  reasons text[] := '{}';
  ready boolean := false;
begin
  select r.current_content_version, r.current_geometry_version
    into current_content_version, current_geometry_version
  from public.routes r
  where r.id=target_route_id;

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

  select count(*)::integer into operational_blocking_incidents
  from public.route_safety_incidents i
  where i.route_id=target_route_id
    and i.status='open'
    and i.blocks_adventure=true
    and i.starts_at <= now()
    and (i.ends_at is null or i.ends_at > now());

  select count(*)::integer into catalog_blocking_restrictions
  from public.route_catalog_restrictions r
  where r.route_id=target_route_id
    and r.status='active'
    and r.severity='blocking'
    and (r.starts_at is null or r.starts_at <= now())
    and (r.ends_at is null or r.ends_at > now());

  blocking_incidents := operational_blocking_incidents + catalog_blocking_restrictions;

  if not has_content then reasons := array_append(reasons,'Falta contenido actual'); end if;
  if not has_geometry then reasons := array_append(reasons,'Falta geometría actual'); end if;
  if not has_official_source then reasons := array_append(reasons,'Falta fuente oficial'); end if;
  if not track_verified then reasons := array_append(reasons,'Falta track verificado'); end if;
  if not editorial_verified then reasons := array_append(reasons,'Falta validación editorial'); end if;
  if not safety_reviewed then reasons := array_append(reasons,'Falta revisión de seguridad'); end if;
  if operational_blocking_incidents > 0 then
    reasons := array_append(reasons,'Existe una incidencia bloqueante');
  end if;
  if catalog_blocking_restrictions > 0 then
    reasons := array_append(reasons,'Existe una restricción oficial bloqueante');
  end if;

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
    'blocking_operational_incidents',operational_blocking_incidents,
    'blocking_catalog_restrictions',catalog_blocking_restrictions,
    'ready',ready,
    'reasons',to_jsonb(reasons)
  );
end;
$$;

revoke all on function private.route_v2_readiness(uuid) from public;
grant execute on function private.route_v2_readiness(uuid) to authenticated;

create or replace function public.route_adventure_gate(target_route_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select jsonb_build_object(
    'route_id', target_route_id,
    'published', exists(
      select 1 from public.routes r
      where r.id=target_route_id and r.status='published'
    ),
    'can_start',
      exists(select 1 from public.routes r where r.id=target_route_id and r.status='published')
      and not exists(
        select 1
        from public.route_safety_incidents s
        where s.route_id=target_route_id
          and s.status='open'
          and s.blocks_adventure
          and s.starts_at <= now()
          and (s.ends_at is null or s.ends_at > now())
      )
      and not exists(
        select 1
        from public.route_catalog_restrictions c
        where c.route_id=target_route_id
          and c.status='active'
          and c.severity='blocking'
          and (c.starts_at is null or c.starts_at <= now())
          and (c.ends_at is null or c.ends_at > now())
      ),
    'blocking_incidents', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',s.id,
        'title',s.title,
        'description',s.description,
        'severity',s.severity,
        'starts_at',s.starts_at,
        'ends_at',s.ends_at
      ) order by s.starts_at desc)
      from public.route_safety_incidents s
      where s.route_id=target_route_id
        and s.status='open'
        and s.blocks_adventure
        and s.starts_at <= now()
        and (s.ends_at is null or s.ends_at > now())
    ), '[]'::jsonb),
    'blocking_catalog_restrictions', coalesce((
      select jsonb_agg(jsonb_build_object(
        'id',c.id,
        'external_restriction_id',c.external_restriction_id,
        'type',c.restriction_type,
        'reason',c.reason,
        'checked_at',c.checked_at,
        'starts_at',c.starts_at,
        'ends_at',c.ends_at
      ) order by c.checked_at desc)
      from public.route_catalog_restrictions c
      where c.route_id=target_route_id
        and c.status='active'
        and c.severity='blocking'
        and (c.starts_at is null or c.starts_at <= now())
        and (c.ends_at is null or c.ends_at > now())
    ), '[]'::jsonb)
  );
$$;

revoke all on function public.route_adventure_gate(uuid) from public;
grant execute on function public.route_adventure_gate(uuid) to anon, authenticated;

alter function private.admin_route_master_snapshot(uuid,uuid)
  rename to admin_route_master_snapshot_v2_base;

revoke all on function private.admin_route_master_snapshot_v2_base(uuid,uuid) from public;
revoke execute on function private.admin_route_master_snapshot_v2_base(uuid,uuid) from authenticated;

create or replace function private.admin_route_master_snapshot(
  target_route_id uuid,
  actor uuid default auth.uid()
)
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare
  base_payload jsonb;
  catalog_profile_payload jsonb;
  municipalities_payload jsonb;
  restrictions_payload jsonb;
  pois_payload jsonb;
  track_leads_payload jsonb;
  import_payload jsonb;
begin
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;

  base_payload := private.admin_route_master_snapshot_v2_base(target_route_id,actor);

  select to_jsonb(p)
  into catalog_profile_payload
  from public.route_catalog_profiles p
  where p.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',m.id,
    'slug',m.slug,
    'name',m.name,
    'is_primary',rm.is_primary,
    'source_kind',rm.source_kind
  ) order by rm.is_primary desc,m.name),'[]'::jsonb)
  into municipalities_payload
  from public.route_municipalities rm
  join public.municipalities m on m.id=rm.municipality_id
  where rm.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',r.id,
    'external_restriction_id',r.external_restriction_id,
    'restriction_type',r.restriction_type,
    'severity',r.severity,
    'status',r.status,
    'starts_at',r.starts_at,
    'ends_at',r.ends_at,
    'published_at',r.published_at,
    'checked_at',r.checked_at,
    'reason',r.reason,
    'source_external_ids',to_jsonb(r.source_external_ids),
    'verification_state',r.verification_state
  ) order by (r.status='active') desc,r.checked_at desc),'[]'::jsonb)
  into restrictions_payload
  from public.route_catalog_restrictions r
  where r.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',p.id,
    'external_poi_id',p.external_poi_id,
    'name',p.name,
    'category',p.category,
    'longitude',p.longitude,
    'latitude',p.latitude,
    'water_metadata',p.water_metadata,
    'verification_state',p.verification_state,
    'source_external_ids',to_jsonb(p.source_external_ids),
    'notes',p.notes
  ) order by p.category,p.name),'[]'::jsonb)
  into pois_payload
  from public.route_catalog_pois p
  where p.route_id=target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id',t.id,
    'external_source_id',t.external_source_id,
    'source_url',t.source_url,
    'format',t.format,
    'source_kind',t.source_kind,
    'status',t.status,
    'notes',t.notes,
    'checked_at',t.checked_at,
    'fetched_at',t.fetched_at,
    'validated_at',t.validated_at
  ) order by t.checked_at desc),'[]'::jsonb)
  into track_leads_payload
  from public.route_catalog_track_leads t
  where t.route_id=target_route_id;

  select to_jsonb(i)
  into import_payload
  from public.catalog_import_runs i
  join public.route_catalog_profiles p
    on p.route_id=target_route_id
   and p.source_snapshot_version=i.snapshot_version
   and p.source_snapshot_commit=i.source_commit
  where i.status='completed'
  order by i.completed_at desc nulls last,i.started_at desc
  limit 1;

  return base_payload || jsonb_build_object(
    'catalog_profile',catalog_profile_payload,
    'municipalities',municipalities_payload,
    'catalog_restrictions',restrictions_payload,
    'catalog_pois',pois_payload,
    'catalog_track_leads',track_leads_payload,
    'catalog_import',import_payload
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
revoke execute on function public.admin_route_master_snapshot(uuid) from anon;
grant execute on function public.admin_route_master_snapshot(uuid) to authenticated;
