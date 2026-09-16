create table public.gamification_seasons (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  xp_multiplier numeric(5,2) not null default 1 check (xp_multiplier > 0),
  olive_multiplier numeric(5,2) not null default 1 check (olive_multiplier > 0),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  check (ends_at > starts_at)
);

create table public.discovery_collections (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  description text not null default '',
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.discovery_collection_items (
  collection_id uuid not null references public.discovery_collections(id) on delete cascade,
  discovery_id uuid not null references public.discoveries(id) on delete cascade,
  sort_order integer not null default 0,
  primary key(collection_id,discovery_id)
);

alter table public.gamification_seasons enable row level security;
alter table public.discovery_collections enable row level security;
alter table public.discovery_collection_items enable row level security;

grant select on public.gamification_seasons, public.discovery_collections, public.discovery_collection_items to anon, authenticated;
grant insert,update,delete on public.gamification_seasons, public.discovery_collections, public.discovery_collection_items to authenticated;

create policy "read active seasons" on public.gamification_seasons for select to anon,authenticated using(active or private.admin_has_capability('gamification.manage',auth.uid()));
create policy "manage seasons" on public.gamification_seasons for all to authenticated using(private.admin_has_capability('gamification.manage',auth.uid())) with check(private.admin_has_capability('gamification.manage',auth.uid()));

create policy "read active collections" on public.discovery_collections for select to anon,authenticated using(active or private.admin_has_capability('gamification.manage',auth.uid()));
create policy "manage collections" on public.discovery_collections for all to authenticated using(private.admin_has_capability('gamification.manage',auth.uid())) with check(private.admin_has_capability('gamification.manage',auth.uid()));

create policy "read active collection items" on public.discovery_collection_items for select to anon,authenticated using(
  exists(select 1 from public.discovery_collections c where c.id=collection_id and (c.active or private.admin_has_capability('gamification.manage',auth.uid())))
);
create policy "manage collection items" on public.discovery_collection_items for all to authenticated using(private.admin_has_capability('gamification.manage',auth.uid())) with check(private.admin_has_capability('gamification.manage',auth.uid()));

create trigger audit_gamification_seasons after insert or update or delete on public.gamification_seasons for each row execute function private.audit_row_change();
create trigger audit_discovery_collections after insert or update or delete on public.discovery_collections for each row execute function private.audit_row_change();
create trigger audit_discovery_collection_items after insert or update or delete on public.discovery_collection_items for each row execute function private.audit_row_change();
