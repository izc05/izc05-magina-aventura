begin;

create extension if not exists pgtap with schema extensions;
select plan(24);

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

insert into public.route_map_assets (
  id,
  route_id,
  geometry_version,
  asset_kind,
  object_key,
  public_url,
  byte_size,
  md5,
  min_zoom,
  max_zoom,
  bounds,
  style_template_url
) values (
  '10000000-0000-4000-8000-000000000030',
  '10000000-0000-4000-8000-000000000002',
  1,
  'pmtiles',
  'routes/published-map-test/v1/map.pmtiles',
  'https://cdn.example.test/routes/published-map-test/v1/map.pmtiles',
  1024,
  '0123456789abcdef0123456789abcdef',
  10,
  16,
  extensions.st_geomfromtext(
    'POLYGON((-3.5000 37.7000,-3.4900 37.7000,-3.4900 37.7100,-3.5000 37.7100,-3.5000 37.7000))',
    4326
  ),
  'https://cdn.example.test/styles/magina-v1.json'
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

set local role anon;

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
  public.get_published_route_map_payload('published-map-test')->>'routeId',
  '10000000-0000-4000-8000-000000000002',
  'payload exposes root route id'
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
  public.get_published_route_map_payload('published-map-test')->'checkpoints'->0->'position',
  '[-3.495, 37.705]'::jsonb,
  'checkpoint position uses longitude latitude tuple'
);

select is(
  jsonb_array_length(public.get_published_route_map_payload('published-map-test')->'discoveryHints'),
  1,
  'payload includes active discovery hints only'
);

select ok(
  not (public.get_published_route_map_payload('published-map-test')->'discoveryHints'->0 ? 'position'),
  'public discovery hint does not expose exact position'
);

select ok(
  not (public.get_published_route_map_payload('published-map-test')->'discoveryHints'->0 ? 'triggerRadiusM'),
  'public discovery hint does not expose trigger radius'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'start',
  '[-3.5, 37.7]'::jsonb,
  'payload start uses longitude latitude tuple'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'bounds',
  '[-3.5, 37.7, -3.49, 37.71]'::jsonb,
  'payload exposes route camera bounds'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'id',
  '10000000-0000-4000-8000-000000000030',
  'payload exposes current map asset id'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'objectKey',
  'routes/published-map-test/v1/map.pmtiles',
  'payload exposes immutable object key'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'remoteUrl',
  'https://cdn.example.test/routes/published-map-test/v1/map.pmtiles',
  'payload exposes PMTiles remote URL'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'styleTemplateUrl',
  'https://cdn.example.test/styles/magina-v1.json',
  'payload exposes style template URL'
);

select is(
  (public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'byteSize')::bigint,
  1024::bigint,
  'payload exposes PMTiles byte size'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'md5',
  '0123456789abcdef0123456789abcdef',
  'payload exposes PMTiles checksum'
);

select is(
  (public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'minZoom')::integer,
  10,
  'payload exposes minimum zoom'
);

select is(
  (public.get_published_route_map_payload('published-map-test')->'mapAsset'->>'maxZoom')::integer,
  16,
  'payload exposes maximum zoom'
);

select is(
  public.get_published_route_map_payload('published-map-test')->'mapAsset'->'bounds',
  '[-3.5, 37.7, -3.49, 37.71]'::jsonb,
  'payload exposes map asset bounds'
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

reset role;
select * from finish();
rollback;
