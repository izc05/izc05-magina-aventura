begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users(id,email)
values ('29000000-0000-0000-0000-000000000001'::uuid,'route-content-v2-manager@example.invalid')
on conflict(id) do nothing;
insert into public.user_admin_roles(user_id,role_id)
values ('29000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict(user_id,role_id) do nothing;
insert into public.municipalities(id,slug,name,active)
values ('29000000-0000-0000-0000-000000000010'::uuid,'content-v2-town','Content V2 Town',true)
on conflict(id) do nothing;
insert into public.routes(id,municipality_id,slug,title,status,route_code)
values ('29000000-0000-0000-0000-000000000020'::uuid,'29000000-0000-0000-0000-000000000010'::uuid,'content-v2-route','Content V2 Route','published','V2-01');
insert into public.route_versions(route_id,version,description,distance_km,elevation_gain_m,duration_minutes,difficulty,reward_xp,reward_olives,offline_available)
values ('29000000-0000-0000-0000-000000000020'::uuid,1,'Initial content',4.5,180,100,'moderate',100,10,false);

select has_function(
  'public','admin_update_route_content_v2',
  array['uuid','jsonb'],
  'admin_update_route_content_v2 exists'
);
select ok(
  not (select prosecdef from pg_proc where oid='public.admin_update_route_content_v2(uuid,jsonb)'::regprocedure),
  'route content v2 RPC is security invoker'
);
select ok(
  not has_function_privilege('anon','public.admin_update_route_content_v2(uuid,jsonb)','EXECUTE'),
  'anon cannot update route content v2'
);

set local role authenticated;
select set_config('request.jwt.claim.sub','29000000-0000-0000-0000-000000000001',true);

select is(
  public.admin_update_route_content_v2(
    '29000000-0000-0000-0000-000000000020'::uuid,
    jsonb_build_object(
      'description','Updated V2 content',
      'safety_notes',jsonb_build_array('Llevar agua','Evitar horas centrales'),
      'distance_km',8.7,
      'elevation_gain_m',430,
      'elevation_loss_m',430,
      'elevation_min_m',560,
      'elevation_max_m',920,
      'duration_minutes',180,
      'difficulty','moderate',
      'reward_xp',500,
      'reward_olives',50,
      'offline_available',true,
      'route_kind','circular',
      'access_notes','Acceso por Cuadros',
      'parking_notes','Aparcamiento en el área recreativa',
      'water_notes','Agua no garantizada',
      'shade_notes','Sombra parcial',
      'coverage_notes','Cobertura irregular',
      'recommended_seasons',jsonb_build_array('autumn','winter','spring'),
      'editorial_sections',jsonb_build_object(
        'heritage','Torreón y santuario',
        'flora','Adelfal y vegetación de ribera',
        'fauna','Fauna mediterránea',
        'olive_grove','Olivar tradicional',
        'landscape','Valle del río Cuadros',
        'tradition','Usos tradicionales del entorno'
      )
    )
  ),
  2,
  'route manager creates a new V2 content version'
);

select is(
  (select current_content_version from public.routes where id='29000000-0000-0000-0000-000000000020'::uuid),
  2,
  'route points to the new content version'
);
select is(
  (select status from public.routes where id='29000000-0000-0000-0000-000000000020'::uuid),
  'review',
  'editing published content demotes route to review'
);
select is(
  (select route_kind from public.route_versions where route_id='29000000-0000-0000-0000-000000000020'::uuid and version=2),
  'circular',
  'V2 route kind persists'
);
select is(
  (select elevation_loss_m from public.route_versions where route_id='29000000-0000-0000-0000-000000000020'::uuid and version=2),
  430,
  'V2 elevation loss persists'
);
select is(
  (select access_notes from public.route_versions where route_id='29000000-0000-0000-0000-000000000020'::uuid and version=2),
  'Acceso por Cuadros',
  'V2 access notes persist'
);
select is(
  (select editorial_sections->>'heritage' from public.route_versions where route_id='29000000-0000-0000-0000-000000000020'::uuid and version=2),
  'Torreón y santuario',
  'V2 editorial sections persist'
);

select * from finish();
rollback;
