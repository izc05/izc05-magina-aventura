alter table public.municipalities enable row level security;
alter table public.routes enable row level security;
alter table public.route_versions enable row level security;
alter table public.route_geometries enable row level security;
alter table public.checkpoints enable row level security;
alter table public.discoveries enable row level security;

create policy "public can read active municipalities"
  on public.municipalities for select
  using (active = true);

create policy "public can read published routes"
  on public.routes for select
  using (status = 'published');

create policy "public can read versions of published routes"
  on public.route_versions for select
  using (exists (
    select 1 from public.routes r
    where r.id = route_versions.route_id and r.status = 'published'
  ));

create policy "public can read geometries of published routes"
  on public.route_geometries for select
  using (exists (
    select 1 from public.routes r
    where r.id = route_geometries.route_id and r.status = 'published'
  ));

create policy "public can read active checkpoints on published routes"
  on public.checkpoints for select
  using (active = true and exists (
    select 1 from public.routes r
    where r.id = checkpoints.route_id and r.status = 'published'
  ));

create policy "public can read active discoveries"
  on public.discoveries for select
  using (active = true);
