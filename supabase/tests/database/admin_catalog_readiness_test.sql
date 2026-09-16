begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users(id,email)
values ('27000000-0000-0000-0000-000000000001'::uuid,'catalog-readiness@example.invalid')
on conflict(id) do nothing;
insert into public.user_admin_roles(user_id,role_id)
values ('27000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict(user_id,role_id) do nothing;

insert into public.routes(
  id,municipality_id,slug,title,status,route_code,canonical_catalog_id,catalog_origin
)
select
  '27000000-0000-0000-0000-000000000010'::uuid,
  m.id,
  'catalog-readiness-route',
  'Catalog Readiness Route',
  'draft',
  'CAT-READ-01',
  'catalog-readiness-1',
  'test-catalog'
from public.municipalities m
where m.slug='pegalajar';

insert into public.route_validation_status(route_id)
values ('27000000-0000-0000-0000-000000000010'::uuid)
on conflict(route_id) do nothing;

insert into public.route_catalog_profiles(
  route_id,canonical_catalog_id,source_snapshot_version,source_snapshot_commit,
  verification_state,route_kind,distance_km,duration_minutes_min,duration_minutes_max,
  official_difficulty,family_profile,accessibility_facts,stable_safety_facts,
  editorial_facts,source_checked_at
) values (
  '27000000-0000-0000-0000-000000000010'::uuid,
  'catalog-readiness-1','test-v1','abcdefabcdefabcdefabcdefabcdefabcdefabcd',
  'official_verified','linear',3.156,90,90,'moderate','{}'::jsonb,'[]'::jsonb,
  '[]'::jsonb,'[]'::jsonb,'2026-09-16T00:00:00Z'
);

insert into public.route_municipalities(route_id,municipality_id,is_primary,source_kind)
select '27000000-0000-0000-0000-000000000010'::uuid,m.id,m.slug='pegalajar','catalog'
from public.municipalities m
where m.slug in ('mancha-real','pegalajar','torres');

insert into public.route_catalog_restrictions(
  route_id,external_restriction_id,restriction_type,severity,status,checked_at,
  reason,source_external_ids,verification_state
) values (
  '27000000-0000-0000-0000-000000000010'::uuid,
  'catalog-readiness-block','temporary_closure','blocking','active',now(),
  'Official blocking test restriction',array['source-test'],'official_verified'
);

insert into public.catalog_import_runs(
  catalog_name,snapshot_version,source_commit,manifest_sha256,completed_at,status,
  route_count,source_count,restriction_count,poi_count
) values (
  'test-catalog','test-v1','abcdefabcdefabcdefabcdefabcdefabcdefabcd',
  'sha256:1111111111111111111111111111111111111111111111111111111111111111',
  now(),'completed',1,1,1,0
);

select is((private.route_v2_readiness('27000000-0000-0000-0000-000000000010'::uuid)->>'ready')::boolean,false,'canonical blocker keeps readiness false');
select is((private.route_v2_readiness('27000000-0000-0000-0000-000000000010'::uuid)->>'blocking_incidents')::integer,1,'canonical blocker counts in readiness');
select ok(private.route_v2_readiness('27000000-0000-0000-0000-000000000010'::uuid)->'reasons' ? 'Existe una restricción oficial bloqueante','readiness explains official blocker');

update public.routes set status='published' where id='27000000-0000-0000-0000-000000000010'::uuid;
select is((public.route_adventure_gate('27000000-0000-0000-0000-000000000010'::uuid)->>'can_start')::boolean,false,'canonical blocker prevents starting an already published route');

set local role authenticated;
select set_config('request.jwt.claim.sub','27000000-0000-0000-0000-000000000001',true);
create temp table snapshot_result(payload jsonb) on commit drop;
insert into snapshot_result(payload)
select public.admin_route_master_snapshot('27000000-0000-0000-0000-000000000010'::uuid);

select ok((select payload ? 'catalog_profile' from snapshot_result),'snapshot includes catalog profile');
select is((select jsonb_array_length(payload->'municipalities') from snapshot_result),3,'snapshot returns three municipalities');
select is((select payload->'municipalities'->0->>'slug' from snapshot_result),'pegalajar','primary municipality sorts first');
select ok((select payload->'route' ? 'municipality' from snapshot_result),'legacy route municipality remains present');
select is((select jsonb_array_length(payload->'catalog_restrictions') from snapshot_result),1,'snapshot includes canonical restrictions');
select ok((select payload->'catalog_import' is not null from snapshot_result),'snapshot includes matching import metadata');

select * from finish();
rollback;
