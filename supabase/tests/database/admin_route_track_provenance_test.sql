begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users(id,email)
values ('24000000-0000-0000-0000-000000000001'::uuid,'track-manager@example.invalid')
on conflict(id) do nothing;
insert into public.user_admin_roles(user_id,role_id)
values ('24000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict(user_id,role_id) do nothing;
insert into public.municipalities(id,slug,name,active)
values ('24000000-0000-0000-0000-000000000010'::uuid,'track-town','Track Town',true)
on conflict(id) do nothing;
insert into public.routes(id,municipality_id,slug,title,status,route_code)
values ('24000000-0000-0000-0000-000000000020'::uuid,'24000000-0000-0000-0000-000000000010'::uuid,'track-route','Track Route','review','TRACK-01');
insert into public.route_versions(route_id,version,description,distance_km,elevation_gain_m,duration_minutes,difficulty)
values ('24000000-0000-0000-0000-000000000020'::uuid,1,'Track route content',2.5,100,60,'easy');

select has_function(
  'public','admin_import_route_track',
  array['uuid','text','text','text','text','text','text','uuid','text'],
  'admin_import_route_track exists'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','24000000-0000-0000-0000-000000000001',true);

select is(
  public.admin_import_route_track(
    '24000000-0000-0000-0000-000000000020'::uuid,
    'SRID=4326;LINESTRING(-3.5 37.7,-3.49 37.71,-3.48 37.72)',
    'kml','official','https://example.invalid/track.kml','track.kml','abc123',null,'KML oficial de prueba'
  ),
  1,
  'first track import creates geometry version 1'
);

select ok(
  exists(select 1 from public.route_geometries where route_id='24000000-0000-0000-0000-000000000020'::uuid and version=1),
  'track import persists geometry'
);

select ok(
  exists(select 1 from public.route_track_sources where route_id='24000000-0000-0000-0000-000000000020'::uuid and geometry_version=1 and format='kml' and source_kind='official' and source_hash='abc123'),
  'track import persists provenance'
);

select is(
  (select track_status from public.route_validation_status where route_id='24000000-0000-0000-0000-000000000020'::uuid),
  'imported',
  'track import updates validation status'
);

select throws_ok(
  $$ select public.admin_import_route_track('24000000-0000-0000-0000-000000000020'::uuid,'SRID=4326;LINESTRING(-3.5 37.7,-3.49 37.71)','exe','official',null,null,null,null,'') $$,
  'invalid track format',
  'unsupported track format is rejected'
);

select * from finish();
rollback;
