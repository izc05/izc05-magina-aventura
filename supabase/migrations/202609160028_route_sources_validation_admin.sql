create or replace function private.admin_add_route_source(
  target_route_id uuid,
  source_label text,
  source_url text,
  source_type text,
  source_official boolean default false,
  source_checked_at timestamptz default null,
  source_notes text default '',
  actor uuid default auth.uid()
)
returns uuid
language plpgsql
security definer
set search_path=''
as $$
declare
  new_source_id uuid;
  source_row public.route_sources%rowtype;
begin
  if actor is null or actor is distinct from auth.uid() then
    raise exception 'actor mismatch';
  end if;
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;
  if not exists(select 1 from public.routes r where r.id=target_route_id) then
    raise exception 'route not found';
  end if;
  if length(btrim(coalesce(source_label,'')))=0 then
    raise exception 'source label required';
  end if;
  if coalesce(source_url,'') !~ '^https?://' then
    raise exception 'invalid source url';
  end if;
  if source_type not in ('official','map','track','field','other') then
    raise exception 'invalid source type';
  end if;

  insert into public.route_sources(
    route_id,label,url,source_type,official,checked_at,notes,created_by
  ) values (
    target_route_id,btrim(source_label),source_url,source_type,coalesce(source_official,false),
    source_checked_at,btrim(coalesce(source_notes,'')),actor
  )
  returning * into source_row;

  new_source_id := source_row.id;

  perform private.write_admin_audit(
    'route.source.create','route_sources',new_source_id::text,null,to_jsonb(source_row),actor
  );

  return new_source_id;
end;
$$;

revoke all on function private.admin_add_route_source(uuid,text,text,text,boolean,timestamptz,text,uuid) from public;
grant execute on function private.admin_add_route_source(uuid,text,text,text,boolean,timestamptz,text,uuid) to authenticated;

create or replace function public.admin_add_route_source(
  target_route_id uuid,
  source_label text,
  source_url text,
  source_type text,
  source_official boolean default false,
  source_checked_at timestamptz default null,
  source_notes text default ''
)
returns uuid
language sql
security invoker
set search_path=''
as $$
  select private.admin_add_route_source(
    target_route_id,source_label,source_url,source_type,source_official,
    source_checked_at,source_notes,auth.uid()
  );
$$;

revoke all on function public.admin_add_route_source(uuid,text,text,text,boolean,timestamptz,text) from public;
revoke execute on function public.admin_add_route_source(uuid,text,text,text,boolean,timestamptz,text) from anon;
grant execute on function public.admin_add_route_source(uuid,text,text,text,boolean,timestamptz,text) to authenticated;

create or replace function private.admin_update_route_validation(
  target_route_id uuid,
  editorial_status text,
  track_status text,
  field_status text,
  media_status text,
  safety_status text,
  validation_notes text default '',
  actor uuid default auth.uid()
)
returns jsonb
language plpgsql
security definer
set search_path=''
as $$
declare
  route_row public.routes%rowtype;
  before_validation jsonb;
  after_validation public.route_validation_status%rowtype;
  readiness jsonb;
  fully_verified boolean;
begin
  if actor is null or actor is distinct from auth.uid() then
    raise exception 'actor mismatch';
  end if;
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;
  if editorial_status not in ('pending','reviewing','verified') then
    raise exception 'invalid editorial status';
  end if;
  if track_status not in ('missing','imported','verified') then
    raise exception 'invalid track status';
  end if;
  if field_status not in ('not_checked','planned','verified') then
    raise exception 'invalid field status';
  end if;
  if media_status not in ('missing','partial','ready') then
    raise exception 'invalid media status';
  end if;
  if safety_status not in ('pending','reviewed') then
    raise exception 'invalid safety status';
  end if;

  select * into route_row
  from public.routes r
  where r.id=target_route_id
  for update;
  if route_row.id is null then
    raise exception 'route not found';
  end if;

  select to_jsonb(v) into before_validation
  from public.route_validation_status v
  where v.route_id=target_route_id;

  if track_status='verified' then
    if route_row.current_geometry_version is null or route_row.current_geometry_version < 1 then
      raise exception 'cannot verify track without current geometry';
    end if;
    if not exists(
      select 1 from public.route_track_sources ts
      where ts.route_id=target_route_id
        and ts.geometry_version=route_row.current_geometry_version
    ) then
      raise exception 'cannot verify track without provenance';
    end if;

    update public.route_track_sources
    set validated_at=now(), validated_by=actor
    where route_id=target_route_id
      and geometry_version=route_row.current_geometry_version;
  elsif route_row.current_geometry_version is not null then
    update public.route_track_sources
    set validated_at=null, validated_by=null
    where route_id=target_route_id
      and geometry_version=route_row.current_geometry_version;
  end if;

  fully_verified := editorial_status='verified'
    and track_status='verified'
    and safety_status='reviewed';

  insert into public.route_validation_status(
    route_id,editorial_status,track_status,field_status,media_status,safety_status,
    verified_by,verified_at,notes,updated_at
  ) values (
    target_route_id,editorial_status,track_status,field_status,media_status,safety_status,
    case when fully_verified then actor else null end,
    case when fully_verified then now() else null end,
    btrim(coalesce(validation_notes,'')),now()
  )
  on conflict(route_id) do update set
    editorial_status=excluded.editorial_status,
    track_status=excluded.track_status,
    field_status=excluded.field_status,
    media_status=excluded.media_status,
    safety_status=excluded.safety_status,
    verified_by=excluded.verified_by,
    verified_at=excluded.verified_at,
    notes=excluded.notes,
    updated_at=now()
  returning * into after_validation;

  readiness := private.route_v2_readiness(target_route_id);

  if route_row.status='published' and coalesce((readiness->>'ready')::boolean,false)=false then
    update public.routes
    set status='review', updated_at=now()
    where id=target_route_id;

    perform private.write_admin_audit(
      'route.status.auto_review','routes',target_route_id::text,
      jsonb_build_object('status','published'),
      jsonb_build_object('status','review','reason','validation no longer satisfies route V2 gate'),
      actor
    );
  end if;

  perform private.write_admin_audit(
    'route.validation.update','route_validation_status',target_route_id::text,
    before_validation,to_jsonb(after_validation),actor
  );

  return jsonb_build_object(
    'validation',to_jsonb(after_validation),
    'readiness',readiness
  );
end;
$$;

revoke all on function private.admin_update_route_validation(uuid,text,text,text,text,text,text,uuid) from public;
grant execute on function private.admin_update_route_validation(uuid,text,text,text,text,text,text,uuid) to authenticated;

create or replace function public.admin_update_route_validation(
  target_route_id uuid,
  editorial_status text,
  track_status text,
  field_status text,
  media_status text,
  safety_status text,
  validation_notes text default ''
)
returns jsonb
language sql
security invoker
set search_path=''
as $$
  select private.admin_update_route_validation(
    target_route_id,editorial_status,track_status,field_status,media_status,
    safety_status,validation_notes,auth.uid()
  );
$$;

revoke all on function public.admin_update_route_validation(uuid,text,text,text,text,text,text) from public;
revoke execute on function public.admin_update_route_validation(uuid,text,text,text,text,text,text) from anon;
grant execute on function public.admin_update_route_validation(uuid,text,text,text,text,text,text) to authenticated;
