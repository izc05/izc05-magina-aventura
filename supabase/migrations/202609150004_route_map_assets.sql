create table public.route_map_assets (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null,
  geometry_version integer not null check (geometry_version > 0),
  asset_kind text not null check (asset_kind = 'pmtiles'),
  object_key text not null check (length(trim(object_key)) > 0),
  public_url text not null check (public_url ~ '^https://'),
  byte_size bigint not null check (byte_size > 0),
  md5 text,
  min_zoom numeric(4,1) not null check (min_zoom >= 0),
  max_zoom numeric(4,1) not null check (max_zoom >= min_zoom),
  bounds extensions.geometry(Polygon, 4326) not null,
  style_template_url text not null check (style_template_url ~ '^https://'),
  created_at timestamptz not null default now(),
  constraint route_map_assets_geometry_fk
    foreign key (route_id, geometry_version)
    references public.route_geometries(route_id, version)
    on delete cascade,
  unique(route_id, geometry_version, asset_kind)
);

create index route_map_assets_bounds_gix
  on public.route_map_assets using gist (bounds);

alter table public.route_map_assets enable row level security;

grant select on public.route_map_assets to anon, authenticated;

create policy "public can read map assets of published routes"
  on public.route_map_assets
  for select
  using (exists (
    select 1
    from public.routes r
    where r.id = route_map_assets.route_id
      and r.status = 'published'
  ));
