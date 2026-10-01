begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

insert into auth.users(id,email)
values
  ('10000000-0000-0000-0000-000000000001'::uuid,'cap-admin@example.invalid'),
  ('10000000-0000-0000-0000-000000000002'::uuid,'cap-super@example.invalid'),
  ('10000000-0000-0000-0000-000000000003'::uuid,'cap-route@example.invalid')
on conflict(id) do nothing;

insert into public.user_admin_roles(user_id,role_id)
values
  ('10000000-0000-0000-0000-000000000001'::uuid,'admin'),
  ('10000000-0000-0000-0000-000000000002'::uuid,'super_admin'),
  ('10000000-0000-0000-0000-000000000003'::uuid,'route_manager');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000001',true);
select ok(private.admin_has_capability('routes.manage','10000000-0000-0000-0000-000000000001'::uuid),'admin can manage routes');
select ok(private.admin_has_capability('settings.manage','10000000-0000-0000-0000-000000000001'::uuid),'admin can manage settings');
select ok(not private.admin_has_capability('admins.manage','10000000-0000-0000-0000-000000000001'::uuid),'admin cannot manage administrators');
select ok(not private.admin_has_capability('future.sensitive','10000000-0000-0000-0000-000000000001'::uuid),'admin does not inherit unknown future capabilities');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000002',true);
select ok(private.admin_has_capability('future.sensitive','10000000-0000-0000-0000-000000000002'::uuid),'super admin retains full control');

select set_config('request.jwt.claim.sub','10000000-0000-0000-0000-000000000003',true);
select ok(not private.admin_has_capability('rewards.manage','10000000-0000-0000-0000-000000000003'::uuid),'route manager cannot manage rewards');

select * from finish();
rollback;
