begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

select is((select count(*) from public.routes where catalog_origin='junta_sierra_magina')::integer,17,'seeds 17 Sierra Magina route identities');
select is((select count(*) from public.route_catalog_profiles p join public.routes r on r.id=p.route_id where r.catalog_origin='junta_sierra_magina')::integer,17,'seeds 17 canonical profiles');
select is((select count(*) from public.route_sources s join public.routes r on r.id=s.route_id where r.catalog_origin='junta_sierra_magina' and s.external_source_id is not null)::integer,35,'seeds 35 route-scoped source links');
select is((select count(*) from public.route_catalog_restrictions c join public.routes r on r.id=c.route_id where r.catalog_origin='junta_sierra_magina')::integer,2,'seeds two official restrictions');
select is((select count(*) from public.route_catalog_restrictions c join public.routes r on r.id=c.route_id where r.catalog_origin='junta_sierra_magina' and c.status='active' and c.severity='blocking')::integer,2,'both seeded restrictions are active blockers');
select is((select count(*) from public.route_versions rv join public.routes r on r.id=rv.route_id where r.catalog_origin='junta_sierra_magina')::integer,0,'does not seed fake content versions');
select is((select count(*) from public.route_geometries rg join public.routes r on r.id=rg.route_id where r.catalog_origin='junta_sierra_magina')::integer,0,'does not seed fake geometry');
select is((select count(*) from public.route_municipalities rm join public.routes r on r.id=rm.route_id where r.canonical_catalog_id='ma-junta-017')::integer,3,'Veredon stores three municipalities');
select is((select count(*) from public.routes where catalog_origin='junta_sierra_magina' and status='draft')::integer,17,'all seeded routes start as draft');

select private.apply_catalog_manifest(private.sierra_magina_official_catalog_v1_manifest(),null);

select is((select count(*) from public.routes where catalog_origin='junta_sierra_magina')::integer,17,'reapplying the seed manifest stays idempotent');

select * from finish();
rollback;
