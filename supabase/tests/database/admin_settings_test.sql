begin;

create extension if not exists pgtap with schema extensions;
select plan(3);

select has_table('public', 'app_settings', 'app_settings exists');
select ok((select relrowsecurity from pg_class where oid='public.app_settings'::regclass), 'RLS enabled on app_settings');
select has_function('public','admin_set_app_setting',array['text','jsonb','text','boolean'],'admin_set_app_setting exists');

select * from finish();
rollback;
