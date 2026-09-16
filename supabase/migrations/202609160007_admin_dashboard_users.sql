create or replace function private.admin_dashboard_metrics(actor uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare payload jsonb;
begin
  if not private.admin_has_capability('dashboard.read',actor) then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'users_total',(select count(*) from auth.users),
    'users_active_30d',(select count(*) from auth.users where last_sign_in_at >= now()-interval '30 days'),
    'routes_total',(select count(*) from public.routes),
    'routes_published',(select count(*) from public.routes where status='published'),
    'safety_open',(select count(*) from public.route_safety_incidents where status='open'),
    'moderation_open',(select count(*) from public.moderation_reports where status in ('open','reviewing')),
    'chat_reports_open',(select count(*) from public.community_chat_reports where status='open'),
    'rewards_active',(select count(*) from public.rewards where active and (valid_until is null or valid_until>now())),
    'redemptions_reserved',(select count(*) from public.reward_redemptions where status='reserved'),
    'redemptions_30d',(select count(*) from public.reward_redemptions where status='redeemed' and redeemed_at>=now()-interval '30 days'),
    'olives_net',(select coalesce(sum(amount),0) from public.olive_transactions),
    'chat_messages_24h',(select count(*) from public.community_chat_messages where created_at>=now()-interval '24 hours')
  ) into payload;
  return payload;
end;
$$;
revoke all on function private.admin_dashboard_metrics(uuid) from public;
grant execute on function private.admin_dashboard_metrics(uuid) to authenticated;

create or replace function public.admin_dashboard_metrics()
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$ select private.admin_dashboard_metrics(auth.uid()); $$;
revoke all on function public.admin_dashboard_metrics() from public;
grant execute on function public.admin_dashboard_metrics() to authenticated;

create or replace function private.admin_user_overview(target_user_id uuid, actor uuid default auth.uid())
returns jsonb
language plpgsql
stable
security definer
set search_path=''
as $$
declare payload jsonb;
begin
  if not (private.admin_has_capability('users.read',actor) or private.admin_has_capability('admins.manage',actor)) then raise exception 'not authorized'; end if;
  select jsonb_build_object(
    'user_id',u.id,
    'email',u.email,
    'created_at',u.created_at,
    'last_sign_in_at',u.last_sign_in_at,
    'roles',coalesce((select jsonb_agg(jsonb_build_object('role',r.role_id,'partner_id',r.partner_id)) from public.user_admin_roles r where r.user_id=u.id),'[]'::jsonb),
    'moderation',coalesce((select to_jsonb(s) - 'user_id' from public.user_moderation_states s where s.user_id=u.id),'{}'::jsonb),
    'olive_balance',(select coalesce(sum(t.amount),0) from public.olive_transactions t where t.user_id=u.id),
    'redemptions',jsonb_build_object(
      'reserved',(select count(*) from public.reward_redemptions rr where rr.user_id=u.id and rr.status='reserved'),
      'redeemed',(select count(*) from public.reward_redemptions rr where rr.user_id=u.id and rr.status='redeemed'),
      'expired',(select count(*) from public.reward_redemptions rr where rr.user_id=u.id and rr.status='expired'),
      'cancelled',(select count(*) from public.reward_redemptions rr where rr.user_id=u.id and rr.status='cancelled')
    ),
    'chat_messages',(select count(*) from public.community_chat_messages m where m.user_id=u.id),
    'chat_reports_against',(select count(*) from public.community_chat_reports cr join public.community_chat_messages m on m.id=cr.message_id where m.user_id=u.id)
  ) into payload
  from auth.users u where u.id=target_user_id;
  if payload is null then raise exception 'user not found'; end if;
  return payload;
end;
$$;
revoke all on function private.admin_user_overview(uuid,uuid) from public;
grant execute on function private.admin_user_overview(uuid,uuid) to authenticated;

create or replace function public.admin_user_overview(target_user_id uuid)
returns jsonb
language sql
stable
security invoker
set search_path=''
as $$ select private.admin_user_overview(target_user_id,auth.uid()); $$;
revoke all on function public.admin_user_overview(uuid) from public;
grant execute on function public.admin_user_overview(uuid) to authenticated;
