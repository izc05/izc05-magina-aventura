create or replace function private.apply_catalog_manifest(
  payload jsonb,
  actor uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  route_item jsonb;
  source_item jsonb;
  restriction_item jsonb;
  poi_item jsonb;
  lead_item jsonb;
  route_uuid uuid;
  municipality_uuid uuid;
  municipality_slug text;
  primary_municipality text;
  source_external_id text;
  source_external_ids text[];
  import_run_id uuid;
  catalog_origin_value text;
  imported_route_count integer := 0;
  manifest_source_count integer := 0;
  imported_restriction_count integer := 0;
  imported_poi_count integer := 0;
  imported_track_lead_count integer := 0;
begin
  if jsonb_typeof(payload) is distinct from 'object' then
    raise exception 'catalog manifest root must be an object';
  end if;

  if nullif(btrim(payload->>'catalog'),'') is null then
    raise exception 'catalog manifest catalog is required';
  end if;
  if nullif(btrim(payload->>'snapshot_version'),'') is null then
    raise exception 'catalog manifest snapshot_version is required';
  end if;
  if nullif(btrim(payload->>'source_commit'),'') is null then
    raise exception 'catalog manifest source_commit is required';
  end if;
  if coalesce(payload->>'manifest_sha256','') !~ '^sha256:[a-f0-9]{64}$' then
    raise exception 'catalog manifest manifest_sha256 is invalid';
  end if;

  if jsonb_typeof(payload->'routes') is distinct from 'array' then
    raise exception 'catalog manifest routes must be an array';
  end if;
  if jsonb_typeof(payload->'sources') is distinct from 'array' then
    raise exception 'catalog manifest sources must be an array';
  end if;
  if jsonb_typeof(payload->'restrictions') is distinct from 'array' then
    raise exception 'catalog manifest restrictions must be an array';
  end if;
  if jsonb_typeof(payload->'pois') is distinct from 'array' then
    raise exception 'catalog manifest pois must be an array';
  end if;
  if jsonb_typeof(payload->'track_leads') is distinct from 'array' then
    raise exception 'catalog manifest track_leads must be an array';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    group by route_entry->>'id'
    having count(*) > 1
  ) then
    raise exception 'catalog manifest contains duplicate route ids';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    group by route_entry->>'code'
    having count(*) > 1
  ) then
    raise exception 'catalog manifest contains duplicate route codes';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    group by route_entry->>'slug'
    having count(*) > 1
  ) then
    raise exception 'catalog manifest contains duplicate route slugs';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    where nullif(btrim(route_entry->>'id'),'') is null
       or nullif(btrim(route_entry->>'code'),'') is null
       or nullif(btrim(route_entry->>'slug'),'') is null
       or nullif(btrim(route_entry->>'name'),'') is null
       or nullif(btrim(route_entry->>'primary_municipality'),'') is null
       or jsonb_typeof(route_entry->'municipalities') is distinct from 'array'
       or jsonb_typeof(route_entry->'source_ids') is distinct from 'array'
  ) then
    raise exception 'catalog manifest route identity fields are invalid';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    where not (route_entry->'municipalities') ? (route_entry->>'primary_municipality')
  ) then
    raise exception 'catalog manifest primary municipality must be listed in municipalities';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    where (route_entry ? 'route_kind')
      and route_entry->>'route_kind' is not null
      and route_entry->>'route_kind' not in ('circular','linear','out_and_back')
  ) then
    raise exception 'catalog manifest contains invalid route_kind';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry
    where (route_entry ? 'official_difficulty')
      and route_entry->>'official_difficulty' is not null
      and route_entry->>'official_difficulty' not in ('easy','moderate','hard','expert')
  ) then
    raise exception 'catalog manifest contains invalid official_difficulty';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry,
         jsonb_array_elements_text(route_entry->'municipalities') municipality(value)
    where not exists(
      select 1 from public.municipalities m where m.slug=municipality.value
    )
  ) then
    raise exception 'catalog manifest references unknown municipality';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'routes') route_entry,
         jsonb_array_elements_text(route_entry->'source_ids') source_ref(value)
    where not exists(
      select 1
      from jsonb_array_elements(payload->'sources') source_entry
      where source_entry->>'id'=source_ref.value
    )
  ) then
    raise exception 'catalog manifest route references unknown source';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'restrictions') restriction_entry
    where not exists(
      select 1
      from jsonb_array_elements(payload->'routes') route_entry
      where route_entry->>'id'=restriction_entry->>'route_id'
    )
  ) then
    raise exception 'catalog manifest restriction references unknown route';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'restrictions') restriction_entry,
         jsonb_array_elements_text(coalesce(restriction_entry->'source_ids','[]'::jsonb)) source_ref(value)
    where not exists(
      select 1
      from jsonb_array_elements(payload->'sources') source_entry
      where source_entry->>'id'=source_ref.value
    )
  ) then
    raise exception 'catalog manifest restriction references unknown source';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'pois') poi_entry
    where not exists(
      select 1 from jsonb_array_elements(payload->'routes') route_entry
      where route_entry->>'id'=poi_entry->>'route_id'
    )
  ) then
    raise exception 'catalog manifest poi references unknown route';
  end if;

  if exists(
    select 1
    from jsonb_array_elements(payload->'track_leads') lead_entry
    where not exists(
      select 1 from jsonb_array_elements(payload->'routes') route_entry
      where route_entry->>'id'=lead_entry->>'route_id'
    )
  ) then
    raise exception 'catalog manifest track lead references unknown route';
  end if;

  if actor is not null and not private.admin_has_capability('routes.manage', actor) then
    raise exception 'not authorized';
  end if;

  catalog_origin_value := case
    when payload->>'catalog'='sierra-magina-official' then 'junta_sierra_magina'
    else payload->>'catalog'
  end;

  insert into public.catalog_import_runs(
    catalog_name,snapshot_version,source_commit,manifest_sha256,status,
    route_count,source_count,restriction_count,poi_count
  ) values (
    payload->>'catalog',payload->>'snapshot_version',payload->>'source_commit',
    payload->>'manifest_sha256','running',0,0,0,0
  ) returning id into import_run_id;

  for route_item in select value from jsonb_array_elements(payload->'routes') loop
    primary_municipality := route_item->>'primary_municipality';
    select id into municipality_uuid
    from public.municipalities
    where slug=primary_municipality;

    select id into route_uuid
    from public.routes
    where canonical_catalog_id=route_item->>'id'
    for update;

    if route_uuid is null then
      insert into public.routes(
        municipality_id,slug,title,status,route_code,canonical_catalog_id,catalog_origin
      ) values (
        municipality_uuid,
        route_item->>'slug',
        route_item->>'name',
        'draft',
        route_item->>'code',
        route_item->>'id',
        catalog_origin_value
      ) returning id into route_uuid;
    else
      update public.routes
      set catalog_origin=catalog_origin_value,
          municipality_id=municipality_uuid,
          route_code=coalesce(route_code,route_item->>'code'),
          updated_at=now()
      where id=route_uuid;
    end if;

    insert into public.route_validation_status(route_id)
    values(route_uuid)
    on conflict(route_id) do nothing;

    insert into public.route_catalog_profiles(
      route_id,canonical_catalog_id,source_snapshot_version,source_snapshot_commit,
      verification_state,route_kind,distance_km,duration_minutes_min,
      duration_minutes_max,official_difficulty,elevation_gain_m,elevation_loss_m,
      elevation_min_m,elevation_max_m,family_profile,accessibility_facts,
      stable_safety_facts,editorial_facts,source_checked_at,updated_at
    ) values (
      route_uuid,
      route_item->>'id',
      payload->>'snapshot_version',
      payload->>'source_commit',
      coalesce(route_item->>'verification_state','unknown'),
      nullif(route_item->>'route_kind',''),
      nullif(route_item->>'distance_km','')::numeric,
      nullif(route_item->>'duration_minutes_min','')::integer,
      nullif(route_item->>'duration_minutes_max','')::integer,
      nullif(route_item->>'official_difficulty',''),
      nullif(route_item->>'elevation_gain_m','')::integer,
      nullif(route_item->>'elevation_loss_m','')::integer,
      nullif(route_item->>'elevation_min_m','')::integer,
      nullif(route_item->>'elevation_max_m','')::integer,
      coalesce(route_item->'family_profile','{}'::jsonb),
      coalesce(route_item->'accessibility_facts','[]'::jsonb),
      coalesce(route_item->'stable_safety_facts','[]'::jsonb),
      coalesce(route_item->'editorial_facts','[]'::jsonb),
      (route_item->>'source_checked_at')::timestamptz,
      now()
    )
    on conflict(route_id) do update set
      canonical_catalog_id=excluded.canonical_catalog_id,
      source_snapshot_version=excluded.source_snapshot_version,
      source_snapshot_commit=excluded.source_snapshot_commit,
      verification_state=excluded.verification_state,
      route_kind=excluded.route_kind,
      distance_km=excluded.distance_km,
      duration_minutes_min=excluded.duration_minutes_min,
      duration_minutes_max=excluded.duration_minutes_max,
      official_difficulty=excluded.official_difficulty,
      elevation_gain_m=excluded.elevation_gain_m,
      elevation_loss_m=excluded.elevation_loss_m,
      elevation_min_m=excluded.elevation_min_m,
      elevation_max_m=excluded.elevation_max_m,
      family_profile=excluded.family_profile,
      accessibility_facts=excluded.accessibility_facts,
      stable_safety_facts=excluded.stable_safety_facts,
      editorial_facts=excluded.editorial_facts,
      source_checked_at=excluded.source_checked_at,
      updated_at=now();

    delete from public.route_municipalities
    where route_id=route_uuid and source_kind='catalog';

    for municipality_slug in
      select value from jsonb_array_elements_text(route_item->'municipalities')
    loop
      select id into municipality_uuid
      from public.municipalities
      where slug=municipality_slug;

      insert into public.route_municipalities(
        route_id,municipality_id,is_primary,source_kind
      ) values (
        route_uuid,
        municipality_uuid,
        municipality_slug=primary_municipality,
        'catalog'
      )
      on conflict(route_id,municipality_id) do nothing;
    end loop;

    select coalesce(array_agg(distinct refs.source_id),'{}'::text[])
    into source_external_ids
    from (
      select value as source_id
      from jsonb_array_elements_text(route_item->'source_ids')
      union all
      select restriction_source.value
      from jsonb_array_elements(payload->'restrictions') restriction_entry,
           jsonb_array_elements_text(coalesce(restriction_entry->'source_ids','[]'::jsonb)) restriction_source(value)
      where restriction_entry->>'route_id'=route_item->>'id'
      union all
      select poi_source.value
      from jsonb_array_elements(payload->'pois') poi_entry,
           jsonb_array_elements_text(coalesce(poi_entry->'source_ids','[]'::jsonb)) poi_source(value)
      where poi_entry->>'route_id'=route_item->>'id'
      union all
      select lead_entry->>'external_source_id'
      from jsonb_array_elements(payload->'track_leads') lead_entry
      where lead_entry->>'route_id'=route_item->>'id'
        and nullif(lead_entry->>'external_source_id','') is not null
    ) refs;

    foreach source_external_id in array source_external_ids loop
      select value into source_item
      from jsonb_array_elements(payload->'sources')
      where value->>'id'=source_external_id
      limit 1;

      if source_item is null then
        raise exception 'catalog manifest route source % not found',source_external_id;
      end if;

      insert into public.route_sources(
        route_id,label,url,source_type,official,checked_at,notes,created_by,
        external_source_id,verification_state
      ) values (
        route_uuid,
        source_item->>'title',
        source_item->>'url',
        case when source_item->>'source_type'='official_authority' then 'official' else 'other' end,
        source_item->>'verification_state'='official_verified',
        (source_item->>'checked_at')::timestamptz,
        'Importado de catálogo canónico '||(payload->>'snapshot_version'),
        actor,
        source_external_id,
        source_item->>'verification_state'
      )
      on conflict(route_id,external_source_id) where external_source_id is not null
      do update set
        label=excluded.label,
        url=excluded.url,
        source_type=excluded.source_type,
        official=excluded.official,
        checked_at=excluded.checked_at,
        notes=excluded.notes,
        verification_state=excluded.verification_state,
        updated_at=now();
    end loop;

    imported_route_count := imported_route_count + 1;
  end loop;

  for restriction_item in select value from jsonb_array_elements(payload->'restrictions') loop
    select id into route_uuid
    from public.routes
    where canonical_catalog_id=restriction_item->>'route_id';

    insert into public.route_catalog_restrictions(
      route_id,external_restriction_id,restriction_type,severity,status,
      starts_at,ends_at,published_at,checked_at,reason,source_external_ids,
      verification_state
    ) values (
      route_uuid,
      restriction_item->>'id',
      restriction_item->>'type',
      restriction_item->>'severity',
      restriction_item->>'status',
      nullif(restriction_item->>'starts_at','')::timestamptz,
      nullif(restriction_item->>'ends_at','')::timestamptz,
      nullif(restriction_item->>'published_at','')::timestamptz,
      (restriction_item->>'checked_at')::timestamptz,
      restriction_item->>'reason',
      coalesce(array(select jsonb_array_elements_text(coalesce(restriction_item->'source_ids','[]'::jsonb))),'{}'::text[]),
      restriction_item->>'verification_state'
    )
    on conflict(route_id,external_restriction_id) do update set
      restriction_type=excluded.restriction_type,
      severity=excluded.severity,
      status=excluded.status,
      starts_at=excluded.starts_at,
      ends_at=excluded.ends_at,
      published_at=excluded.published_at,
      checked_at=excluded.checked_at,
      reason=excluded.reason,
      source_external_ids=excluded.source_external_ids,
      verification_state=excluded.verification_state,
      imported_at=now();

    imported_restriction_count := imported_restriction_count + 1;
  end loop;

  for poi_item in select value from jsonb_array_elements(payload->'pois') loop
    select id into route_uuid
    from public.routes
    where canonical_catalog_id=poi_item->>'route_id';

    insert into public.route_catalog_pois(
      route_id,external_poi_id,name,category,longitude,latitude,water_metadata,
      verification_state,source_external_ids,notes
    ) values (
      route_uuid,
      poi_item->>'id',
      poi_item->>'name',
      poi_item->>'category',
      nullif(poi_item->>'longitude','')::numeric,
      nullif(poi_item->>'latitude','')::numeric,
      poi_item->'water_metadata',
      poi_item->>'verification_state',
      coalesce(array(select jsonb_array_elements_text(coalesce(poi_item->'source_ids','[]'::jsonb))),'{}'::text[]),
      coalesce(poi_item->>'notes','')
    )
    on conflict(route_id,external_poi_id) do update set
      name=excluded.name,
      category=excluded.category,
      longitude=excluded.longitude,
      latitude=excluded.latitude,
      water_metadata=excluded.water_metadata,
      verification_state=excluded.verification_state,
      source_external_ids=excluded.source_external_ids,
      notes=excluded.notes,
      imported_at=now();

    imported_poi_count := imported_poi_count + 1;
  end loop;

  for lead_item in select value from jsonb_array_elements(payload->'track_leads') loop
    select id into route_uuid
    from public.routes
    where canonical_catalog_id=lead_item->>'route_id';

    insert into public.route_catalog_track_leads(
      route_id,external_source_id,source_url,format,source_kind,status,notes,
      checked_at,fetched_at,validated_at
    ) values (
      route_uuid,
      nullif(lead_item->>'external_source_id',''),
      lead_item->>'source_url',
      lead_item->>'format',
      lead_item->>'source_kind',
      coalesce(lead_item->>'status','discovered'),
      coalesce(lead_item->>'notes',''),
      (lead_item->>'checked_at')::timestamptz,
      nullif(lead_item->>'fetched_at','')::timestamptz,
      nullif(lead_item->>'validated_at','')::timestamptz
    )
    on conflict(route_id,source_url,format) do update set
      external_source_id=excluded.external_source_id,
      source_kind=excluded.source_kind,
      status=excluded.status,
      notes=excluded.notes,
      checked_at=excluded.checked_at,
      fetched_at=excluded.fetched_at,
      validated_at=excluded.validated_at;

    imported_track_lead_count := imported_track_lead_count + 1;
  end loop;

  manifest_source_count := jsonb_array_length(payload->'sources');

  update public.catalog_import_runs
  set completed_at=now(),
      status='completed',
      route_count=imported_route_count,
      source_count=manifest_source_count,
      restriction_count=imported_restriction_count,
      poi_count=imported_poi_count
  where id=import_run_id;

  return jsonb_build_object(
    'import_run_id',import_run_id,
    'routes',imported_route_count,
    'sources',manifest_source_count,
    'restrictions',imported_restriction_count,
    'pois',imported_poi_count,
    'trackLeads',imported_track_lead_count
  );
end;
$$;

revoke all on function private.apply_catalog_manifest(jsonb,uuid) from public;

create or replace function public.admin_ingest_catalog_manifest(payload jsonb)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  actor uuid := auth.uid();
begin
  if actor is null then
    raise exception 'authentication required';
  end if;
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;

  return private.apply_catalog_manifest(payload,actor);
end;
$$;

revoke all on function public.admin_ingest_catalog_manifest(jsonb) from public;
revoke execute on function public.admin_ingest_catalog_manifest(jsonb) from anon;
grant execute on function public.admin_ingest_catalog_manifest(jsonb) to authenticated;
