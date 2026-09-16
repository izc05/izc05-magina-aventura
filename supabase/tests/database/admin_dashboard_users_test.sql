begin;

create extension if not exists pgtap with schema extensions;
select plan(2);

select has_function('public','admin_dashboard_metrics',array[]::text[],'admin_dashboard_metrics exists');
select has_function('public','admin_user_overview',array['uuid'],'admin_user_overview exists');

select * from finish();
rollback;
