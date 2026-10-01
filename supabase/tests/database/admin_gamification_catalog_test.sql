begin;

create extension if not exists pgtap with schema extensions;
select plan(6);

select has_table('public','gamification_seasons','gamification_seasons exists');
select has_table('public','discovery_collections','discovery_collections exists');
select has_table('public','discovery_collection_items','discovery_collection_items exists');
select ok((select relrowsecurity from pg_class where oid='public.gamification_seasons'::regclass),'RLS seasons');
select ok((select relrowsecurity from pg_class where oid='public.discovery_collections'::regclass),'RLS collections');
select ok((select relrowsecurity from pg_class where oid='public.discovery_collection_items'::regclass),'RLS collection items');

select * from finish();
rollback;
