create or replace function private.admin_update_route_content_v2(
  target_route_id uuid,
  content_payload jsonb,
  actor uuid default auth.uid()
)
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare
  next_version integer;
  route_kind_value text;
  elevation_loss_value integer;
  elevation_min_value integer;
  elevation_max_value integer;
  recommended_seasons_value text[] := '{}';
  editorial_sections_value jsonb;
begin
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;
  if content_payload is null or jsonb_typeof(content_payload) <> 'object' then
    raise exception 'content payload must be an object';
  end if;
  if not (content_payload ?& array[
    'description','safety_notes','distance_km','elevation_gain_m','elevation_loss_m',
    'duration_minutes','difficulty','reward_xp','reward_olives','offline_available',
    'route_kind','recommended_seasons','editorial_sections'
  ]) then
    raise exception 'missing required content fields';
  end if;
  if jsonb_typeof(content_payload->'safety_notes') <> 'array' then
    raise exception 'safety notes must be an array';
  end if;
  if jsonb_typeof(content_payload->'recommended_seasons') <> 'array' then
    raise exception 'recommended seasons must be an array';
  end if;
  if jsonb_typeof(content_payload->'editorial_sections') <> 'object' then
    raise exception 'editorial sections must be an object';
  end if;

  route_kind_value := content_payload->>'route_kind';
  if route_kind_value not in ('circular','linear','out_and_back') then
    raise exception 'invalid route kind';
  end if;

  elevation_loss_value := (content_payload->>'elevation_loss_m')::integer;
  elevation_min_value := nullif(content_payload->>'elevation_min_m','')::integer;
  elevation_max_value := nullif(content_payload->>'elevation_max_m','')::integer;
  if elevation_loss_value < 0 then
    raise exception 'elevation loss must be non-negative';
  end if;
  if elevation_min_value is not null and elevation_max_value is not null and elevation_max_value < elevation_min_value then
    raise exception 'maximum elevation must be greater than or equal to minimum elevation';
  end if;

  select coalesce(array_agg(value order by ordinal), '{}')
    into recommended_seasons_value
  from jsonb_array_elements_text(content_payload->'recommended_seasons') with ordinality as seasons(value,ordinal);

  if exists(
    select 1 from unnest(recommended_seasons_value) as season(value)
    where value not in ('spring','summer','autumn','winter')
  ) then
    raise exception 'invalid recommended season';
  end if;

  editorial_sections_value := content_payload->'editorial_sections';

  next_version := private.admin_update_route_content(
    target_route_id,
    content_payload->>'description',
    content_payload->'safety_notes',
    (content_payload->>'distance_km')::numeric,
    (content_payload->>'elevation_gain_m')::integer,
    (content_payload->>'duration_minutes')::integer,
    content_payload->>'difficulty',
    (content_payload->>'reward_xp')::integer,
    (content_payload->>'reward_olives')::integer,
    (content_payload->>'offline_available')::boolean,
    actor
  );

  update public.route_versions
  set route_kind=route_kind_value,
      elevation_loss_m=elevation_loss_value,
      elevation_min_m=elevation_min_value,
      elevation_max_m=elevation_max_value,
      access_notes=btrim(coalesce(content_payload->>'access_notes','')),
      parking_notes=btrim(coalesce(content_payload->>'parking_notes','')),
      water_notes=btrim(coalesce(content_payload->>'water_notes','')),
      shade_notes=btrim(coalesce(content_payload->>'shade_notes','')),
      coverage_notes=btrim(coalesce(content_payload->>'coverage_notes','')),
      recommended_seasons=recommended_seasons_value,
      editorial_sections=editorial_sections_value
  where route_id=target_route_id and version=next_version;

  return next_version;
end;
$$;

revoke all on function private.admin_update_route_content_v2(uuid,jsonb,uuid) from public;
revoke execute on function private.admin_update_route_content_v2(uuid,jsonb,uuid) from anon;
grant execute on function private.admin_update_route_content_v2(uuid,jsonb,uuid) to authenticated;

create or replace function public.admin_update_route_content_v2(
  target_route_id uuid,
  content_payload jsonb
)
returns integer
language sql
security invoker
set search_path=''
as $$
  select private.admin_update_route_content_v2(target_route_id,content_payload,auth.uid());
$$;

revoke all on function public.admin_update_route_content_v2(uuid,jsonb) from public;
revoke execute on function public.admin_update_route_content_v2(uuid,jsonb) from anon;
grant execute on function public.admin_update_route_content_v2(uuid,jsonb) to authenticated;
