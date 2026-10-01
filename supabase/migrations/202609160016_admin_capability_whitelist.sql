-- Keep the database capability model explicit. An ordinary `admin` must not
-- automatically inherit capabilities introduced in future migrations.
-- Bind actor-bearing authorization to the real JWT user so a caller cannot
-- impersonate another administrator by supplying an arbitrary UUID.

create or replace function private.admin_has_capability(capability text, actor uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select actor is not null
    and actor = auth.uid()
    and exists (
      select 1
      from public.user_admin_roles uar
      where uar.user_id = actor
        and (
          uar.role_id = 'super_admin'
          or (
            uar.role_id = 'admin'
            and capability = any(array[
              'dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage',
              'users.read','community.manage','moderation.manage','gamification.manage','olives.manage',
              'rewards.manage','partners.manage','redemptions.manage','notifications.manage','safety.manage',
              'audit.read','settings.manage'
            ])
          )
          or (
            uar.role_id = 'route_manager'
            and capability = any(array['dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage'])
          )
          or (
            uar.role_id = 'moderator'
            and capability = any(array['dashboard.read','users.read','community.manage','moderation.manage','audit.read'])
          )
          or (
            uar.role_id = 'partner'
            and capability = any(array['dashboard.read','rewards.manage','redemptions.manage'])
          )
        )
    );
$$;

-- User-facing private helpers can also be reached by authenticated SQL roles.
-- They must reject any supplied actor that differs from the JWT subject.
create or replace function private.reserve_reward(target_reward_id uuid, actor uuid default auth.uid())
returns text
language plpgsql
security definer
set search_path=''
as $$
declare
  rw public.rewards%rowtype;
  balance integer;
  token text;
  redemption_id uuid;
  used_count integer;
  reservation_minutes integer := 60;
  user_state text;
begin
  if actor is null or actor is distinct from auth.uid() then raise exception 'actor mismatch'; end if;

  select status into user_state from public.user_moderation_states where user_id=actor;
  if user_state='suspended' then raise exception 'user suspended'; end if;

  select * into rw from public.rewards where id=target_reward_id for update;
  if rw.id is null
     or not rw.active
     or rw.stock<=0
     or rw.valid_from>now()
     or (rw.valid_until is not null and rw.valid_until<=now())
     or not exists(select 1 from public.reward_partners p where p.id=rw.partner_id and p.active)
  then
    raise exception 'reward unavailable';
  end if;

  select coalesce(sum(amount),0)::integer into balance from public.olive_transactions where user_id=actor;
  if balance < rw.olive_cost then raise exception 'insufficient olives'; end if;

  select count(*) into used_count
  from public.reward_redemptions
  where user_id=actor and reward_id=rw.id and status in ('reserved','redeemed');
  if used_count >= rw.per_user_limit then raise exception 'reward limit reached'; end if;

  begin
    select greatest(5,least(10080,(value #>> '{}')::integer))
    into reservation_minutes
    from public.app_settings
    where key='rewards.reservation_minutes';
  exception when others then
    reservation_minutes := 60;
  end;
  reservation_minutes := coalesce(reservation_minutes,60);

  token := encode(extensions.gen_random_bytes(24),'hex');
  update public.rewards set stock=stock-1,updated_at=now() where id=rw.id;

  insert into public.reward_redemptions(user_id,reward_id,partner_id,olive_cost,token_hash,expires_at)
  values(
    actor,
    rw.id,
    rw.partner_id,
    rw.olive_cost,
    encode(extensions.digest(token,'sha256'),'hex'),
    now()+make_interval(mins=>reservation_minutes)
  )
  returning id into redemption_id;

  insert into public.olive_transactions(user_id,amount,reason,source_type,source_id,actor_user_id)
  values(actor,-rw.olive_cost,'Reserva de premio','reward_redemption',redemption_id::text,actor);

  perform private.write_admin_audit(
    'reward.reserve',
    'reward_redemptions',
    redemption_id::text,
    null,
    jsonb_build_object(
      'user_id',actor,
      'reward_id',rw.id,
      'partner_id',rw.partner_id,
      'olive_cost',rw.olive_cost,
      'reservation_minutes',reservation_minutes
    ),
    actor
  );
  return token;
end;
$$;

create or replace function private.cancel_reward_redemption(target_redemption_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare rr public.reward_redemptions%rowtype;
begin
  if actor is null or actor is distinct from auth.uid() then raise exception 'actor mismatch'; end if;
  select * into rr from public.reward_redemptions where id=target_redemption_id for update;
  if rr.id is null then raise exception 'redemption not found'; end if;
  if rr.status <> 'reserved' then raise exception 'redemption is not cancellable'; end if;
  if rr.user_id <> actor and not private.admin_partner_allowed(rr.partner_id,'redemptions.manage',actor) then raise exception 'not authorized'; end if;
  update public.reward_redemptions set status='cancelled',cancelled_at=now() where id=rr.id;
  update public.rewards set stock=stock+1,updated_at=now() where id=rr.reward_id;
  insert into public.olive_transactions(user_id,amount,reason,source_type,source_id,actor_user_id)
  values(rr.user_id,rr.olive_cost,'Devolución por cancelación de premio','reward_refund',rr.id::text,actor);
  perform private.write_admin_audit('reward.cancel','reward_redemptions',rr.id::text,to_jsonb(rr),jsonb_build_object('status','cancelled'),actor);
end;
$$;

create or replace function private.post_community_chat_message(target_channel_id uuid, message_body text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare created_id uuid; user_state text;
begin
  if actor is null or actor is distinct from auth.uid() then raise exception 'actor mismatch'; end if;
  if char_length(btrim(message_body)) < 1 or char_length(message_body) > 2000 then raise exception 'invalid message'; end if;
  if not exists(select 1 from public.community_chat_channels c where c.id=target_channel_id and c.active) then raise exception 'channel unavailable'; end if;

  select status into user_state from public.user_moderation_states where user_id=actor;
  if user_state='suspended' then raise exception 'user suspended'; end if;

  insert into public.community_chat_messages(channel_id,user_id,body)
  values(target_channel_id,actor,btrim(message_body))
  returning id into created_id;
  return created_id;
end;
$$;

create or replace function private.report_community_chat_message(target_message_id uuid, report_reason text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare report_id uuid;
begin
  if actor is null or actor is distinct from auth.uid() then raise exception 'actor mismatch'; end if;
  if char_length(btrim(report_reason)) < 3 then raise exception 'report reason required'; end if;
  if not exists(select 1 from public.community_chat_messages where id=target_message_id) then raise exception 'message not found'; end if;
  insert into public.community_chat_reports(message_id,reporter_user_id,reason)
  values(target_message_id,actor,btrim(report_reason)) returning id into report_id;
  return report_id;
end;
$$;

create or replace function private.register_push_device(device_platform text, device_provider text, device_token text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare existing_user uuid; device_id uuid;
begin
  if actor is null or actor is distinct from auth.uid() then raise exception 'actor mismatch'; end if;
  if device_platform not in ('android','ios','web') then raise exception 'invalid device platform'; end if;
  if length(btrim(coalesce(device_provider,'')))=0 then raise exception 'provider required'; end if;
  if length(btrim(coalesce(device_token,'')))<16 then raise exception 'invalid device token'; end if;

  select user_id,id into existing_user,device_id from public.push_device_subscriptions where token=btrim(device_token) for update;
  if device_id is not null and existing_user<>actor then raise exception 'device token already registered'; end if;

  if device_id is null then
    insert into public.push_device_subscriptions(user_id,platform,provider,token,active,last_seen_at)
    values(actor,device_platform,btrim(device_provider),btrim(device_token),true,now()) returning id into device_id;
  else
    update public.push_device_subscriptions set platform=device_platform,provider=btrim(device_provider),active=true,last_seen_at=now() where id=device_id;
  end if;
  return device_id;
end;
$$;

create or replace function private.set_notification_topic(target_type text, target_ref uuid, target_enabled boolean, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if actor is null or actor is distinct from auth.uid() then raise exception 'actor mismatch'; end if;
  if target_type not in ('route','municipality') then raise exception 'invalid notification topic'; end if;
  if target_type='route' and not exists(select 1 from public.routes where id=target_ref) then raise exception 'route not found'; end if;
  if target_type='municipality' and not exists(select 1 from public.municipalities where id=target_ref) then raise exception 'municipality not found'; end if;
  insert into public.notification_topic_subscriptions(user_id,topic_type,topic_ref,enabled,updated_at)
  values(actor,target_type,target_ref,target_enabled,now())
  on conflict(user_id,topic_type,topic_ref) do update set enabled=excluded.enabled,updated_at=now();
end;
$$;

-- Supabase can grant EXECUTE on newly created public functions directly to
-- `anon`. Public RPCs that enter the private Admin layer must remain
-- SECURITY INVOKER and callable only after authentication.
do $$
declare fn record;
begin
  for fn in
    select p.oid::regprocedure::text as signature
    from pg_proc p
    join pg_namespace n on n.oid=p.pronamespace
    where n.nspname='public'
      and p.prokind='f'
      and pg_get_functiondef(p.oid) ilike '%private.%'
  loop
    execute format('alter function public.%s security invoker', fn.signature);
    execute format('revoke execute on function public.%s from anon', fn.signature);
    execute format('grant execute on function public.%s to authenticated', fn.signature);
  end loop;
end $$;
