alter table public.routes
  add column route_code text unique;

alter table public.route_versions
  add column route_kind text not null default 'circular'
    check (route_kind in ('circular','linear','out_and_back')),
  add column elevation_loss_m integer not null default 0 check (elevation_loss_m >= 0),
  add column elevation_min_m integer,
  add column elevation_max_m integer,
  add column access_notes text not null default '',
  add column parking_notes text not null default '',
  add column water_notes text not null default '',
  add column shade_notes text not null default '',
  add column coverage_notes text not null default '',
  add column recommended_seasons text[] not null default '{}',
  add column editorial_sections jsonb not null default '{}'::jsonb,
  add constraint route_versions_elevation_range_chk
    check (elevation_min_m is null or elevation_max_m is null or elevation_max_m >= elevation_min_m),
  add constraint route_versions_editorial_sections_object_chk
    check (jsonb_typeof(editorial_sections) = 'object');

create table public.route_access_points (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  kind text not null check (kind in ('start','parking','access','water','viewpoint')),
  name text not null check (length(btrim(name)) > 0),
  position extensions.geometry(Point, 4326) not null,
  notes text not null default '',
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index route_access_points_route_idx on public.route_access_points(route_id);
create index route_access_points_position_gix on public.route_access_points using gist(position);

create table public.route_sources (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  label text not null check (length(btrim(label)) > 0),
  url text not null check (url ~ '^https?://'),
  source_type text not null check (source_type in ('official','map','track','field','other')),
  official boolean not null default false,
  checked_at timestamptz,
  notes text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index route_sources_route_idx on public.route_sources(route_id);
create index route_sources_created_by_idx on public.route_sources(created_by) where created_by is not null;
create index route_sources_official_idx on public.route_sources(route_id, official) where official;

create table public.route_track_sources (
  route_id uuid not null,
  geometry_version integer not null check (geometry_version > 0),
  source_id uuid references public.route_sources(id) on delete set null,
  source_url text check (source_url is null or source_url ~ '^https?://'),
  format text not null check (format in ('gpx','kml','geojson','manual')),
  source_kind text not null check (source_kind in ('official','field','community','manual')),
  original_filename text,
  source_hash text,
  imported_at timestamptz not null default now(),
  validated_at timestamptz,
  validated_by uuid references auth.users(id) on delete set null,
  notes text not null default '',
  primary key(route_id, geometry_version),
  constraint route_track_sources_geometry_fk
    foreign key (route_id, geometry_version)
    references public.route_geometries(route_id, version)
    on delete cascade
);
create index route_track_sources_route_idx on public.route_track_sources(route_id);
create index route_track_sources_source_idx on public.route_track_sources(source_id) where source_id is not null;
create index route_track_sources_validated_by_idx on public.route_track_sources(validated_by) where validated_by is not null;

create table public.route_validation_status (
  route_id uuid primary key references public.routes(id) on delete cascade,
  editorial_status text not null default 'pending'
    check (editorial_status in ('pending','reviewing','verified')),
  track_status text not null default 'missing'
    check (track_status in ('missing','imported','verified')),
  field_status text not null default 'not_checked'
    check (field_status in ('not_checked','planned','verified')),
  media_status text not null default 'missing'
    check (media_status in ('missing','partial','ready')),
  safety_status text not null default 'pending'
    check (safety_status in ('pending','reviewed')),
  verified_by uuid references auth.users(id) on delete set null,
  verified_at timestamptz,
  notes text not null default '',
  updated_at timestamptz not null default now(),
  check ((verified_at is null and verified_by is null) or verified_at is not null)
);
create index route_validation_status_verified_by_idx on public.route_validation_status(verified_by) where verified_by is not null;

alter table public.route_access_points enable row level security;
alter table public.route_sources enable row level security;
alter table public.route_track_sources enable row level security;
alter table public.route_validation_status enable row level security;

grant select on public.route_access_points to authenticated;
grant select on public.route_sources to authenticated;
grant select on public.route_track_sources to authenticated;
grant select on public.route_validation_status to authenticated;

create policy "route managers read route access points"
on public.route_access_points for select
to authenticated
using (private.admin_has_capability('routes.manage',auth.uid()));

create policy "route managers read route sources"
on public.route_sources for select
to authenticated
using (private.admin_has_capability('routes.manage',auth.uid()));

create policy "route managers read route track sources"
on public.route_track_sources for select
to authenticated
using (private.admin_has_capability('routes.manage',auth.uid()));

create policy "route managers read route validation"
on public.route_validation_status for select
to authenticated
using (private.admin_has_capability('routes.manage',auth.uid()));
