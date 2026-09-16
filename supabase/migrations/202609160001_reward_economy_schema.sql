create table public.reward_partners (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (char_length(btrim(slug)) > 0),
  name text not null check (char_length(btrim(name)) > 0),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_partner_memberships (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.reward_partners(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('admin', 'operator')),
  active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (partner_id, user_id)
);

create table public.reward_pickup_locations (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid not null references public.reward_partners(id) on delete cascade,
  slug text not null,
  name text not null check (char_length(btrim(name)) > 0),
  address text,
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  active boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (partner_id, slug)
);

create table public.reward_catalog_items (
  id uuid primary key default gen_random_uuid(),
  partner_id uuid references public.reward_partners(id) on delete restrict,
  sku text not null unique check (char_length(btrim(sku)) > 0),
  name text not null check (char_length(btrim(name)) > 0),
  description text,
  reward_type text not null check (reward_type in ('digital', 'coupon', 'experience', 'physical')),
  rarity text not null default 'common' check (rarity in ('common', 'rare', 'epic', 'legendary')),
  olive_cost integer not null check (olive_cost >= 0),
  active boolean not null default true,
  starts_at timestamptz,
  ends_at timestamptz,
  minimum_level integer check (minimum_level is null or minimum_level >= 1),
  minimum_tree_stage text check (
    minimum_tree_stage is null or minimum_tree_stage in (
      'sprout', 'sapling', 'young', 'developing', 'strong',
      'adult', 'mature', 'centenary', 'monumental', 'legend'
    )
  ),
  required_badge_slugs text[] not null default '{}',
  required_challenge_ids text[] not null default '{}',
  stock_mode text not null default 'unlimited' check (stock_mode in ('unlimited', 'tracked')),
  per_user_limit integer check (per_user_limit is null or per_user_limit > 0),
  repeatable boolean not null default false,
  digital_asset_key text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at),
  check (reward_type <> 'digital' or stock_mode = 'unlimited')
);

