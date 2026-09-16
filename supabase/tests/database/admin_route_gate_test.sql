begin;

create extension if not exists pgtap with schema extensions;
select plan(4);

select has_column('public','route_safety_incidents','blocks_adventure','route safety supports temporary adventure blocking');
select has_function('public','route_adventure_gate',array['uuid'],'route adventure gate exists');
select ok(has_function_privilege('anon','public.route_adventure_gate(uuid)','EXECUTE'),'anon can evaluate the public route adventure gate');
select is((public.route_adventure_gate('ffffffff-ffff-ffff-ffff-ffffffffffff'::uuid)->>'can_start')::boolean,false,'unknown route cannot start an adventure');

select * from finish();
rollback;
