create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to authenticated;

create table public.admin_roles (
  id text primary key check (id in ('super_admin','admin','route_manager','moderator','partner')),
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.admin_roles(id,name) values
  ('super_admin','Super Admin'),
  ('admin','Admin'),
  ('route_manager','Gestor de rutas'),
  ('moderator','Moderador'),
  ('partner','Partner / Almazara')
on conflict (id) do nothing;

create table public.reward_partners (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_admin_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role_id text not null references public.admin_roles(id) on delete restrict,
  partner_id uuid references public.reward_partners(id) on delete set null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null,
  unique(user_id, role_id),
  check ((role_id = 'partner' and partner_id is not null) or (role_id <> 'partner' and partner_id is null))
);

create table public.admin_audit_log (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);
create index admin_audit_log_created_idx on public.admin_audit_log(created_at desc);
create index admin_audit_log_entity_idx on public.admin_audit_log(entity_type, entity_id);

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  object_key text not null unique,
  title text not null,
  alt_text text,
  mime_type text not null,
  byte_size bigint not null default 0 check (byte_size >= 0),
  tags text[] not null default '{}',
  archived boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.route_media (
  route_id uuid not null references public.routes(id) on delete cascade,
  media_id uuid not null references public.media_assets(id) on delete cascade,
  kind text not null default 'gallery' check (kind in ('hero','gallery','safety','discovery')),
  sort_order integer not null default 0,
  primary key(route_id, media_id, kind)
);

create table public.moderation_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('post','comment','user','message','route_review','other')),
  target_id text not null,
  reason text not null,
  context jsonb not null default '{}'::jsonb,
  status text not null default 'open' check (status in ('open','reviewing','resolved','dismissed')),
  resolution text,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.gamification_levels (
  id uuid primary key default gen_random_uuid(),
  level integer not null unique check (level > 0),
  name text not null,
  min_xp integer not null unique check (min_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  active boolean not null default true
);

create table public.gamification_badges (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.gamification_challenges (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  active boolean not null default true,
  check (ends_at > starts_at)
);

create table public.olive_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  amount integer not null check (amount <> 0),
  reason text not null check (length(btrim(reason)) > 0),
  source_type text not null,
  source_id text,
  actor_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);
create index olive_transactions_user_idx on public.olive_transactions(user_id, created_at desc);

create table public.rewards (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.reward_partners(id) on delete cascade,
  title text not null,
  description text not null default '',
  olive_cost integer not null check (olive_cost > 0),
  stock integer not null default 0 check (stock >= 0),
  per_user_limit integer not null default 1 check (per_user_limit > 0),
  active boolean not null default true,
  valid_from timestamptz not null default now(),
  valid_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_until is null or valid_until > valid_from)
);

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  reward_id uuid not null references public.rewards(id) on delete restrict,
  partner_id uuid not null references public.reward_partners(id) on delete restrict,
  olive_cost integer not null check (olive_cost > 0),
  token_hash text not null unique,
  status text not null default 'reserved' check (status in ('reserved','redeemed','expired','cancelled')),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  redeemed_at timestamptz,
  redeemed_by uuid references auth.users(id) on delete set null,
  cancelled_at timestamptz,
  check ((status <> 'redeemed') or redeemed_at is not null)
);
create index reward_redemptions_user_idx on public.reward_redemptions(user_id, reserved_at desc);
create index reward_redemptions_partner_idx on public.reward_redemptions(partner_id, status);

