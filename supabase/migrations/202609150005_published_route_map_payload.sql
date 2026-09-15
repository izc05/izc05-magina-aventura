create or replace function public.get_published_route_map_payload(p_route_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'slug', r.slug,
    'geometryVersion', r.current_geometry_version,
    'line', jsonb_build_object(
      'type', 'Feature',
      'geometry', st_asgeojson(rg.geometry)::jsonb,
      'properties', jsonb_build_object(
        'routeId', r.id,
        'geometryVersion', rg.version
      )
    ),
    'checkpoints', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'position', st_asgeojson(c.position)::jsonb,
          'triggerRadiusM', c.trigger_radius_m,
          'required', c.required
        )
        order by c.id
      )
      from public.checkpoints c
      where c.route_id = r.id
        and c.active = true
    ), '[]'::jsonb),
    'discoveryHints', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'category', d.category
        )
        order by d.id
      )
      from public.discoveries d
      where d.route_id = r.id
        and d.active = true
    ), '[]'::jsonb)
  )
  from public.routes r
  join public.route_geometries rg
    on rg.route_id = r.id
   and rg.version = r.current_geometry_version
  where r.slug = p_route_slug
    and r.status = 'published'
  limit 1;
$$;

grant execute on function public.get_published_route_map_payload(text)
  to anon, authenticated;
