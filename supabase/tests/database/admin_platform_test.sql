begin;

create extension if not exists pgtap with schema extensions;
select plan(29);

select has_table('public', 'admin_roles', 'admin_roles exists');
select has_table('public', 'user_admin_roles', 'user_admin_roles exists');
select has_table('public', 'admin_audit_log', 'admin_audit_log exists');
select has_table('public', 'media_assets', 'media_assets exists');
select has_table('public', 'moderation_reports', 'moderation_reports exists');
select has_table('public', 'olive_transactions', 'olive_transactions exists');
select has_table('public', 'reward_partners', 'reward_partners exists');
select has_table('public', 'rewards', 'rewards exists');
select has_table('public', 'reward_redemptions', 'reward_redemptions exists');
select has_table('public', 'admin_notifications', 'admin_notifications exists');
select has_table('public', 'route_safety_incidents', 'route_safety_incidents exists');
select has_table('public', 'user_moderation_states', 'user_moderation_states exists');

select ok((select relrowsecurity from pg_class where oid = 'public.admin_roles'::regclass), 'RLS admin_roles');
select ok((select relrowsecurity from pg_class where oid = 'public.user_admin_roles'::regclass), 'RLS user_admin_roles');
select ok((select relrowsecurity from pg_class where oid = 'public.media_assets'::regclass), 'RLS media_assets');
select ok((select relrowsecurity from pg_class where oid = 'public.olive_transactions'::regclass), 'RLS olive_transactions');
select ok((select relrowsecurity from pg_class where oid = 'public.reward_redemptions'::regclass), 'RLS reward_redemptions');
select has_function('public', 'admin_has_capability', array['text'], 'admin_has_capability exists');
select has_function('public', 'redeem_reward_token', array['text'], 'redeem_reward_token exists');
select has_function('public', 'admin_set_route_status', array['uuid','text'], 'admin_set_route_status exists');
select has_function('public', 'admin_save_route_geometry', array['uuid','text'], 'admin_save_route_geometry exists');
select has_function('public', 'cancel_reward_redemption', array['uuid'], 'cancel_reward_redemption exists');
select has_function('public', 'expire_reward_redemptions', array[]::text[], 'expire_reward_redemptions exists');
select has_function('public', 'admin_resolve_report', array['uuid','text','text'], 'admin_resolve_report exists');
select has_function('public', 'admin_publish_notification', array['uuid'], 'admin_publish_notification exists');
select has_function('public', 'admin_resolve_safety', array['uuid'], 'admin_resolve_safety exists');
select has_function('public', 'admin_revoke_role', array['uuid','text'], 'admin_revoke_role exists');
select has_function('public', 'admin_set_user_state', array['uuid','text','text'], 'admin_set_user_state exists');
select has_function('public', 'admin_community_overview', array[]::text[], 'admin_community_overview exists');

select * from finish();
rollback;
