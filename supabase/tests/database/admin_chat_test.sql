begin;

create extension if not exists pgtap with schema extensions;
select plan(8);

select has_table('public','community_chat_channels','community_chat_channels exists');
select has_table('public','community_chat_messages','community_chat_messages exists');
select has_table('public','community_chat_reports','community_chat_reports exists');
select ok((select relrowsecurity from pg_class where oid='public.community_chat_channels'::regclass),'RLS channels');
select ok((select relrowsecurity from pg_class where oid='public.community_chat_messages'::regclass),'RLS messages');
select ok((select relrowsecurity from pg_class where oid='public.community_chat_reports'::regclass),'RLS reports');
select has_function('public','post_community_chat_message',array['uuid','text'],'chat post function exists');
select has_function('public','admin_moderate_chat_message',array['uuid','text','text'],'chat moderation function exists');

select * from finish();
rollback;
