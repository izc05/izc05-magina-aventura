alter table public.routes
  add column canonical_catalog_id text unique,
  add column catalog_origin text;

alter table public.route_sources
  add column external_source_id text,
  add column verification_state text
    check (
      verification_state is null
      or verification_state in (
        'official_verified',
        'cross_checked',
        'community_unverified',
        'editorial_derived',
        'stale',
        'unknown'
      )
    );

create unique index route_sources_external_source_uidx
  on public.route_sources(route_id, external_source_id)
  where external_source_id is not null;

create table public.route_catalog_profiles (
  route_id uuid primary key references public.routes(id) on delete cascade,
  canonical_catalog_id text not null unique,
  source_snapshot_version text not null,
  source_snapshot_commit text not null,
  verification_state text not null
    check (verification_state in (
      'official_verified',
      'cross_checked',
      'community_unverified',
      'editorial_derived',
      'stale',
      'unknown'
    )),
  route_kind text
    check (route_kind is null or route_kind in ('circular','linear','out_and_back')),
  distance_km numeric(8,3)
    check (distance_km is null or distance_km >= 0),
  duration_minutes_min integer
    check (duration_minutes_min is null or duration_minutes_min > 0),
  duration_minutes_max integer
    check (duration_minutes_max is null or duration_minutes_max > 0),
  official_difficulty text
    check (official_difficulty is null or official_difficulty in ('easy','moderate','hard','expert')),
  elevation_gain_m integer
    check (elevation_gain_m is null or elevation_gain_m >= 0),
  elevation_loss_m integer
    check (elevation_loss_m is null or elevation_loss_m >= 0),
  elevation_min_m integer,
  elevation_max_m integer,
  family_profile jsonb not null default '{}'::jsonb
    check (jsonb_typeof(family_profile) = 'object'),
  accessibility_facts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(accessibility_facts) = 'array'),
  stable_safety_facts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(stable_safety_facts) = 'array'),
  editorial_facts jsonb not null default '[]'::jsonb
    check (jsonb_typeof(editorial_facts) = 'array'),
  source_checked_at timestamptz not null,
  imported_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    duration_minutes_min is null
    or duration_minutes_max is null
    or duration_minutes_max >= duration_minutes_min
  ),
  check (
    elevation_min_m is null
    or elevation_max_m is null
    or elevation_max_m >= elevation_min_m
  )
);

create table public.route_municipalities (
  route_id uuid not null references public.routes(id) on delete cascade,
  municipality_id uuid not null references public.municipalities(id) on delete restrict,
  is_primary boolean not null default false,
  source_kind text not null default 'catalog'
    check (source_kind in ('catalog','admin','field')),
  created_at timestamptz not null default now(),
  primary key(route_id, municipality_id)
);

create unique index route_municipalities_one_primary_uidx
  on public.route_municipalities(route_id)
  where is_primary;

create index route_municipalities_municipality_idx
  on public.route_municipalities(municipality_id, route_id);

create table public.route_catalog_restrictions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_restriction_id text not null,
  restriction_type text not null,
  severity text not null
    check (severity in ('info','warning','restricting','blocking')),
  status text not null
    check (status in ('active','scheduled','resolved','unknown')),
  starts_at timestamptz,
  ends_at timestamptz,
  published_at timestamptz,
  checked_at timestamptz not null,
  reason text not null,
  source_external_ids text[] not null default '{}',
  verification_state text not null
    check (verification_state in (
      'official_verified',
      'cross_checked',
      'community_unverified',
      'editorial_derived',
      'stale',
      'unknown'
    )),
  imported_at timestamptz not null default now(),
  unique(route_id, external_restriction_id)
);

create index route_catalog_restrictions_route_idx
  on public.route_catalog_restrictions(route_id, status, severity);

