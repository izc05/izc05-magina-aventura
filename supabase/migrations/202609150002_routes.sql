create table public.municipalities (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.routes (
  id uuid primary key default gen_random_uuid(),
  municipality_id uuid not null references public.municipalities(id),
  slug text not null unique,
  title text not null,
  status text not null check (status in ('draft','review','published','archived')),
  current_content_version integer not null default 1 check (current_content_version > 0),
  current_geometry_version integer not null default 1 check (current_geometry_version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.route_versions (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  version integer not null check (version > 0),
  description text not null,
  safety_notes jsonb not null default '[]'::jsonb,
  distance_km numeric(8,3) not null check (distance_km >= 0),
  elevation_gain_m integer not null check (elevation_gain_m >= 0),
  duration_minutes integer not null check (duration_minutes > 0),
  difficulty text not null check (difficulty in ('easy','moderate','hard')),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  discovery_count integer not null default 0 check (discovery_count >= 0),
  offline_available boolean not null default false,
  development_fixture boolean not null default false,
  created_at timestamptz not null default now(),
  unique(route_id, version)
);

create table public.route_geometries (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  version integer not null check (version > 0),
  geometry extensions.geometry(LineString, 4326) not null,
  start_point extensions.geometry(Point, 4326) not null,
  created_at timestamptz not null default now(),
  unique(route_id, version)
);

create index route_geometries_geometry_gix
  on public.route_geometries using gist (geometry);

create table public.checkpoints (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  name text not null,
  position extensions.geometry(Point, 4326) not null,
  trigger_radius_m integer not null check (trigger_radius_m between 5 and 500),
  required boolean not null default false,
  active boolean not null default true
);

create index checkpoints_position_gix
  on public.checkpoints using gist (position);

create table public.discoveries (
  id uuid primary key default gen_random_uuid(),
  route_id uuid references public.routes(id) on delete set null,
  category text not null check (category in ('flora','fauna','heritage','olive','tradition','landscape')),
  name text not null,
  position extensions.geometry(Point, 4326) not null,
  trigger_radius_m integer not null check (trigger_radius_m between 5 and 500),
  reward_xp integer not null default 0 check (reward_xp >= 0),
  reward_olives integer not null default 0 check (reward_olives >= 0),
  active boolean not null default true
);

create index discoveries_position_gix
  on public.discoveries using gist (position);
