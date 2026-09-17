begin;

create extension if not exists pgtap with schema extensions;
select plan(35);

select has_column('public','routes','canonical_catalog_id','routes.canonical_catalog_id exists');
select has_column('public','routes','catalog_origin','routes.catalog_origin exists');
select col_is_unique('public','routes','canonical_catalog_id','canonical catalog id is unique');
select has_column('public','route_sources','external_source_id','route_sources.external_source_id exists');
select has_column('public','route_sources','verification_state','route_sources.verification_state exists');

select has_table('public','route_catalog_profiles','route_catalog_profiles exists');
select has_table('public','route_municipalities','route_municipalities exists');
select has_table('public','route_catalog_restrictions','route_catalog_restrictions exists');
select has_table('public','route_catalog_pois','route_catalog_pois exists');
select has_table('public','route_catalog_track_leads','route_catalog_track_leads exists');
select has_table('public','catalog_import_runs','catalog_import_runs exists');

select col_is_pk('public','route_catalog_profiles','route_id','route_catalog_profiles keyed by route');
select col_is_pk('public','route_municipalities',array['route_id','municipality_id'],'route_municipalities composite key');
select col_is_unique('public','route_catalog_restrictions',array['route_id','external_restriction_id'],'catalog restriction identity is unique per route');
select col_is_unique('public','route_catalog_pois',array['route_id','external_poi_id'],'catalog poi identity is unique per route');

select has_index('public','route_municipalities','route_municipalities_one_primary_uidx','one primary municipality index exists');
select has_index('public','route_sources','route_sources_external_source_uidx','route source external id index exists');
select has_index('public','route_catalog_restrictions','route_catalog_restrictions_route_idx','catalog restrictions route index exists');
select has_index('public','route_catalog_pois','route_catalog_pois_route_idx','catalog pois route index exists');
select has_index('public','route_catalog_track_leads','route_catalog_track_leads_route_idx','catalog track leads route index exists');

select ok((select relrowsecurity from pg_class where oid='public.route_catalog_profiles'::regclass),'route_catalog_profiles has RLS');
select ok((select relrowsecurity from pg_class where oid='public.route_municipalities'::regclass),'route_municipalities has RLS');
select ok((select relrowsecurity from pg_class where oid='public.route_catalog_restrictions'::regclass),'route_catalog_restrictions has RLS');
select ok((select relrowsecurity from pg_class where oid='public.route_catalog_pois'::regclass),'route_catalog_pois has RLS');
select ok((select relrowsecurity from pg_class where oid='public.route_catalog_track_leads'::regclass),'route_catalog_track_leads has RLS');
select ok((select relrowsecurity from pg_class where oid='public.catalog_import_runs'::regclass),'catalog_import_runs has RLS');

select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_catalog_profiles' and policyname='route managers read catalog profiles'),'catalog profiles read policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_municipalities' and policyname='route managers read route municipalities'),'route municipalities read policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_catalog_restrictions' and policyname='route managers read catalog restrictions'),'catalog restrictions read policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_catalog_pois' and policyname='route managers read catalog pois'),'catalog pois read policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_catalog_track_leads' and policyname='route managers read catalog track leads'),'catalog track leads read policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='catalog_import_runs' and policyname='route managers read catalog imports'),'catalog imports read policy exists');

select has_column('public','route_catalog_profiles','family_profile','catalog profile family json exists');
select has_column('public','route_catalog_profiles','accessibility_facts','catalog profile accessibility facts exist');
select has_column('public','route_catalog_profiles','stable_safety_facts','catalog profile safety facts exist');

select * from finish();
rollback;
