create or replace function private.admin_get_route_geometry(target_route_id uuid, actor uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare payload jsonb;
begin
  if not (
    private.admin_has_capability('map.manage', actor)
    or private.admin_has_capability('routes.manage', actor)
  ) then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'route_id', r.id,
    'title', r.title,
    'status', r.status,
    'version', g.version,
    'coordinates', (extensions.st_asgeojson(g.geometry)::jsonb)->'coordinates',
    'start', jsonb_build_array(extensions.st_x(g.start_point), extensions.st_y(g.start_point))
  )
  into payload
  from public.routes r
  join public.route_geometries g
    on g.route_id = r.id
   and g.version = r.current_geometry_version
  where r.id = target_route_id;

  if payload is null then
    raise exception 'route geometry not found';
  end if;

  return payload;
end;
$$;

revoke all on function private.admin_get_route_geometry(uuid,uuid) from public;
grant execute on function private.admin_get_route_geometry(uuid,uuid) to authenticated;

create or replace function public.admin_get_route_geometry(target_route_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select private.admin_get_route_geometry(target_route_id, auth.uid());
$$;

revoke all on function public.admin_get_route_geometry(uuid) from public;
grant execute on function public.admin_get_route_geometry(uuid) to authenticated;

create or replace function private.admin_route_editor_snapshot(target_route_id uuid, actor uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare geometry_payload jsonb;
declare checkpoint_payload jsonb;
declare discovery_payload jsonb;
begin
  geometry_payload := private.admin_get_route_geometry(target_route_id, actor);

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', c.id,
    'name', c.name,
    'lng', extensions.st_x(c.position),
    'lat', extensions.st_y(c.position),
    'radius_m', c.trigger_radius_m,
    'required', c.required,
    'active', c.active
  ) order by c.name), '[]'::jsonb)
  into checkpoint_payload
  from public.checkpoints c
  where c.route_id = target_route_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'id', d.id,
    'name', d.name,
    'category', d.category,
    'lng', extensions.st_x(d.position),
    'lat', extensions.st_y(d.position),
    'radius_m', d.trigger_radius_m,
    'reward_xp', d.reward_xp,
    'reward_olives', d.reward_olives,
    'active', d.active
  ) order by d.name), '[]'::jsonb)
  into discovery_payload
  from public.discoveries d
  where d.route_id = target_route_id;

  return geometry_payload || jsonb_build_object(
    'checkpoints', checkpoint_payload,
    'discoveries', discovery_payload
  );
end;
$$;

revoke all on function private.admin_route_editor_snapshot(uuid,uuid) from public;
grant execute on function private.admin_route_editor_snapshot(uuid,uuid) to authenticated;

create or replace function public.admin_route_editor_snapshot(target_route_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$
  select private.admin_route_editor_snapshot(target_route_id, auth.uid());
$$;

revoke all on function public.admin_route_editor_snapshot(uuid) from public;
grant execute on function public.admin_route_editor_snapshot(uuid) to authenticated;
