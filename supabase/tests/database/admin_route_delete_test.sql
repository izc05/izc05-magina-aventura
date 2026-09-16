begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

select has_function(
  'public','admin_delete_route',array['uuid'],
  'admin_delete_route exists'
);

insert into auth.users(id,email)
values
  ('73000000-0000-0000-0000-000000000001'::uuid,'route-delete-super@example.invalid'),
  ('73000000-0000-0000-0000-000000000002'::uuid,'route-delete-admin@example.invalid')
on conflict(id) do nothing;

insert into public.user_admin_roles(user_id,role_id)
values
  ('73000000-0000-0000-0000-000000000001'::uuid,'super_admin'),
  ('73000000-0000-0000-0000-000000000002'::uuid,'admin');

insert into public.municipalities(id,slug,name,active)
values ('73000000-0000-0000-0000-000000000010'::uuid,'route-delete-test','Route delete test',true);

insert into public.routes(id,municipality_id,slug,title,status)
values
  ('73000000-0000-0000-0000-000000000011'::uuid,'73000000-0000-0000-0000-000000000010','route-delete-draft','Draft delete','draft'),
  ('73000000-0000-0000-0000-000000000012'::uuid,'73000000-0000-0000-0000-000000000010','route-delete-published','Published delete','published'),
  ('73000000-0000-0000-0000-000000000013'::uuid,'73000000-0000-0000-0000-000000000010','route-delete-archived','Archived delete','archived');

insert into public.route_versions(route_id,version,description,distance_km,elevation_gain_m,duration_minutes,difficulty)
values ('73000000-0000-0000-0000-000000000013',1,'Delete cascade',1,10,20,'easy');

select set_config('request.jwt.claim.sub','73000000-0000-0000-0000-000000000001',true);
select throws_ok(
  $$ select public.admin_delete_route('73000000-0000-0000-0000-000000000012'::uuid) $$,
  'P0001','published route must be archived before deletion',
  'published routes cannot be deleted directly'
);
select lives_ok(
  $$ select public.admin_delete_route('73000000-0000-0000-0000-000000000013'::uuid) $$,
  'super admin can delete an archived route'
);
select is(
  (select count(*) from public.routes where id='73000000-0000-0000-0000-000000000013'::uuid),
  0::bigint,
  'route row is deleted'
);
select is(
  (select count(*) from public.route_versions where route_id='73000000-0000-0000-0000-000000000013'::uuid),
  0::bigint,
  'route children are deleted by cascade'
);

select set_config('request.jwt.claim.sub','73000000-0000-0000-0000-000000000002',true);
select throws_ok(
  $$ select public.admin_delete_route('73000000-0000-0000-0000-000000000011'::uuid) $$,
  'P0001','not authorized',
  'regular admin cannot permanently delete routes'
);

select * from finish();
rollback;
