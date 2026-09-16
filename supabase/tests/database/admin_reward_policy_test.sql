begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

select ok(exists(select 1 from public.app_settings where key='rewards.reservation_minutes'),'reservation duration setting exists');
select ok((select (value #>> '{}')::integer between 5 and 10080 from public.app_settings where key='rewards.reservation_minutes'),'reservation duration setting is within allowed range');
select has_function('public','reserve_reward',array['uuid'],'reserve_reward remains available');

select * from finish();
rollback;
