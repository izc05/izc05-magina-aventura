create table public.community_chat_channels (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  route_id uuid references public.routes(id) on delete cascade,
  municipality_id uuid references public.municipalities(id) on delete cascade,
  active boolean not null default true,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (length(btrim(slug)) > 0),
  check (length(btrim(name)) > 0)
);

create table public.community_chat_messages (
  id uuid primary key default gen_random_uuid(),
  channel_id uuid not null references public.community_chat_channels(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  status text not null default 'visible' check (status in ('visible','hidden','deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  moderated_by uuid references auth.users(id) on delete set null,
  moderated_at timestamptz,
  moderation_reason text
);
create index community_chat_messages_channel_created_idx on public.community_chat_messages(channel_id, created_at desc);
create index community_chat_messages_user_created_idx on public.community_chat_messages(user_id, created_at desc);

create table public.community_chat_reports (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.community_chat_messages(id) on delete cascade,
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  reason text not null check (char_length(reason) between 3 and 1000),
  status text not null default 'open' check (status in ('open','resolved','dismissed')),
  resolution text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create unique index community_chat_reports_open_once_idx
on public.community_chat_reports(reporter_user_id,message_id)
where status='open';

alter table public.community_chat_channels enable row level security;
alter table public.community_chat_messages enable row level security;
alter table public.community_chat_reports enable row level security;

grant select on public.community_chat_channels to anon, authenticated;
grant insert, update, delete on public.community_chat_channels to authenticated;
grant select on public.community_chat_messages to anon, authenticated;
grant select, insert on public.community_chat_reports to authenticated;

create policy "read active community chat channels"
on public.community_chat_channels for select
to anon, authenticated
using (active or private.admin_has_capability('community.manage',auth.uid()));

create policy "community admins insert channels"
on public.community_chat_channels for insert
to authenticated
with check (private.admin_has_capability('community.manage',auth.uid()));

create policy "community admins update channels"
on public.community_chat_channels for update
to authenticated
using (private.admin_has_capability('community.manage',auth.uid()))
with check (private.admin_has_capability('community.manage',auth.uid()));

create policy "community admins delete channels"
on public.community_chat_channels for delete
to authenticated
using (private.admin_has_capability('community.manage',auth.uid()));

create policy "read visible community chat messages"
on public.community_chat_messages for select
to anon, authenticated
using (
  private.admin_has_capability('community.manage',auth.uid())
  or user_id=auth.uid()
  or (
    status='visible'
    and exists(select 1 from public.community_chat_channels c where c.id=channel_id and c.active)
  )
);

create policy "read own or moderate chat reports"
on public.community_chat_reports for select
to authenticated
using (reporter_user_id=auth.uid() or private.admin_has_capability('community.manage',auth.uid()));

create policy "submit own chat report"
on public.community_chat_reports for insert
to authenticated
with check (reporter_user_id=auth.uid() and status='open');

create trigger audit_chat_channels
after insert or update or delete on public.community_chat_channels
for each row execute function private.audit_row_change();

create or replace function private.post_community_chat_message(target_channel_id uuid, message_body text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare created_id uuid; user_state text;
begin
  if actor is null then raise exception 'authentication required'; end if;
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
revoke all on function private.post_community_chat_message(uuid,text,uuid) from public;
grant execute on function private.post_community_chat_message(uuid,text,uuid) to authenticated;

create or replace function public.post_community_chat_message(channel_id uuid, body text)
returns uuid
language sql
security invoker
set search_path=''
as $$ select private.post_community_chat_message(channel_id,body,auth.uid()); $$;
revoke all on function public.post_community_chat_message(uuid,text) from public;
grant execute on function public.post_community_chat_message(uuid,text) to authenticated;

create or replace function private.admin_moderate_chat_message(target_message_id uuid, moderation_action text, reason_text text, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare old_row public.community_chat_messages%rowtype; new_status text;
begin
  if not private.admin_has_capability('community.manage',actor) then raise exception 'not authorized'; end if;
  if moderation_action not in ('hide','restore','delete') then raise exception 'invalid moderation action'; end if;
  if moderation_action in ('hide','delete') and length(btrim(coalesce(reason_text,''))) < 3 then raise exception 'moderation reason required'; end if;

  select * into old_row from public.community_chat_messages where id=target_message_id for update;
  if old_row.id is null then raise exception 'message not found'; end if;
  new_status := case moderation_action when 'restore' then 'visible' when 'hide' then 'hidden' else 'deleted' end;

  update public.community_chat_messages
  set status=new_status,moderated_by=actor,moderated_at=now(),moderation_reason=nullif(btrim(reason_text),'') ,updated_at=now()
  where id=target_message_id;

  perform private.write_admin_audit(
    'chat.'||moderation_action,
    'community_chat_messages',
    target_message_id::text,
    to_jsonb(old_row),
    jsonb_build_object('status',new_status,'reason',reason_text),
    actor
  );
end;
$$;
revoke all on function private.admin_moderate_chat_message(uuid,text,text,uuid) from public;
grant execute on function private.admin_moderate_chat_message(uuid,text,text,uuid) to authenticated;

create or replace function public.admin_moderate_chat_message(message_id uuid, action text, reason text)
returns void
language sql
security invoker
set search_path=''
as $$ select private.admin_moderate_chat_message(message_id,action,reason,auth.uid()); $$;
revoke all on function public.admin_moderate_chat_message(uuid,text,text) from public;
grant execute on function public.admin_moderate_chat_message(uuid,text,text) to authenticated;

create or replace function private.admin_resolve_chat_report(target_report_id uuid, new_status text, resolution_text text, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('community.manage',actor) then raise exception 'not authorized'; end if;
  if new_status not in ('resolved','dismissed') then raise exception 'invalid report status'; end if;
  update public.community_chat_reports
  set status=new_status,resolution=resolution_text,resolved_by=actor,resolved_at=now()
  where id=target_report_id and status='open';
  if not found then raise exception 'report not found or already closed'; end if;
  perform private.write_admin_audit('chat.report.'||new_status,'community_chat_reports',target_report_id::text,null,jsonb_build_object('status',new_status,'resolution',resolution_text),actor);
end;
$$;
revoke all on function private.admin_resolve_chat_report(uuid,text,text,uuid) from public;
grant execute on function private.admin_resolve_chat_report(uuid,text,text,uuid) to authenticated;

create or replace function public.admin_resolve_chat_report(report_id uuid, new_status text, resolution text)
returns void
language sql
security invoker
set search_path=''
as $$ select private.admin_resolve_chat_report(report_id,new_status,resolution,auth.uid()); $$;
revoke all on function public.admin_resolve_chat_report(uuid,text,text) from public;
grant execute on function public.admin_resolve_chat_report(uuid,text,text) to authenticated;

create or replace function private.report_community_chat_message(target_message_id uuid, report_reason text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare report_id uuid;
begin
  if actor is null then raise exception 'authentication required'; end if;
  if char_length(btrim(report_reason)) < 3 then raise exception 'report reason required'; end if;
  if not exists(select 1 from public.community_chat_messages where id=target_message_id) then raise exception 'message not found'; end if;
  insert into public.community_chat_reports(message_id,reporter_user_id,reason)
  values(target_message_id,actor,btrim(report_reason)) returning id into report_id;
  return report_id;
end;
$$;
revoke all on function private.report_community_chat_message(uuid,text,uuid) from public;
grant execute on function private.report_community_chat_message(uuid,text,uuid) to authenticated;

create or replace function public.report_community_chat_message(message_id uuid, reason text)
returns uuid
language sql
security invoker
set search_path=''
as $$ select private.report_community_chat_message(message_id,reason,auth.uid()); $$;
revoke all on function public.report_community_chat_message(uuid,text) from public;
grant execute on function public.report_community_chat_message(uuid,text) to authenticated;

do $$
begin
  if exists(select 1 from pg_publication where pubname='supabase_realtime')
     and not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='community_chat_messages') then
    execute 'alter publication supabase_realtime add table public.community_chat_messages';
  end if;
end $$;