create table public.route_catalog_pois (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_poi_id text not null,
  name text not null,
  category text not null,
  longitude numeric,
  latitude numeric,
  water_metadata jsonb,
  verification_state text not null
    check (verification_state in (
      'official_verified',
      'cross_checked',
      'community_unverified',
      'editorial_derived',
      'stale',
      'unknown'
    )),
  source_external_ids text[] not null default '{}',
  notes text not null default '',
  imported_at timestamptz not null default now(),
  unique(route_id, external_poi_id),
  check (
    (longitude is null and latitude is null)
    or (
      longitude is not null
      and latitude is not null
      and longitude between -180 and 180
      and latitude between -90 and 90
    )
  ),
  check (water_metadata is null or jsonb_typeof(water_metadata) = 'object')
);

create index route_catalog_pois_route_idx
  on public.route_catalog_pois(route_id, category);

create table public.route_catalog_track_leads (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  external_source_id text,
  source_url text not null check (source_url ~ '^https?://'),
  format text not null check (format in ('gpx','kml','gml','geojson')),
  source_kind text not null
    check (source_kind in ('official','field','community','manual')),
  status text not null default 'discovered'
    check (status in ('discovered','fetched','validated','unavailable')),
  notes text not null default '',
  checked_at timestamptz not null,
  fetched_at timestamptz,
  validated_at timestamptz,
  unique(route_id, source_url, format)
);

create index route_catalog_track_leads_route_idx
  on public.route_catalog_track_leads(route_id, status);

create table public.catalog_import_runs (
  id uuid primary key default gen_random_uuid(),
  catalog_name text not null,
  snapshot_version text not null,
  source_commit text not null,
  manifest_sha256 text not null,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  status text not null check (status in ('running','completed','failed')),
  route_count integer not null default 0 check (route_count >= 0),
  source_count integer not null default 0 check (source_count >= 0),
  restriction_count integer not null default 0 check (restriction_count >= 0),
  poi_count integer not null default 0 check (poi_count >= 0),
  notes text not null default ''
);

alter table public.route_catalog_profiles enable row level security;
alter table public.route_municipalities enable row level security;
alter table public.route_catalog_restrictions enable row level security;
alter table public.route_catalog_pois enable row level security;
alter table public.route_catalog_track_leads enable row level security;
alter table public.catalog_import_runs enable row level security;

grant select on public.route_catalog_profiles to authenticated;
grant select on public.route_municipalities to authenticated;
grant select on public.route_catalog_restrictions to authenticated;
grant select on public.route_catalog_pois to authenticated;
grant select on public.route_catalog_track_leads to authenticated;
grant select on public.catalog_import_runs to authenticated;

create policy "route managers read catalog profiles"
on public.route_catalog_profiles for select
to authenticated
using (private.admin_has_capability('routes.manage', auth.uid()));

create policy "route managers read route municipalities"
on public.route_municipalities for select
to authenticated
using (private.admin_has_capability('routes.manage', auth.uid()));

create policy "route managers read catalog restrictions"
on public.route_catalog_restrictions for select
to authenticated
using (private.admin_has_capability('routes.manage', auth.uid()));

create policy "route managers read catalog pois"
on public.route_catalog_pois for select
to authenticated
using (private.admin_has_capability('routes.manage', auth.uid()));

create policy "route managers read catalog track leads"
on public.route_catalog_track_leads for select
to authenticated
using (private.admin_has_capability('routes.manage', auth.uid()));

create policy "route managers read catalog imports"
on public.catalog_import_runs for select
to authenticated
using (private.admin_has_capability('routes.manage', auth.uid()));

create trigger audit_route_catalog_profiles
  after insert or update or delete on public.route_catalog_profiles
  for each row execute function private.audit_row_change();

create trigger audit_route_municipalities
  after insert or update or delete on public.route_municipalities
  for each row execute function private.audit_row_change();

create trigger audit_route_catalog_restrictions
  after insert or update or delete on public.route_catalog_restrictions
  for each row execute function private.audit_row_change();

create trigger audit_route_catalog_pois
  after insert or update or delete on public.route_catalog_pois
  for each row execute function private.audit_row_change();

create trigger audit_route_catalog_track_leads
  after insert or update or delete on public.route_catalog_track_leads
  for each row execute function private.audit_row_change();
