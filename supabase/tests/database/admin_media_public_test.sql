begin;

create extension if not exists pgtap with schema extensions;
select plan(7);

select ok(has_table_privilege('anon','public.media_assets','SELECT'),'anon can query route media metadata subject to RLS');
select ok(has_table_privilege('anon','public.route_media','SELECT'),'anon can query published route media links subject to RLS');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_media' and policyname='public read media links for published routes'),'published route media-link policy exists');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='media_assets' and policyname='public read assets used by published routes'),'published media metadata policy exists');
select ok(exists(select 1 from pg_policies where schemaname='storage' and tablename='objects' and policyname='public download media used by published routes'),'published storage object policy exists');
select ok((select relrowsecurity from pg_class where oid='public.media_assets'::regclass),'media assets keep RLS');
select is((select public from storage.buckets where id='media'),false,'media bucket stays private');

select * from finish();
rollback;
