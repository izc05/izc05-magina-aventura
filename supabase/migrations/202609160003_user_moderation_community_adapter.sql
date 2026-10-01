create table public.user_moderation_states (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active','warned','suspended')),
  reason text,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

alter table public.user_moderation_states enable row level security;

grant select on public.user_moderation_states to authenticated;

create policy "users read own moderation state" on public.user_moderation_states
for select to authenticated
using (
  user_id = auth.uid()
  or private.admin_has_capability('users.read', auth.uid())
  or private.admin_has_capability('moderation.manage', auth.uid())
  or private.admin_has_capability('admins.manage', auth.uid())
);

create or replace function private.admin_set_user_state(
  target_user_id uuid,
  new_status text,
  state_reason text,
  actor uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare before_row jsonb;
begin
  if not (
    private.admin_has_capability('moderation.manage',actor)
    or private.admin_has_capability('admins.manage',actor)
  ) then raise exception 'not authorized'; end if;
  if new_status not in ('active','warned','suspended') then raise exception 'invalid user state'; end if;
  if target_user_id = actor and new_status = 'suspended' then raise exception 'cannot suspend own account'; end if;
  if not exists(select 1 from auth.users where id=target_user_id) then raise exception 'user not found'; end if;

  select to_jsonb(s) into before_row from public.user_moderation_states s where s.user_id=target_user_id;
  insert into public.user_moderation_states(user_id,status,reason,updated_by,updated_at)
  values(target_user_id,new_status,nullif(btrim(state_reason),''),actor,now())
  on conflict(user_id) do update
    set status=excluded.status,reason=excluded.reason,updated_by=actor,updated_at=now();

  perform private.write_admin_audit(
    'user.state',
    'user_moderation_states',
    target_user_id::text,
    before_row,
    jsonb_build_object('status',new_status,'reason',nullif(btrim(state_reason),'')),
    actor
  );
end;
$$;
revoke all on function private.admin_set_user_state(uuid,text,text,uuid) from public;
grant execute on function private.admin_set_user_state(uuid,text,text,uuid) to authenticated;

create or replace function public.admin_set_user_state(target_user_id uuid, new_status text, state_reason text)
returns void
language sql
security invoker
set search_path=''
as $$ select private.admin_set_user_state(target_user_id,new_status,state_reason,auth.uid()); $$;
revoke all on function public.admin_set_user_state(uuid,text,text) from public;
grant execute on function public.admin_set_user_state(uuid,text,text) to authenticated;

create or replace function private.admin_community_overview(actor uuid default auth.uid())
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  photos_count bigint := 0;
  comments_count bigint := 0;
  reviews_count bigint := 0;
  incidents_count bigint := 0;
  reports_count bigint := 0;
  has_community boolean := false;
begin
  if not (
    private.admin_has_capability('community.manage',actor)
    or private.admin_has_capability('moderation.manage',actor)
  ) then raise exception 'not authorized'; end if;

  has_community := to_regclass('public.community_photos') is not null;
  if not has_community then
    return jsonb_build_object(
      'available',false,
      'photos_pending',0,
      'comments_visible',0,
      'reviews_visible',0,
      'incidents_pending',0,
      'reports_open',0
    );
  end if;

  execute 'select count(*) from public.community_photos where moderation_status = ''pending'' and deleted_at is null' into photos_count;
  if to_regclass('public.route_comments') is not null then
    execute 'select count(*) from public.route_comments where moderation_status = ''approved'' and deleted_at is null' into comments_count;
  end if;
  if to_regclass('public.route_reviews') is not null then
    execute 'select count(*) from public.route_reviews where moderation_status = ''approved'' and deleted_at is null' into reviews_count;
  end if;
  if to_regclass('public.route_incidents') is not null then
    execute 'select count(*) from public.route_incidents where status = ''pending'' and deleted_at is null' into incidents_count;
  end if;
  if to_regclass('public.community_reports') is not null then
    execute 'select count(*) from public.community_reports where status in (''open'',''reviewing'')' into reports_count;
  end if;

  return jsonb_build_object(
    'available',true,
    'photos_pending',photos_count,
    'comments_visible',comments_count,
    'reviews_visible',reviews_count,
    'incidents_pending',incidents_count,
    'reports_open',reports_count
  );
end;
$$;
revoke all on function private.admin_community_overview(uuid) from public;
grant execute on function private.admin_community_overview(uuid) to authenticated;

create or replace function public.admin_community_overview()
returns jsonb
language sql
security invoker
set search_path=''
as $$ select private.admin_community_overview(auth.uid()); $$;
revoke all on function public.admin_community_overview() from public;
grant execute on function public.admin_community_overview() to authenticated;
