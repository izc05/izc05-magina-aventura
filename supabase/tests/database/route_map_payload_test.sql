begin;

create extension if not exists pgtap with schema extensions;
select plan(9);

insert into public.municipalities (id, slug, name, active)
values (
  '10000000-0000-4000-8000-000000000001',
  'map-payload-test',
  'Map Payload Test',
  true
);

insert into public.routes (
  id,
  municipality_id,
  slug,
  title,
  status,
  current_content_version,
  current_geometry_version
) values
(
  '10000000-0000-4000-8000-000000000002',
  '10000000-0000-4000-8000-000000000001',
  'published-map-test',
  'Published Map Test',
  'published',
  1,
  1
),
(
  '10000000-0000-4000-8000-000000000003',
  '10000000-0000-4000-8000-000000000001',
  'draft-map-test',
  'Draft Map Test',
  'draft',
  1,
  1
);

insert into public.route_geometries (
  route_id,
  version,
  geometry,
  start_point
) values
(
  '10000000-0000-4000-8000-000000000002',
  1,
  extensions.st_geomfromtext('LINESTRING(-3.5000 37.7000,-3.4900 37.7100)', 4326),
  extensions.st_geomfromtext('POINT(-3.5000 37.7000)', 4326)
),
(
  '10000000-0000-4000-8000-000000000003',
  1,
  extensions.st_geomfromtext('LINESTRING(-3.6000 37.6000,-3.5900 37.6100)', 4326),
  extensions.st_geomfromtext('POINT(-3.6000 37.6000)', 4326)
);

insert into public.checkpoints (
  id,
  route_id,
  name,
  position,
  trigger_radius_m,
  required,
  active
) values
(
  '10000000-0000-4000-8000-000000000010',
  '10000000-0000-4000-8000-000000000002',
  'Active checkpoint',
  extensions.st_geomfromtext('POINT(-3.4950 37.7050)', 4326),
  30,
  true,
  true
),
(
  '10000000-0000-4000-8000-000000000011',
  '10000000-0000-4000-8000-000000000002',
  'Inactive checkpoint',
  extensions.st_geomfromtext('POINT(-3.4940 37.7060)', 4326),
  30,
  false,
  false
);

insert into public.discoveries (
  id,
  route_id,
  category,
  name,
  position,
  trigger_radius_m,
  reward_xp,
  reward_olives,
  active
) values
(
  '10000000-0000-4000-8000-000000000020',
  '10000000-0000-4000-8000-000000000002',
  'heritage',
  'Active discovery',
  extensions.st_geomfromtext('POINT(-3.4930 37.7070)', 4326),
  25,
  50,
  5,
  true
),
(
  '10000000-0000-4000-8000-000000000021',
  '10000000-0000-4000-8000-000000000002',
  'flora',
  'Inactive discovery',
  extensions.st_geomfromtext('POINT(-3.4920 37.7080)', 4326),
  25,
  50,
  5,
  false
);

select has_function(
  'public',
  'get_published_route_map_payload',
  array['text'],
  'published map payload RPC exists'
);

select isnt(
  public.get_published_route_map_payload('published-map-test'),
  null::jsonb,
  'published route returns a payload'
);

select is(
  public.get_published_route_map_payload('published-map-test')->>'slug',
  'published-map-test',
  'payload preserves route slug'
);

select is(
  (public.get_published_route_map_payload('published-map-test')->>'geometryVersion')::integer,
  1,
  'payload uses current geometry version'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'line'->'geometry'->>'type',
  'LineString',
  'payload exposes a GeoJSON LineString'
);

select is(
  jsonb_array_length(public.get_published_route_map_payload('published-map-test')->'checkpoints'),
  1,
  'payload includes active checkpoints only'
);

select is(
  jsonb_array_length(public.get_published_route_map_payload('published-map-test')->'discoveryHints'),
  1,
  'payload includes active discovery hints only'
);

select is(
  public.get_published_route_map_payload('draft-map-test'),
  null::jsonb,
  'draft route is not exposed'
);

select is(
  public.get_published_route_map_payload('missing-map-test'),
  null::jsonb,
  'missing route returns null'
);

select * from finish();
rollback;
