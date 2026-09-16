begin;

create extension if not exists pgtap with schema extensions;
select plan(12);

insert into auth.users(id,email)
values ('26000000-0000-0000-0000-000000000001'::uuid,'catalog-manager@example.invalid')
on conflict(id) do nothing;

insert into public.user_admin_roles(user_id,role_id)
values ('26000000-0000-0000-0000-000000000001'::uuid,'route_manager')
on conflict(user_id,role_id) do nothing;

create temp table catalog_test_manifest(payload jsonb) on commit drop;
insert into catalog_test_manifest(payload) values (
$json$
{
  "catalog":"test-catalog",
  "snapshot_version":"test-v1",
  "source_commit":"0123456789abcdef0123456789abcdef01234567",
  "manifest_sha256":"sha256:0000000000000000000000000000000000000000000000000000000000000000",
  "routes":[
    {
      "id":"test-1",
      "code":"TEST-01",
      "slug":"test-route-one",
      "name":"Test Route One",
      "primary_municipality":"bedmar-y-garciez",
      "municipalities":["bedmar-y-garciez"],
      "route_kind":"linear",
      "distance_km":1.25,
      "duration_minutes_min":30,
      "duration_minutes_max":30,
      "official_difficulty":"easy",
      "verification_state":"official_verified",
      "source_checked_at":"2026-09-16T00:00:00Z",
      "source_ids":["test-source"],
      "family_profile":{},
      "accessibility_facts":[],
      "stable_safety_facts":[],
      "editorial_facts":[]
    },
    {
      "id":"test-2",
      "code":"TEST-02",
      "slug":"test-route-two",
      "name":"Test Route Two",
      "primary_municipality":"pegalajar",
      "municipalities":["pegalajar","mancha-real"],
      "route_kind":"circular",
      "distance_km":2.5,
      "duration_minutes_min":60,
      "duration_minutes_max":60,
      "official_difficulty":"moderate",
      "verification_state":"official_verified",
      "source_checked_at":"2026-09-16T00:00:00Z",
      "source_ids":["test-source"],
      "family_profile":{},
      "accessibility_facts":[],
      "stable_safety_facts":[],
      "editorial_facts":[]
    }
  ],
  "sources":[
    {
      "id":"test-source",
      "publisher":"Test Authority",
      "title":"Test official source",
      "url":"https://example.invalid/source",
      "source_type":"official_authority",
      "verification_state":"official_verified",
      "checked_at":"2026-09-16T00:00:00Z",
      "published_at":null
    }
  ],
  "restrictions":[
    {
      "id":"test-closure",
      "route_id":"test-1",
      "type":"temporary_closure",
      "severity":"blocking",
      "status":"active",
      "starts_at":null,
      "ends_at":null,
      "published_at":"2026-09-15T00:00:00Z",
      "checked_at":"2026-09-16T00:00:00Z",
      "reason":"Test closure",
      "source_ids":["test-source"],
      "verification_state":"official_verified"
    }
  ],
  "pois":[],
  "track_leads":[]
}
$json$::jsonb
);

grant select on catalog_test_manifest to authenticated;

select has_function('public','admin_ingest_catalog_manifest',array['jsonb'],'public catalog ingest RPC exists');
select ok(not has_function_privilege('anon','public.admin_ingest_catalog_manifest(jsonb)','EXECUTE'),'anon cannot ingest catalog');

set local role authenticated;
select set_config('request.jwt.claim.sub','26000000-0000-0000-0000-000000000001',true);

select lives_ok(
  $$ select public.admin_ingest_catalog_manifest((select payload from catalog_test_manifest)) $$,
  'route manager can ingest manifest'
);
select lives_ok(
  $$ select public.admin_ingest_catalog_manifest((select payload from catalog_test_manifest)) $$,
  'same manifest can be re-imported'
);

reset role;

select is((select count(*) from public.routes where canonical_catalog_id like 'test-%')::integer,2,'creates two route identities once');
select is((select count(*) from public.route_catalog_profiles where canonical_catalog_id like 'test-%')::integer,2,'creates two profiles once');
select is((select count(*) from public.route_sources where external_source_id='test-source' and route_id in (select id from public.routes where canonical_catalog_id like 'test-%'))::integer,2,'one source row per route');
select is((select count(*) from public.route_municipalities rm join public.routes r on r.id=rm.route_id where r.canonical_catalog_id='test-2')::integer,2,'keeps multiple municipalities');
select is((select count(*) from public.route_catalog_restrictions where external_restriction_id='test-closure')::integer,1,'restriction is idempotent');
select is((select count(*) from public.route_versions rv join public.routes r on r.id=rv.route_id where r.canonical_catalog_id like 'test-%')::integer,0,'does not fabricate content versions');
select is((select count(*) from public.route_geometries rg join public.routes r on r.id=rg.route_id where r.canonical_catalog_id like 'test-%')::integer,0,'does not fabricate geometry');

update public.routes set status='review' where canonical_catalog_id='test-1';

set local role authenticated;
select set_config('request.jwt.claim.sub','26000000-0000-0000-0000-000000000001',true);
select public.admin_ingest_catalog_manifest((select payload from catalog_test_manifest));
reset role;

select is((select status from public.routes where canonical_catalog_id='test-1'),'review','re-import preserves manual route status');

select * from finish();
rollback;
