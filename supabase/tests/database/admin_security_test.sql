begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

select ok((select relrowsecurity from pg_class where oid='public.admin_audit_log'::regclass),'audit log has RLS');
select ok((select relrowsecurity from pg_class where oid='public.olive_transactions'::regclass),'olive ledger has RLS');
select ok(not has_table_privilege('authenticated','public.admin_audit_log','INSERT'),'authenticated cannot insert audit log directly');
select ok(not has_table_privilege('authenticated','public.admin_audit_log','UPDATE'),'authenticated cannot update audit log');
select ok(not has_table_privilege('authenticated','public.admin_audit_log','DELETE'),'authenticated cannot delete audit log');
select ok(not has_table_privilege('authenticated','public.olive_transactions','INSERT'),'authenticated cannot insert olive ledger directly');
select ok(not has_table_privilege('authenticated','public.olive_transactions','UPDATE'),'authenticated cannot update olive ledger');
select ok(not has_table_privilege('authenticated','public.olive_transactions','DELETE'),'authenticated cannot delete olive ledger');
select ok(not has_function_privilege('authenticated','private.write_admin_audit(text,text,text,jsonb,jsonb,uuid)','EXECUTE'),'authenticated cannot forge audit events');
select ok(not (select prosecdef from pg_proc where oid='public.admin_assign_role(uuid,text,uuid)'::regprocedure),'admin role RPC remains security invoker');
select ok(not (select prosecdef from pg_proc where oid='public.reserve_reward(uuid)'::regprocedure),'reward RPC remains security invoker');
select ok(not has_function_privilege('anon','public.admin_assign_role(uuid,text,uuid)','EXECUTE'),'anon cannot execute admin role RPC');
select ok(not has_function_privilege('anon','public.reserve_reward(uuid)','EXECUTE'),'anon cannot execute reward reservation RPC');
select ok(has_function_privilege('authenticated','public.reserve_reward(uuid)','EXECUTE'),'authenticated retains the safe public reward RPC');
select throws_ok(
  $$ select private.reserve_reward(gen_random_uuid(), gen_random_uuid()) $$,
  'P0001','actor mismatch',
  'private reward helper rejects a forged actor'
);
select throws_ok(
  $$ select private.post_community_chat_message(gen_random_uuid(),'test',gen_random_uuid()) $$,
  'P0001','actor mismatch',
  'private chat helper rejects a forged actor'
);
select ok(not has_function_privilege('authenticated','public.claim_notification_deliveries(integer)','EXECUTE'),'authenticated cannot claim push queue');
select ok(not has_function_privilege('anon','public.claim_notification_deliveries(integer)','EXECUTE'),'anon cannot claim push queue');
select ok(has_function_privilege('service_role','public.claim_notification_deliveries(integer)','EXECUTE'),'service role can claim push queue');
select ok(not has_function_privilege('authenticated','public.complete_notification_delivery(uuid,boolean,text,text)','EXECUTE'),'authenticated cannot complete push deliveries');
select ok(has_function_privilege('service_role','public.complete_notification_delivery(uuid,boolean,text,text)','EXECUTE'),'service role can complete push deliveries');
select is((select public from storage.buckets where id='media'),false,'media bucket remains private');
select ok(exists(select 1 from pg_trigger where tgname='audit_route_geometries' and not tgisinternal),'route geometry mutations are audited');
select ok(exists(select 1 from pg_trigger where tgname='audit_route_media' and not tgisinternal),'route media mutations are audited');
select ok(exists(select 1 from pg_trigger where tgname='audit_gamification_levels' and not tgisinternal),'level mutations are audited');
select ok(exists(select 1 from pg_trigger where tgname='audit_gamification_badges' and not tgisinternal),'badge mutations are audited');
select ok(exists(select 1 from pg_trigger where tgname='audit_gamification_challenges' and not tgisinternal),'challenge mutations are audited');

select * from finish();
rollback;
