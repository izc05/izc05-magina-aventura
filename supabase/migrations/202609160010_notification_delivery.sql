create table public.push_device_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  platform text not null check (platform in ('android','ios','web')),
  provider text not null default 'expo' check (length(btrim(provider)) > 0),
  token text not null unique check (length(btrim(token)) >= 16),
  active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);
create index push_device_subscriptions_user_idx on public.push_device_subscriptions(user_id,active);

create table public.notification_topic_subscriptions (
  user_id uuid not null references auth.users(id) on delete cascade,
  topic_type text not null check (topic_type in ('route','municipality')),
  topic_ref uuid not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key(user_id,topic_type,topic_ref)
);

create table public.notification_deliveries (
  id uuid primary key default gen_random_uuid(),
  notification_id uuid not null references public.admin_notifications(id) on delete cascade,
  device_id uuid not null references public.push_device_subscriptions(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','processing','sent','failed','skipped')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  provider_message_id text,
  error_message text,
  created_at timestamptz not null default now(),
  claimed_at timestamptz,
  sent_at timestamptz,
  unique(notification_id,device_id)
);
create index notification_deliveries_status_idx on public.notification_deliveries(status,created_at);
create index notification_deliveries_notification_idx on public.notification_deliveries(notification_id,status);

alter table public.push_device_subscriptions enable row level security;
alter table public.notification_topic_subscriptions enable row level security;
alter table public.notification_deliveries enable row level security;

grant select,insert,update,delete on public.push_device_subscriptions to authenticated;
grant select,insert,update,delete on public.notification_topic_subscriptions to authenticated;
grant select on public.notification_deliveries to authenticated;

create policy "users read own push devices" on public.push_device_subscriptions for select to authenticated using(user_id=auth.uid());
create policy "users insert own push devices" on public.push_device_subscriptions for insert to authenticated with check(user_id=auth.uid());
create policy "users update own push devices" on public.push_device_subscriptions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users delete own push devices" on public.push_device_subscriptions for delete to authenticated using(user_id=auth.uid());

create policy "users read own notification topics" on public.notification_topic_subscriptions for select to authenticated using(user_id=auth.uid());
create policy "users insert own notification topics" on public.notification_topic_subscriptions for insert to authenticated with check(user_id=auth.uid());
create policy "users update own notification topics" on public.notification_topic_subscriptions for update to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy "users delete own notification topics" on public.notification_topic_subscriptions for delete to authenticated using(user_id=auth.uid());

create policy "admins read notification deliveries" on public.notification_deliveries for select to authenticated using(private.admin_has_capability('notifications.manage',auth.uid()));

create or replace function private.register_push_device(device_platform text, device_provider text, device_token text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare existing_user uuid; device_id uuid;
begin
  if actor is null then raise exception 'authentication required'; end if;
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
revoke all on function private.register_push_device(text,text,text,uuid) from public;
grant execute on function private.register_push_device(text,text,text,uuid) to authenticated;

create or replace function public.register_push_device(platform text, provider text, token text)
returns uuid language sql security invoker set search_path=''
as $$ select private.register_push_device(platform,provider,token,auth.uid()); $$;
revoke all on function public.register_push_device(text,text,text) from public;
grant execute on function public.register_push_device(text,text,text) to authenticated;

create or replace function private.set_notification_topic(target_type text, target_ref uuid, target_enabled boolean, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if actor is null then raise exception 'authentication required'; end if;
  if target_type not in ('route','municipality') then raise exception 'invalid notification topic'; end if;
  if target_type='route' and not exists(select 1 from public.routes where id=target_ref) then raise exception 'route not found'; end if;
  if target_type='municipality' and not exists(select 1 from public.municipalities where id=target_ref) then raise exception 'municipality not found'; end if;
  insert into public.notification_topic_subscriptions(user_id,topic_type,topic_ref,enabled,updated_at)
  values(actor,target_type,target_ref,target_enabled,now())
  on conflict(user_id,topic_type,topic_ref) do update set enabled=excluded.enabled,updated_at=now();
end;
$$;
revoke all on function private.set_notification_topic(text,uuid,boolean,uuid) from public;
grant execute on function private.set_notification_topic(text,uuid,boolean,uuid) to authenticated;

create or replace function public.set_notification_topic(topic_type text, topic_ref uuid, enabled boolean)
returns void language sql security invoker set search_path=''
as $$ select private.set_notification_topic(topic_type,topic_ref,enabled,auth.uid()); $$;
revoke all on function public.set_notification_topic(text,uuid,boolean) from public;
grant execute on function public.set_notification_topic(text,uuid,boolean) to authenticated;

create or replace function private.admin_publish_notification(target_notification_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare n public.admin_notifications%rowtype; ref_uuid uuid;
begin
  if not private.admin_has_capability('notifications.manage',actor) then raise exception 'not authorized'; end if;
  select * into n from public.admin_notifications where id=target_notification_id for update;
  if n.id is null then raise exception 'notification not found'; end if;
  if n.status<>'draft' then raise exception 'notification not found or not draft'; end if;
  if n.audience<>'all' and length(btrim(coalesce(n.audience_ref,'')))=0 then raise exception 'audience reference required'; end if;
  if n.audience in ('route','municipality') then
    begin ref_uuid := n.audience_ref::uuid; exception when invalid_text_representation then raise exception 'audience reference must be UUID'; end;
  end if;

  update public.admin_notifications set status='published',published_at=now() where id=n.id;

  insert into public.notification_deliveries(notification_id,device_id,user_id)
  select n.id,d.id,d.user_id
  from public.push_device_subscriptions d
  where d.active
    and (
      n.audience='all'
      or (n.audience='role' and exists(select 1 from public.user_admin_roles ar where ar.user_id=d.user_id and ar.role_id=n.audience_ref))
      or (n.audience in ('route','municipality') and exists(
        select 1 from public.notification_topic_subscriptions s
        where s.user_id=d.user_id and s.enabled and s.topic_type=n.audience and s.topic_ref=ref_uuid
      ))
    )
  on conflict(notification_id,device_id) do nothing;

  perform private.write_admin_audit('notification.publish','admin_notifications',n.id::text,to_jsonb(n),jsonb_build_object('status','published','published_at',now()),actor);
end;
$$;

create or replace function public.claim_notification_deliveries(batch_size integer default 100)
returns table(delivery_id uuid,notification_id uuid,device_token text,provider text,platform text,title text,body text)
language plpgsql
security definer
set search_path=''
as $$
begin
  if batch_size < 1 or batch_size > 500 then raise exception 'batch size must be between 1 and 500'; end if;
  return query
  with claimed as (
    select nd.id
    from public.notification_deliveries nd
    where nd.status='pending'
    order by nd.created_at
    limit batch_size
    for update skip locked
  ), updated as (
    update public.notification_deliveries nd
    set status='processing',claimed_at=now(),attempt_count=attempt_count+1
    from claimed c
    where nd.id=c.id
    returning nd.id,nd.notification_id,nd.device_id
  )
  select u.id,u.notification_id,d.token,d.provider,d.platform,n.title,n.body
  from updated u
  join public.push_device_subscriptions d on d.id=u.device_id
  join public.admin_notifications n on n.id=u.notification_id;
end;
$$;
revoke all on function public.claim_notification_deliveries(integer) from public,anon,authenticated;
grant execute on function public.claim_notification_deliveries(integer) to service_role;

create or replace function public.complete_notification_delivery(delivery_id uuid, delivered boolean, provider_message_id text default null, delivery_error text default null)
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  update public.notification_deliveries
  set status=case when delivered then 'sent' else 'failed' end,
      provider_message_id=complete_notification_delivery.provider_message_id,
      error_message=case when delivered then null else delivery_error end,
      sent_at=case when delivered then now() else null end
  where id=delivery_id and status='processing';
  if not found then raise exception 'delivery not found or not processing'; end if;
end;
$$;
revoke all on function public.complete_notification_delivery(uuid,boolean,text,text) from public,anon,authenticated;
grant execute on function public.complete_notification_delivery(uuid,boolean,text,text) to service_role;
