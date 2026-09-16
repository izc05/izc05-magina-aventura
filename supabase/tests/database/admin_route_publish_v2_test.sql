begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

insert into auth.users(id,email)
values ('20000000-0000-0000-0000-000000000001'::uuid,'publish-v2@example.invalid')
on conflict(id) do nothing;

insert into public.user_admin_roles(user_id,role_id)
values ('20000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict do nothing;

select set_config('request.jwt.claim.sub','20000000-0000-0000-0000-000000000001',true);

insert into public.municipalities(id,slug,name,active)
values ('21000000-0000-0000-0000-000000000001'::uuid,'publish-v2-town','Publish V2 Town',true)
on conflict(id) do nothing;

insert into public.routes(
  id,municipality_id,slug,title,status,current_content_version,current_geometry_version,route_code
) values (
  '22000000-0000-0000-0000-000000000001'::uuid,
  '21000000-0000-0000-0000-000000000001'::uuid,
  'publish-v2-incomplete',
  'Publish V2 incomplete',
  'review',1,1,'TEST-PUB-V2-1'
),(
  '22000000-0000-0000-0000-000000000002'::uuid,
  '21000000-0000-0000-0000-000000000001'::uuid,
  'publish-v2-ready',
  'Publish V2 ready',
  'review',1,1,'TEST-PUB-V2-2'
);

insert into public.route_versions(
  route_id,version,description,safety_notes,distance_km,elevation_gain_m,elevation_loss_m,
  duration_minutes,difficulty,reward_xp,reward_olives,discovery_count,offline_available
) values
(
  '22000000-0000-0000-0000-000000000001'::uuid,1,'Incomplete route','[]'::jsonb,5,150,150,90,'moderate',0,0,0,false
),
(
  '22000000-0000-0000-0000-000000000002'::uuid,1,'Ready route','[]'::jsonb,5,150,150,90,'moderate',0,0,0,false
);

insert into public.route_geometries(route_id,version,geometry,start_point)
values
(
  '22000000-0000-0000-0000-000000000001'::uuid,1,
  extensions.st_geomfromewkt('SRID=4326;LINESTRING(-3.50 37.70,-3.49 37.71)'),
  extensions.st_geomfromewkt('SRID=4326;POINT(-3.50 37.70)')
),
(
  '22000000-0000-0000-0000-000000000002'::uuid,1,
  extensions.st_geomfromewkt('SRID=4326;LINESTRING(-3.48 37.72,-3.47 37.73)'),
  extensions.st_geomfromewkt('SRID=4326;POINT(-3.48 37.72)')
);

select has_function(
  'public','admin_set_route_status',array['uuid','text'],
  'admin route status RPC exists'
);

select throws_ok(
  $$select public.admin_set_route_status('22000000-0000-0000-0000-000000000001'::uuid,'published')$$,
  'P0001',
  'route not ready for publication: Falta fuente oficial; Falta track verificado; Falta validación editorial; Falta revisión de seguridad',
  'publication is blocked until route V2 readiness is complete'
);

select is(
  (select status from public.routes where id='22000000-0000-0000-0000-000000000001'::uuid),
  'review',
  'blocked publication keeps route in review'
);

insert into public.route_sources(
  id,route_id,label,url,source_type,official,checked_at,created_by
) values (
  '23000000-0000-0000-0000-000000000001'::uuid,
  '22000000-0000-0000-0000-000000000002'::uuid,
  'Official source','https://example.invalid/official','official',true,now(),
  '20000000-0000-0000-0000-000000000001'::uuid
);

insert into public.route_track_sources(
  route_id,geometry_version,source_id,source_url,format,source_kind,original_filename,
  source_hash,validated_at,validated_by,notes
) values (
  '22000000-0000-0000-0000-000000000002'::uuid,1,
  '23000000-0000-0000-0000-000000000001'::uuid,
  'https://example.invalid/ready.gpx','gpx','official','ready.gpx','sha256:test',now(),
  '20000000-0000-0000-0000-000000000001'::uuid,''
);

insert into public.route_validation_status(
  route_id,editorial_status,track_status,field_status,media_status,safety_status,
  verified_by,verified_at,notes
) values (
  '22000000-0000-0000-0000-000000000002'::uuid,
  'verified','verified','not_checked','missing','reviewed',
  '20000000-0000-0000-0000-000000000001'::uuid,now(),''
);

select lives_ok(
  $$select public.admin_set_route_status('22000000-0000-0000-0000-000000000002'::uuid,'published')$$,
  'ready V2 route can be published'
);

select * from finish();
rollback;
