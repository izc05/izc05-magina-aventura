begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

select ok(has_table_privilege('anon','public.route_safety_incidents','SELECT'),'anon can query public route safety subject to RLS');
select ok(exists(select 1 from pg_policies where schemaname='public' and tablename='route_safety_incidents' and policyname='public read active safety for published routes'),'published active safety policy exists');
select ok(not exists(select 1 from pg_policies where schemaname='public' and tablename='route_safety_incidents' and policyname='authenticated read open safety'),'legacy broad authenticated safety policy removed');
select ok((select relrowsecurity from pg_class where oid='public.route_safety_incidents'::regclass),'route safety keeps RLS');

select * from finish();
rollback;
