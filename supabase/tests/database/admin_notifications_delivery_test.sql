begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public','push_device_subscriptions','push_device_subscriptions exists');
select has_table('public','notification_topic_subscriptions','notification_topic_subscriptions exists');
select has_table('public','notification_deliveries','notification_deliveries exists');
select ok((select relrowsecurity from pg_class where oid='public.push_device_subscriptions'::regclass),'RLS push devices');
select ok((select relrowsecurity from pg_class where oid='public.notification_topic_subscriptions'::regclass),'RLS notification topics');
select ok((select relrowsecurity from pg_class where oid='public.notification_deliveries'::regclass),'RLS notification deliveries');
select has_function('public','register_push_device',array['text','text','text'],'register_push_device exists');
select has_function('public','set_notification_topic',array['text','uuid','boolean'],'set_notification_topic exists');

select * from finish();
rollback;
