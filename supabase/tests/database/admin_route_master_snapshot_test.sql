begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

insert into auth.users(id,email) values
  ('23000000-0000-0000-0000-000000000001'::uuid,'route-master-manager@example.invalid'),
  ('23000000-0000-0000-0000-000000000002'::uuid,'route-master-plain@example.invalid')
on conflict(id) do nothing;

insert into public.user_admin_roles(user_id,role_id)
values ('23000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict(user_id,role_id) do nothing;

insert into public.municipalities(id,slug,name,active)
values ('23000000-0000-0000-0000-000000000010'::uuid,'route-master-town','Route Master Town',true)
on conflict(id) do nothing;

insert into public.routes(id,municipality_id,slug,title,status,route_code)
values (
  '23000000-0000-0000-0000-000000000020'::uuid,
  '23000000-0000-0000-0000-000000000010'::uuid,
  'route-master-v2-test','Route Master V2 Test','review','TEST-V2'
);

insert into public.route_versions(
  route_id,version,description,distance_km,elevation_gain_m,duration_minutes,difficulty
) values (
  '23000000-0000-0000-0000-000000000020'::uuid,1,'Contenido V2 de prueba',5.2,180,120,'moderate'
);

insert into public.route_validation_status(route_id,editorial_status,track_status,field_status,media_status,safety_status)
values ('23000000-0000-0000-0000-000000000020'::uuid,'verified','missing','planned','partial','reviewed');

select has_function('private','route_v2_readiness',array['uuid'],'route_v2_readiness exists');
select has_function('public','admin_route_master_snapshot',array['uuid'],'admin_route_master_snapshot exists');

select is(
  (private.route_v2_readiness('23000000-0000-0000-0000-000000000020'::uuid)->>'ready')::boolean,
  false,
  'route without verified geometry is not ready'
);

select ok(
  private.route_v2_readiness('23000000-0000-0000-0000-000000000020'::uuid)->'reasons' @> '["Falta track verificado"]'::jsonb,
  'readiness explains missing verified track'
);

select ok(
  private.route_v2_readiness('23000000-0000-0000-0000-000000000020'::uuid)->'reasons' @> '["Falta fuente oficial"]'::jsonb,
  'readiness explains missing official source'
);

insert into public.route_safety_incidents(
  id,route_id,title,description,severity,status,created_by,blocks_adventure
) values (
  '23000000-0000-0000-0000-000000000030'::uuid,
  '23000000-0000-0000-0000-000000000020'::uuid,
  'Bloqueo V2','Incidencia de prueba','warning','open',
  '23000000-0000-0000-0000-000000000001'::uuid,true
);

select ok(
  private.route_v2_readiness('23000000-0000-0000-0000-000000000020'::uuid)->'reasons' @> '["Existe una incidencia bloqueante"]'::jsonb,
  'readiness explains blocking safety incident'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','23000000-0000-0000-0000-000000000001',true);
select is(
  public.admin_route_master_snapshot('23000000-0000-0000-0000-000000000020'::uuid)->'route'->>'title',
  'Route Master V2 Test',
  'route manager can read route master snapshot'
);

select set_config('request.jwt.claim.sub','23000000-0000-0000-0000-000000000002',true);
select throws_ok(
  $$ select public.admin_route_master_snapshot('23000000-0000-0000-0000-000000000020'::uuid) $$,
  'not authorized',
  'user without route role cannot read route master snapshot'
);

select * from finish();
rollback;
