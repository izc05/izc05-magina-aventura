grant insert,update,delete on public.route_map_assets to authenticated;

create policy "map admins read route map assets"
on public.route_map_assets for select
to authenticated
using(private.admin_has_capability('map.manage',auth.uid()));

create policy "map admins insert route map assets"
on public.route_map_assets for insert
to authenticated
with check(private.admin_has_capability('map.manage',auth.uid()));

create policy "map admins update route map assets"
on public.route_map_assets for update
to authenticated
using(private.admin_has_capability('map.manage',auth.uid()))
with check(private.admin_has_capability('map.manage',auth.uid()));

create policy "map admins delete route map assets"
on public.route_map_assets for delete
to authenticated
using(private.admin_has_capability('map.manage',auth.uid()));

create trigger audit_route_map_assets
after insert or update or delete on public.route_map_assets
for each row execute function private.audit_row_change();

create or replace function private.admin_upsert_route_map_asset(
  target_route_id uuid,
  target_object_key text,
  target_public_url text,
  target_byte_size bigint,
  target_min_zoom numeric,
  target_max_zoom numeric,
  target_bounds_wkt text,
  target_style_template_url text,
  target_md5 text,
  actor uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare geometry_version integer; bounds_geom extensions.geometry; asset_id uuid;
begin
  if not private.admin_has_capability('map.manage',actor) then raise exception 'not authorized'; end if;
  select current_geometry_version into geometry_version from public.routes where id=target_route_id;
  if geometry_version is null then raise exception 'route not found'; end if;
  if not exists(select 1 from public.route_geometries where route_id=target_route_id and version=geometry_version) then raise exception 'route geometry not found'; end if;
  if length(btrim(coalesce(target_object_key,'')))=0 then raise exception 'object key required'; end if;
  if target_public_url !~ '^https://' or target_style_template_url !~ '^https://' then raise exception 'map URLs must use HTTPS'; end if;
  if target_byte_size<=0 then raise exception 'byte size must be positive'; end if;
  if target_min_zoom<0 or target_max_zoom<target_min_zoom then raise exception 'invalid zoom range'; end if;

  bounds_geom := extensions.st_geomfromtext(target_bounds_wkt,4326);
  if extensions.geometrytype(bounds_geom)<>'POLYGON' then raise exception 'bounds must be a Polygon'; end if;

  insert into public.route_map_assets(route_id,geometry_version,asset_kind,object_key,public_url,byte_size,md5,min_zoom,max_zoom,bounds,style_template_url)
  values(target_route_id,geometry_version,'pmtiles',btrim(target_object_key),target_public_url,target_byte_size,nullif(btrim(coalesce(target_md5,'')),''),target_min_zoom,target_max_zoom,bounds_geom,target_style_template_url)
  on conflict(route_id,geometry_version,asset_kind) do update
    set object_key=excluded.object_key,public_url=excluded.public_url,byte_size=excluded.byte_size,md5=excluded.md5,min_zoom=excluded.min_zoom,max_zoom=excluded.max_zoom,bounds=excluded.bounds,style_template_url=excluded.style_template_url
  returning id into asset_id;
  return asset_id;
end;
$$;
revoke all on function private.admin_upsert_route_map_asset(uuid,text,text,bigint,numeric,numeric,text,text,text,uuid) from public;
grant execute on function private.admin_upsert_route_map_asset(uuid,text,text,bigint,numeric,numeric,text,text,text,uuid) to authenticated;

create or replace function public.admin_upsert_route_map_asset(
  route_id uuid,
  object_key text,
  public_url text,
  byte_size bigint,
  min_zoom numeric,
  max_zoom numeric,
  bounds_wkt text,
  style_template_url text,
  md5 text
)
returns uuid
language sql
security invoker
set search_path=''
as $$ select private.admin_upsert_route_map_asset(route_id,object_key,public_url,byte_size,min_zoom,max_zoom,bounds_wkt,style_template_url,md5,auth.uid()); $$;
revoke all on function public.admin_upsert_route_map_asset(uuid,text,text,bigint,numeric,numeric,text,text,text) from public;
grant execute on function public.admin_upsert_route_map_asset(uuid,text,text,bigint,numeric,numeric,text,text,text) to authenticated;

create or replace function private.admin_delete_route_map_asset(target_asset_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('map.manage',actor) then raise exception 'not authorized'; end if;
  delete from public.route_map_assets where id=target_asset_id;
  if not found then raise exception 'map asset not found'; end if;
end;
$$;
revoke all on function private.admin_delete_route_map_asset(uuid,uuid) from public;
grant execute on function private.admin_delete_route_map_asset(uuid,uuid) to authenticated;

create or replace function public.admin_delete_route_map_asset(asset_id uuid)
returns void
language sql
security invoker
set search_path=''
as $$ select private.admin_delete_route_map_asset(asset_id,auth.uid()); $$;
revoke all on function public.admin_delete_route_map_asset(uuid) from public;
grant execute on function public.admin_delete_route_map_asset(uuid) to authenticated;