create table public.admin_notifications (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  body text not null,
  audience text not null default 'all' check (audience in ('all','route','municipality','role')),
  audience_ref text,
  status text not null default 'draft' check (status in ('draft','published','archived')),
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  published_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.route_safety_incidents (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  title text not null,
  description text not null,
  severity text not null check (severity in ('info','warning','critical')),
  status text not null default 'open' check (status in ('open','resolved','cancelled')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  created_by uuid not null default auth.uid() references auth.users(id) on delete restrict,
  resolved_by uuid references auth.users(id) on delete set null,
  resolved_at timestamptz
);

alter table public.admin_roles enable row level security;
alter table public.reward_partners enable row level security;
alter table public.user_admin_roles enable row level security;
alter table public.admin_audit_log enable row level security;
alter table public.media_assets enable row level security;
alter table public.route_media enable row level security;
alter table public.moderation_reports enable row level security;
alter table public.gamification_levels enable row level security;
alter table public.gamification_badges enable row level security;
alter table public.gamification_challenges enable row level security;
alter table public.olive_transactions enable row level security;
alter table public.rewards enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.admin_notifications enable row level security;
alter table public.route_safety_incidents enable row level security;

create or replace function private.admin_has_capability(capability text, actor uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.user_admin_roles uar
    where uar.user_id = actor
      and (
        uar.role_id = 'super_admin'
        or (uar.role_id = 'admin' and capability <> 'admins.manage')
        or (uar.role_id = 'route_manager' and capability = any(array['dashboard.read','routes.manage','map.manage','discoveries.manage','media.manage']))
        or (uar.role_id = 'moderator' and capability = any(array['dashboard.read','users.read','community.manage','moderation.manage','audit.read']))
        or (uar.role_id = 'partner' and capability = any(array['dashboard.read','rewards.manage','redemptions.manage']))
      )
  );
$$;
revoke all on function private.admin_has_capability(text,uuid) from public;
grant execute on function private.admin_has_capability(text,uuid) to authenticated;

create or replace function private.admin_partner_allowed(target_partner uuid, capability text, actor uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select private.admin_has_capability(capability, actor)
    and (
      exists(select 1 from public.user_admin_roles r where r.user_id=actor and r.role_id in ('super_admin','admin'))
      or exists(select 1 from public.user_admin_roles r where r.user_id=actor and r.role_id='partner' and r.partner_id=target_partner)
    );
$$;
revoke all on function private.admin_partner_allowed(uuid,text,uuid) from public;
grant execute on function private.admin_partner_allowed(uuid,text,uuid) to authenticated;

create or replace function public.admin_has_capability(capability text)
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$ select private.admin_has_capability(capability, auth.uid()); $$;
revoke all on function public.admin_has_capability(text) from public;
grant execute on function public.admin_has_capability(text) to authenticated;

create policy "admins can read role catalogue" on public.admin_roles for select to authenticated using (private.admin_has_capability('dashboard.read', auth.uid()));
create policy "admins can read role memberships" on public.user_admin_roles for select to authenticated using (user_id = auth.uid() or private.admin_has_capability('admins.manage', auth.uid()) or private.admin_has_capability('users.read', auth.uid()));

create or replace function private.write_admin_audit(action_name text, entity_name text, entity_key text, before_value jsonb, after_value jsonb, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.admin_audit_log(actor_user_id,action,entity_type,entity_id,before_data,after_data)
  values(actor,action_name,entity_name,entity_key,before_value,after_value);
end;
$$;
revoke all on function private.write_admin_audit(text,text,text,jsonb,jsonb,uuid) from public;
grant execute on function private.write_admin_audit(text,text,text,jsonb,jsonb,uuid) to authenticated;

create or replace function private.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare before_json jsonb; after_json jsonb; entity_key text;
begin
  before_json := case when tg_op in ('UPDATE','DELETE') then to_jsonb(old) else null end;
  after_json := case when tg_op in ('INSERT','UPDATE') then to_jsonb(new) else null end;
  entity_key := coalesce(after_json->>'id',before_json->>'id',after_json->>'user_id',before_json->>'user_id');
  perform private.write_admin_audit(lower(tg_table_name)||'.'||lower(tg_op),tg_table_name,entity_key,before_json,after_json,auth.uid());
  return coalesce(new,old);
end;
$$;
revoke all on function private.audit_row_change() from public;

create policy "authorized admins can read audit" on public.admin_audit_log for select to authenticated using (private.admin_has_capability('audit.read', auth.uid()) or private.admin_has_capability('admins.manage', auth.uid()));

create policy "media admins read" on public.media_assets for select to authenticated using (private.admin_has_capability('media.manage', auth.uid()));
create policy "media admins insert" on public.media_assets for insert to authenticated with check (private.admin_has_capability('media.manage', auth.uid()) and created_by = auth.uid());
create policy "media admins update" on public.media_assets for update to authenticated using (private.admin_has_capability('media.manage', auth.uid())) with check (private.admin_has_capability('media.manage', auth.uid()));
create policy "media admins delete" on public.media_assets for delete to authenticated using (private.admin_has_capability('media.manage', auth.uid()));
create policy "route media admins manage" on public.route_media for all to authenticated using (private.admin_has_capability('media.manage', auth.uid())) with check (private.admin_has_capability('media.manage', auth.uid()));

create policy "users submit reports" on public.moderation_reports for insert to authenticated with check (reporter_user_id = auth.uid());
create policy "users read own or moderators read all" on public.moderation_reports for select to authenticated using (reporter_user_id = auth.uid() or private.admin_has_capability('moderation.manage', auth.uid()));
create policy "moderators update reports" on public.moderation_reports for update to authenticated using (private.admin_has_capability('moderation.manage', auth.uid())) with check (private.admin_has_capability('moderation.manage', auth.uid()));

create policy "authenticated read levels" on public.gamification_levels for select to authenticated using (active or private.admin_has_capability('gamification.manage', auth.uid()));
create policy "gamification admins manage levels" on public.gamification_levels for all to authenticated using (private.admin_has_capability('gamification.manage', auth.uid())) with check (private.admin_has_capability('gamification.manage', auth.uid()));
create policy "authenticated read badges" on public.gamification_badges for select to authenticated using (active or private.admin_has_capability('gamification.manage', auth.uid()));
create policy "gamification admins manage badges" on public.gamification_badges for all to authenticated using (private.admin_has_capability('gamification.manage', auth.uid())) with check (private.admin_has_capability('gamification.manage', auth.uid()));
create policy "authenticated read challenges" on public.gamification_challenges for select to authenticated using (active or private.admin_has_capability('gamification.manage', auth.uid()));
create policy "gamification admins manage challenges" on public.gamification_challenges for all to authenticated using (private.admin_has_capability('gamification.manage', auth.uid())) with check (private.admin_has_capability('gamification.manage', auth.uid()));

create policy "users read own olive ledger" on public.olive_transactions for select to authenticated using (user_id = auth.uid() or private.admin_has_capability('olives.manage', auth.uid()));

create policy "authenticated read active partners" on public.reward_partners for select to authenticated using (active or private.admin_has_capability('partners.manage', auth.uid()) or private.admin_has_capability('rewards.manage', auth.uid()));
create policy "partner admins insert partners" on public.reward_partners for insert to authenticated with check (private.admin_has_capability('partners.manage', auth.uid()));
create policy "partner admins update partners" on public.reward_partners for update to authenticated using (private.admin_has_capability('partners.manage', auth.uid())) with check (private.admin_has_capability('partners.manage', auth.uid()));
create policy "partner admins delete partners" on public.reward_partners for delete to authenticated using (private.admin_has_capability('partners.manage', auth.uid()));

create policy "authenticated read active rewards" on public.rewards for select to authenticated using (active or private.admin_partner_allowed(partner_id,'rewards.manage',auth.uid()));
create policy "authorized partner inserts rewards" on public.rewards for insert to authenticated with check (private.admin_partner_allowed(partner_id,'rewards.manage',auth.uid()));
create policy "authorized partner updates rewards" on public.rewards for update to authenticated using (private.admin_partner_allowed(partner_id,'rewards.manage',auth.uid())) with check (private.admin_partner_allowed(partner_id,'rewards.manage',auth.uid()));
create policy "authorized partner deletes rewards" on public.rewards for delete to authenticated using (private.admin_partner_allowed(partner_id,'rewards.manage',auth.uid()));

create policy "users and authorized partners read redemptions" on public.reward_redemptions for select to authenticated using (user_id=auth.uid() or private.admin_partner_allowed(partner_id,'redemptions.manage',auth.uid()));

create policy "admins manage notifications" on public.admin_notifications for all to authenticated using (private.admin_has_capability('notifications.manage',auth.uid())) with check (private.admin_has_capability('notifications.manage',auth.uid()));
create policy "authenticated read published notifications" on public.admin_notifications for select to authenticated using (status='published' or private.admin_has_capability('notifications.manage',auth.uid()));
create policy "admins manage safety" on public.route_safety_incidents for all to authenticated using (private.admin_has_capability('safety.manage',auth.uid())) with check (private.admin_has_capability('safety.manage',auth.uid()));
create policy "authenticated read open safety" on public.route_safety_incidents for select to authenticated using (status='open' or private.admin_has_capability('safety.manage',auth.uid()));

create policy "route admins read all municipalities" on public.municipalities for select to authenticated using (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins read all routes" on public.routes for select to authenticated using (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins insert routes" on public.routes for insert to authenticated with check (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins update routes" on public.routes for update to authenticated using (private.admin_has_capability('routes.manage',auth.uid())) with check (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins delete routes" on public.routes for delete to authenticated using (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins manage versions" on public.route_versions for all to authenticated using (private.admin_has_capability('routes.manage',auth.uid())) with check (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins manage geometries" on public.route_geometries for all to authenticated using (private.admin_has_capability('routes.manage',auth.uid())) with check (private.admin_has_capability('routes.manage',auth.uid()));
create policy "route admins manage checkpoints" on public.checkpoints for all to authenticated using (private.admin_has_capability('map.manage',auth.uid())) with check (private.admin_has_capability('map.manage',auth.uid()));
create policy "route admins manage discoveries" on public.discoveries for all to authenticated using (private.admin_has_capability('discoveries.manage',auth.uid())) with check (private.admin_has_capability('discoveries.manage',auth.uid()));

grant select on public.municipalities, public.routes, public.route_versions, public.route_geometries, public.checkpoints, public.discoveries to anon, authenticated;
grant insert, update, delete on public.routes, public.route_versions, public.route_geometries, public.checkpoints, public.discoveries to authenticated;
grant select on public.admin_roles, public.user_admin_roles, public.admin_audit_log, public.media_assets, public.route_media, public.moderation_reports, public.gamification_levels, public.gamification_badges, public.gamification_challenges, public.olive_transactions, public.reward_partners, public.rewards, public.reward_redemptions, public.admin_notifications, public.route_safety_incidents to authenticated;
grant insert, update, delete on public.media_assets, public.route_media, public.moderation_reports, public.gamification_levels, public.gamification_badges, public.gamification_challenges, public.reward_partners, public.rewards, public.admin_notifications, public.route_safety_incidents to authenticated;

create or replace function private.admin_assign_role(target_user_id uuid, new_role text, target_partner_id uuid default null, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not private.admin_has_capability('admins.manage',actor) then raise exception 'not authorized'; end if;
  if not exists(select 1 from public.admin_roles where id=new_role) then raise exception 'invalid role'; end if;
  if (new_role='partner') <> (target_partner_id is not null) then raise exception 'partner role requires partner'; end if;
  insert into public.user_admin_roles(user_id,role_id,partner_id,created_by) values(target_user_id,new_role,target_partner_id,actor)
  on conflict (user_id,role_id) do update set partner_id=excluded.partner_id, created_by=actor, created_at=now();
  perform private.write_admin_audit('role.assign','user_admin_roles',target_user_id::text,null,jsonb_build_object('role',new_role,'partner_id',target_partner_id),actor);
end;
$$;
revoke all on function private.admin_assign_role(uuid,text,uuid,uuid) from public;
grant execute on function private.admin_assign_role(uuid,text,uuid,uuid) to authenticated;

create or replace function public.admin_assign_role(target_user_id uuid, new_role text, target_partner_id uuid default null)
returns void language sql security invoker set search_path='' as $$ select private.admin_assign_role(target_user_id,new_role,target_partner_id,auth.uid()); $$;
revoke all on function public.admin_assign_role(uuid,text,uuid) from public;
grant execute on function public.admin_assign_role(uuid,text,uuid) to authenticated;

create or replace function private.admin_list_users(actor uuid default auth.uid())
returns table(user_id uuid,email text,created_at timestamptz,last_sign_in_at timestamptz,roles text[])
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('users.read',actor) and not private.admin_has_capability('admins.manage',actor) then raise exception 'not authorized'; end if;
  return query
    select u.id,u.email,u.created_at,u.last_sign_in_at,coalesce(array_agg(r.role_id) filter(where r.role_id is not null),'{}'::text[])
    from auth.users u
    left join public.user_admin_roles r on r.user_id=u.id
    group by u.id,u.email,u.created_at,u.last_sign_in_at
    order by u.created_at desc;
end;
$$;
revoke all on function private.admin_list_users(uuid) from public;
grant execute on function private.admin_list_users(uuid) to authenticated;
create or replace function public.admin_list_users()
returns table(user_id uuid,email text,created_at timestamptz,last_sign_in_at timestamptz,roles text[])
language sql security invoker set search_path='' as $$ select * from private.admin_list_users(auth.uid()); $$;
revoke all on function public.admin_list_users() from public;
grant execute on function public.admin_list_users() to authenticated;

create or replace function private.admin_adjust_olives(target_user_id uuid, delta integer, adjustment_reason text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare new_id uuid;
begin
  if not private.admin_has_capability('olives.manage',actor) then raise exception 'not authorized'; end if;
  if delta=0 or length(btrim(adjustment_reason))=0 then raise exception 'invalid adjustment'; end if;
  insert into public.olive_transactions(user_id,amount,reason,source_type,actor_user_id)
  values(target_user_id,delta,adjustment_reason,'admin_adjustment',actor)
  returning id into new_id;
  perform private.write_admin_audit('olives.adjust','olive_transactions',new_id::text,null,jsonb_build_object('user_id',target_user_id,'amount',delta,'reason',adjustment_reason),actor);
  return new_id;
end;
$$;
revoke all on function private.admin_adjust_olives(uuid,integer,text,uuid) from public;
grant execute on function private.admin_adjust_olives(uuid,integer,text,uuid) to authenticated;
create or replace function public.admin_adjust_olives(target_user_id uuid, delta integer, adjustment_reason text)
returns uuid language sql security invoker set search_path='' as $$ select private.admin_adjust_olives(target_user_id,delta,adjustment_reason,auth.uid()); $$;
revoke all on function public.admin_adjust_olives(uuid,integer,text) from public;
grant execute on function public.admin_adjust_olives(uuid,integer,text) to authenticated;

create or replace function private.reserve_reward(target_reward_id uuid, actor uuid default auth.uid())
returns text
language plpgsql
security definer
set search_path=''
as $$
declare rw public.rewards%rowtype; balance integer; token text; redemption_id uuid; used_count integer;
begin
  select * into rw from public.rewards where id=target_reward_id for update;
  if rw.id is null or not rw.active or rw.stock<=0 or rw.valid_from>now() or (rw.valid_until is not null and rw.valid_until<=now()) then raise exception 'reward unavailable'; end if;
  select coalesce(sum(amount),0)::integer into balance from public.olive_transactions where user_id=actor;
  if balance < rw.olive_cost then raise exception 'insufficient olives'; end if;
  select count(*) into used_count from public.reward_redemptions where user_id=actor and reward_id=rw.id and status in ('reserved','redeemed');
  if used_count >= rw.per_user_limit then raise exception 'reward limit reached'; end if;
  token := encode(extensions.gen_random_bytes(24),'hex');
  update public.rewards set stock=stock-1,updated_at=now() where id=rw.id;
  insert into public.reward_redemptions(user_id,reward_id,partner_id,olive_cost,token_hash,expires_at)
  values(actor,rw.id,rw.partner_id,rw.olive_cost,encode(extensions.digest(token,'sha256'),'hex'),now()+interval '7 days') returning id into redemption_id;
  insert into public.olive_transactions(user_id,amount,reason,source_type,source_id,actor_user_id)
  values(actor,-rw.olive_cost,'Reserva de premio','reward_redemption',redemption_id::text,actor);
  return token;
end;
$$;
revoke all on function private.reserve_reward(uuid,uuid) from public;
grant execute on function private.reserve_reward(uuid,uuid) to authenticated;
create or replace function public.reserve_reward(reward_id uuid)
returns text language sql security invoker set search_path='' as $$ select private.reserve_reward(reward_id,auth.uid()); $$;
revoke all on function public.reserve_reward(uuid) from public;
grant execute on function public.reserve_reward(uuid) to authenticated;

create or replace function private.redeem_reward_token(token text, actor uuid default auth.uid())
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare rr public.reward_redemptions%rowtype;
begin
  select * into rr from public.reward_redemptions where token_hash=encode(extensions.digest(token,'sha256'),'hex') for update;
  if rr.id is null then raise exception 'invalid token'; end if;
  if rr.status <> 'reserved' then raise exception 'token already used'; end if;
  if rr.expires_at <= now() then raise exception 'token expired'; end if;
  if not private.admin_partner_allowed(rr.partner_id,'redemptions.manage',actor) then raise exception 'not authorized'; end if;
  update public.reward_redemptions set status='redeemed',redeemed_at=now(),redeemed_by=actor where id=rr.id;
  perform private.write_admin_audit('reward.redeem','reward_redemptions',rr.id::text,to_jsonb(rr),jsonb_build_object('status','redeemed'),actor);
  return rr.id;
end;
$$;
revoke all on function private.redeem_reward_token(text,uuid) from public;
grant execute on function private.redeem_reward_token(text,uuid) to authenticated;
create or replace function public.redeem_reward_token(token text)
returns uuid language sql security invoker set search_path='' as $$ select private.redeem_reward_token(token,auth.uid()); $$;
revoke all on function public.redeem_reward_token(text) from public;
grant execute on function public.redeem_reward_token(text) to authenticated;

insert into storage.buckets(id,name,public) values('media','media',false) on conflict (id) do nothing;
create policy "admin media read objects" on storage.objects for select to authenticated using (bucket_id='media' and private.admin_has_capability('media.manage',auth.uid()));
create policy "admin media insert objects" on storage.objects for insert to authenticated with check (bucket_id='media' and private.admin_has_capability('media.manage',auth.uid()));
create policy "admin media update objects" on storage.objects for update to authenticated using (bucket_id='media' and private.admin_has_capability('media.manage',auth.uid())) with check (bucket_id='media' and private.admin_has_capability('media.manage',auth.uid()));
create policy "admin media delete objects" on storage.objects for delete to authenticated using (bucket_id='media' and private.admin_has_capability('media.manage',auth.uid()));

create trigger audit_routes after insert or update or delete on public.routes for each row execute function private.audit_row_change();
create trigger audit_route_versions after insert or update or delete on public.route_versions for each row execute function private.audit_row_change();
create trigger audit_checkpoints after insert or update or delete on public.checkpoints for each row execute function private.audit_row_change();
create trigger audit_discoveries after insert or update or delete on public.discoveries for each row execute function private.audit_row_change();
create trigger audit_media_assets after insert or update or delete on public.media_assets for each row execute function private.audit_row_change();
create trigger audit_user_admin_roles after insert or update or delete on public.user_admin_roles for each row execute function private.audit_row_change();
create trigger audit_moderation_reports after update or delete on public.moderation_reports for each row execute function private.audit_row_change();
create trigger audit_reward_partners after insert or update or delete on public.reward_partners for each row execute function private.audit_row_change();
create trigger audit_rewards after insert or update or delete on public.rewards for each row execute function private.audit_row_change();
create trigger audit_notifications after insert or update or delete on public.admin_notifications for each row execute function private.audit_row_change();
create trigger audit_safety after insert or update or delete on public.route_safety_incidents for each row execute function private.audit_row_change();
