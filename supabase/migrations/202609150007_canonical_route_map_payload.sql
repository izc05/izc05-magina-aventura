create or replace function public.get_published_route_map_payload(p_route_slug text)
returns jsonb
language sql
stable
security invoker
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'routeId', r.id,
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
    'start', jsonb_build_array(
      st_x(rg.start_point),
      st_y(rg.start_point)
    ),
    'bounds', jsonb_build_array(
      st_xmin(box3d(rg.geometry)),
      st_ymin(box3d(rg.geometry)),
      st_xmax(box3d(rg.geometry)),
      st_ymax(box3d(rg.geometry))
    ),
    'mapAsset', (
      select jsonb_build_object(
        'id', a.id,
        'objectKey', a.object_key,
        'remoteUrl', a.public_url,
        'styleTemplateUrl', a.style_template_url,
        'byteSize', a.byte_size,
        'md5', a.md5,
        'minZoom', a.min_zoom,
        'maxZoom', a.max_zoom,
        'bounds', jsonb_build_array(
          st_xmin(box3d(a.bounds)),
          st_ymin(box3d(a.bounds)),
          st_xmax(box3d(a.bounds)),
          st_ymax(box3d(a.bounds))
        )
      )
      from public.route_map_assets a
      where a.route_id = r.id
        and a.geometry_version = r.current_geometry_version
        and a.asset_kind = 'pmtiles'
      limit 1
    ),
    'checkpoints', coalesce((
      select jsonb_agg(
        jsonb_build_object(
          'id', c.id,
          'name', c.name,
          'position', jsonb_build_array(
            st_x(c.position),
            st_y(c.position)
          ),
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
