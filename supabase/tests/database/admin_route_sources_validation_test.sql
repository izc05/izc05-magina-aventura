begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

insert into auth.users(id,email)
values ('25000000-0000-0000-0000-000000000001'::uuid,'route-validation-manager@example.invalid')
on conflict(id) do nothing;
insert into public.user_admin_roles(user_id,role_id)
values ('25000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict(user_id,role_id) do nothing;
insert into public.municipalities(id,slug,name,active)
values ('25000000-0000-0000-0000-000000000010'::uuid,'validation-town','Validation Town',true)
on conflict(id) do nothing;
insert into public.routes(id,municipality_id,slug,title,status,route_code)
values ('25000000-0000-0000-0000-000000000020'::uuid,'25000000-0000-0000-0000-000000000010'::uuid,'validation-route','Validation Route','review','VAL-01');
insert into public.route_versions(route_id,version,description,distance_km,elevation_gain_m,duration_minutes,difficulty)
values ('25000000-0000-0000-0000-000000000020'::uuid,1,'Validation route content',4.5,180,100,'moderate');
insert into public.route_geometries(route_id,version,geometry,start_point)
values (
  '25000000-0000-0000-0000-000000000020'::uuid,1,
  extensions.st_geomfromtext('LINESTRING(-3.5 37.7,-3.49 37.71)',4326),
  extensions.st_geomfromtext('POINT(-3.5 37.7)',4326)
);
update public.routes set current_geometry_version=1 where id='25000000-0000-0000-0000-000000000020'::uuid;
insert into public.route_track_sources(route_id,geometry_version,format,source_kind,original_filename)
values ('25000000-0000-0000-0000-000000000020'::uuid,1,'gpx','official','validation.gpx');

select has_function(
  'public','admin_add_route_source',
  array['uuid','text','text','text','boolean','timestamp with time zone','text'],
  'admin_add_route_source exists'
);
select has_function(
  'public','admin_update_route_validation',
  array['uuid','text','text','text','text','text','text'],
  'admin_update_route_validation exists'
);
select ok(not (select prosecdef from pg_proc where oid='public.admin_add_route_source(uuid,text,text,text,boolean,timestamp with time zone,text)'::regprocedure),'source RPC is security invoker');
select ok(not (select prosecdef from pg_proc where oid='public.admin_update_route_validation(uuid,text,text,text,text,text,text)'::regprocedure),'validation RPC is security invoker');
select ok(not has_function_privilege('anon','public.admin_add_route_source(uuid,text,text,text,boolean,timestamp with time zone,text)','EXECUTE'),'anon cannot add route sources');
select ok(not has_function_privilege('anon','public.admin_update_route_validation(uuid,text,text,text,text,text,text)','EXECUTE'),'anon cannot update route validation');

set local role authenticated;
select set_config('request.jwt.claim.sub','25000000-0000-0000-0000-000000000001',true);

select ok(
  public.admin_add_route_source(
    '25000000-0000-0000-0000-000000000020'::uuid,
    'Ayuntamiento de prueba','https://example.invalid/oficial','official',true,now(),'Ficha oficial'
  ) is not null,
  'route manager can add a source'
);
select ok(
  exists(
    select 1 from public.route_sources
    where route_id='25000000-0000-0000-0000-000000000020'::uuid
      and label='Ayuntamiento de prueba'
      and official=true
      and created_by='25000000-0000-0000-0000-000000000001'::uuid
  ),
  'source persists with authenticated actor'
);

select lives_ok(
  $$ select public.admin_update_route_validation(
    '25000000-0000-0000-0000-000000000020'::uuid,
    'verified','verified','planned','partial','reviewed','Validación de prueba'
  ) $$,
  'route manager can save validation'
);
select is(
  (select track_status from public.route_validation_status where route_id='25000000-0000-0000-0000-000000000020'::uuid),
  'verified',
  'validation status persists'
);
select is(
  (select validated_by from public.route_track_sources where route_id='25000000-0000-0000-0000-000000000020'::uuid and geometry_version=1),
  '25000000-0000-0000-0000-000000000001'::uuid,
  'verified current track records validator'
);
select ok(
  (select validated_at is not null from public.route_track_sources where route_id='25000000-0000-0000-0000-000000000020'::uuid and geometry_version=1),
  'verified current track records validation time'
);

update public.routes set status='published' where id='25000000-0000-0000-0000-000000000020'::uuid;
select public.admin_update_route_validation(
  '25000000-0000-0000-0000-000000000020'::uuid,
  'reviewing','imported','planned','partial','pending','Revisión reabierta'
);
select is(
  (select status from public.routes where id='25000000-0000-0000-0000-000000000020'::uuid),
  'review',
  'degrading validation demotes a published route to review'
);

select * from finish();
rollback;