create table public.reward_inventory (
  id uuid primary key default gen_random_uuid(),
  reward_id uuid not null references public.reward_catalog_items(id) on delete cascade,
  pickup_location_id uuid not null references public.reward_pickup_locations(id) on delete cascade,
  available_quantity integer not null default 0 check (available_quantity >= 0),
  reserved_quantity integer not null default 0 check (reserved_quantity >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (reward_id, pickup_location_id)
);

create table public.olive_wallets (
  user_id uuid primary key references auth.users(id) on delete cascade,
  available integer not null default 0 check (available >= 0),
  reserved integer not null default 0 check (reserved >= 0),
  lifetime_granted integer not null default 0 check (lifetime_granted >= 0),
  lifetime_spent integer not null default 0 check (lifetime_spent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.reward_reservations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  reward_id uuid not null references public.reward_catalog_items(id) on delete restrict,
  partner_id uuid not null references public.reward_partners(id) on delete restrict,
  pickup_location_id uuid references public.reward_pickup_locations(id) on delete restrict,
  status text not null default 'reserved' check (status in ('reserved', 'redeemed', 'cancelled', 'expired')),
  olive_cost integer not null check (olive_cost > 0),
  idempotency_key text not null check (char_length(btrim(idempotency_key)) > 0),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null,
  closed_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  unique (user_id, idempotency_key),
  check (expires_at > reserved_at),
  check ((status = 'reserved' and closed_at is null) or status <> 'reserved')
);

create table public.olive_ledger (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  movement_type text not null check (movement_type in ('grant', 'reserve', 'release', 'spend', 'refund', 'admin-adjustment')),
  amount integer not null check (amount > 0),
  source_key text not null unique check (char_length(btrim(source_key)) > 0),
  reservation_id uuid references public.reward_reservations(id) on delete restrict,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  check (
    (movement_type in ('reserve', 'release') and reservation_id is not null)
    or movement_type not in ('reserve', 'release')
  )
);

create table public.reward_entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete restrict,
  reward_id uuid not null references public.reward_catalog_items(id) on delete restrict,
  source_key text not null unique check (char_length(btrim(source_key)) > 0),
  quantity integer not null default 1 check (quantity > 0),
  acquired_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.reward_redemption_credentials (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null references public.reward_reservations(id) on delete restrict,
  token_hash text not null unique check (char_length(token_hash) >= 32),
  status text not null default 'active' check (status in ('active', 'consumed', 'revoked', 'expired')),
  issued_at timestamptz not null default now(),
  expires_at timestamptz not null,
  consumed_at timestamptz,
  revoked_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  check (expires_at > issued_at),
  check (status <> 'consumed' or consumed_at is not null),
  check (status <> 'revoked' or revoked_at is not null)
);

create unique index reward_redemption_credentials_one_active_per_reservation
  on public.reward_redemption_credentials (reservation_id)
  where status = 'active';

create table public.reward_redemptions (
  id uuid primary key default gen_random_uuid(),
  reservation_id uuid not null unique references public.reward_reservations(id) on delete restrict,
  credential_id uuid not null unique references public.reward_redemption_credentials(id) on delete restrict,
  reward_id uuid not null references public.reward_catalog_items(id) on delete restrict,
  partner_id uuid not null references public.reward_partners(id) on delete restrict,
  pickup_location_id uuid references public.reward_pickup_locations(id) on delete restrict,
  operator_user_id uuid not null references auth.users(id) on delete restrict,
  idempotency_key text not null unique check (char_length(btrim(idempotency_key)) > 0),
  redeemed_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb
);

create table public.reward_audit_log (
  id bigint generated by default as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  partner_id uuid references public.reward_partners(id) on delete set null,
  action text not null check (char_length(btrim(action)) > 0),
  subject_type text not null check (char_length(btrim(subject_type)) > 0),
  subject_id uuid,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now()
);

create index reward_partner_memberships_user_idx
  on public.reward_partner_memberships (user_id)
  where active = true;
create index reward_pickup_locations_partner_idx
  on public.reward_pickup_locations (partner_id)
  where active = true;
create index reward_catalog_items_partner_idx
  on public.reward_catalog_items (partner_id)
  where active = true;
create index reward_inventory_reward_idx
  on public.reward_inventory (reward_id);
create index olive_ledger_user_time_idx
  on public.olive_ledger (user_id, occurred_at desc);
create index olive_ledger_reservation_idx
  on public.olive_ledger (reservation_id)
  where reservation_id is not null;
create index reward_entitlements_user_idx
  on public.reward_entitlements (user_id, acquired_at desc);
create index reward_reservations_user_idx
  on public.reward_reservations (user_id, reserved_at desc);
create index reward_reservations_partner_status_idx
  on public.reward_reservations (partner_id, status);
create index reward_redemption_credentials_reservation_idx
  on public.reward_redemption_credentials (reservation_id);
create index reward_redemptions_user_lookup_idx
  on public.reward_redemptions (reservation_id, redeemed_at desc);
create index reward_audit_subject_idx
  on public.reward_audit_log (subject_type, subject_id, occurred_at desc);

alter table public.reward_partners enable row level security;
alter table public.reward_partner_memberships enable row level security;
alter table public.reward_pickup_locations enable row level security;
alter table public.reward_catalog_items enable row level security;
alter table public.reward_inventory enable row level security;
alter table public.olive_wallets enable row level security;
alter table public.olive_ledger enable row level security;
alter table public.reward_entitlements enable row level security;
alter table public.reward_reservations enable row level security;
alter table public.reward_redemption_credentials enable row level security;
alter table public.reward_redemptions enable row level security;
alter table public.reward_audit_log enable row level security;

create policy "public can read active reward partners"
  on public.reward_partners for select
  using (active = true);

create policy "members can read own reward partner memberships"
  on public.reward_partner_memberships for select
  to authenticated
  using (user_id = auth.uid());

create policy "public can read active reward pickup locations"
  on public.reward_pickup_locations for select
  using (
    active = true
    and exists (
      select 1
      from public.reward_partners p
      where p.id = reward_pickup_locations.partner_id
        and p.active = true
    )
  );

create policy "public can read active reward catalog"
  on public.reward_catalog_items for select
  using (active = true);

create policy "public can read inventory for active rewards"
  on public.reward_inventory for select
  using (
    exists (
      select 1
      from public.reward_catalog_items r
      where r.id = reward_inventory.reward_id
        and r.active = true
    )
    and exists (
      select 1
      from public.reward_pickup_locations l
      where l.id = reward_inventory.pickup_location_id
        and l.active = true
    )
  );

create policy "users can read own olive wallet"
  on public.olive_wallets for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can read own olive ledger"
  on public.olive_ledger for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can read own reward entitlements"
  on public.reward_entitlements for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can read own reward reservations"
  on public.reward_reservations for select
  to authenticated
  using (user_id = auth.uid());

create policy "users can read own reward redemptions"
  on public.reward_redemptions for select
  to authenticated
  using (
    exists (
      select 1
      from public.reward_reservations rr
      where rr.id = reward_redemptions.reservation_id
        and rr.user_id = auth.uid()
    )
  );

create or replace function public.prevent_reward_record_mutation()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception '% is append-only', tg_table_name
    using errcode = '55000';
end;
$$;

create trigger olive_ledger_append_only
  before update or delete on public.olive_ledger
  for each row execute function public.prevent_reward_record_mutation();

create trigger reward_redemptions_append_only
  before update or delete on public.reward_redemptions
  for each row execute function public.prevent_reward_record_mutation();

create trigger reward_audit_log_append_only
  before update or delete on public.reward_audit_log
  for each row execute function public.prevent_reward_record_mutation();

revoke execute on function public.prevent_reward_record_mutation() from public;
