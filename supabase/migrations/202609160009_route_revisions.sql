create or replace function private.admin_save_route_geometry(target_route_id uuid, geometry_wkt text, actor uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare current_version integer; next_version integer; current_status text; geom extensions.geometry;
begin
  if not private.admin_has_capability('routes.manage',actor) then raise exception 'not authorized'; end if;
  select current_geometry_version,status into current_version,current_status from public.routes where id=target_route_id for update;
  if current_version is null then raise exception 'route not found'; end if;

  geom := extensions.st_geomfromewkt(geometry_wkt);
  if extensions.geometrytype(geom) <> 'LINESTRING' then raise exception 'geometry must be a LineString'; end if;
  if extensions.st_srid(geom) <> 4326 then raise exception 'geometry SRID must be 4326'; end if;
  if extensions.st_npoints(geom) < 2 then raise exception 'geometry requires at least two points'; end if;

  if exists(select 1 from public.route_geometries g where g.route_id=target_route_id and g.version=current_version) then
    next_version := current_version + 1;
  else
    next_version := current_version;
  end if;

  insert into public.route_geometries(route_id,version,geometry,start_point)
  values(target_route_id,next_version,geom,extensions.st_startpoint(geom));

  update public.routes
  set current_geometry_version=next_version,
      status=case when current_status='published' then 'review' else current_status end,
      updated_at=now()
  where id=target_route_id;

  perform private.write_admin_audit('route.geometry.revision','routes',target_route_id::text,jsonb_build_object('version',current_version,'status',current_status),jsonb_build_object('version',next_version,'status',case when current_status='published' then 'review' else current_status end),actor);
  return next_version;
end;
$$;

create or replace function private.admin_update_route_content(
  target_route_id uuid,
  new_description text,
  new_safety_notes jsonb,
  new_distance_km numeric,
  new_elevation_gain_m integer,
  new_duration_minutes integer,
  new_difficulty text,
  new_reward_xp integer,
  new_reward_olives integer,
  new_offline_available boolean,
  actor uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare current_version integer; next_version integer; current_status text; current_discovery_count integer;
begin
  if not private.admin_has_capability('routes.manage',actor) then raise exception 'not authorized'; end if;
  if length(btrim(coalesce(new_description,'')))=0 then raise exception 'description required'; end if;
  if new_distance_km < 0 then raise exception 'distance must be non-negative'; end if;
  if new_elevation_gain_m < 0 then raise exception 'elevation gain must be non-negative'; end if;
  if new_duration_minutes <= 0 then raise exception 'duration must be positive'; end if;
  if new_difficulty not in ('easy','moderate','hard') then raise exception 'invalid difficulty'; end if;
  if new_reward_xp < 0 or new_reward_olives < 0 then raise exception 'rewards must be non-negative'; end if;

  select current_content_version,status into current_version,current_status from public.routes where id=target_route_id for update;
  if current_version is null then raise exception 'route not found'; end if;
  select count(*) into current_discovery_count from public.discoveries where route_id=target_route_id and active;

  if exists(select 1 from public.route_versions v where v.route_id=target_route_id and v.version=current_version) then
    next_version := current_version + 1;
  else
    next_version := current_version;
  end if;

  insert into public.route_versions(
    route_id,version,description,safety_notes,distance_km,elevation_gain_m,duration_minutes,difficulty,
    reward_xp,reward_olives,discovery_count,offline_available,development_fixture
  ) values(
    target_route_id,next_version,btrim(new_description),coalesce(new_safety_notes,'[]'::jsonb),new_distance_km,
    new_elevation_gain_m,new_duration_minutes,new_difficulty,new_reward_xp,new_reward_olives,current_discovery_count,
    new_offline_available,false
  );

  update public.routes
  set current_content_version=next_version,
      status=case when current_status='published' then 'review' else current_status end,
      updated_at=now()
  where id=target_route_id;

  perform private.write_admin_audit('route.content.revision','routes',target_route_id::text,jsonb_build_object('version',current_version,'status',current_status),jsonb_build_object('version',next_version,'status',case when current_status='published' then 'review' else current_status end),actor);
  return next_version;
end;
$$;
revoke all on function private.admin_update_route_content(uuid,text,jsonb,numeric,integer,integer,text,integer,integer,boolean,uuid) from public;
grant execute on function private.admin_update_route_content(uuid,text,jsonb,numeric,integer,integer,text,integer,integer,boolean,uuid) to authenticated;

create or replace function public.admin_update_route_content(
  target_route_id uuid,
  new_description text,
  new_safety_notes jsonb,
  new_distance_km numeric,
  new_elevation_gain_m integer,
  new_duration_minutes integer,
  new_difficulty text,
  new_reward_xp integer,
  new_reward_olives integer,
  new_offline_available boolean
)
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.admin_update_route_content(target_route_id,new_description,new_safety_notes,new_distance_km,new_elevation_gain_m,new_duration_minutes,new_difficulty,new_reward_xp,new_reward_olives,new_offline_available,auth.uid());
$$;
revoke all on function public.admin_update_route_content(uuid,text,jsonb,numeric,integer,integer,text,integer,integer,boolean) from public;
grant execute on function public.admin_update_route_content(uuid,text,jsonb,numeric,integer,integer,text,integer,integer,boolean) to authenticated;
