create or replace function private.admin_set_route_status(
  target_route_id uuid,
  new_status text,
  actor uuid default auth.uid()
)
returns void
language plpgsql
security definer
set search_path=''
as $$
declare
  current_status text;
  readiness jsonb;
  readiness_reasons text;
begin
  if not private.admin_has_capability('routes.manage',actor) then
    raise exception 'not authorized';
  end if;

  if new_status not in ('draft','review','published','archived') then
    raise exception 'invalid route status';
  end if;

  select r.status
    into current_status
  from public.routes r
  where r.id=target_route_id
  for update;

  if current_status is null then
    raise exception 'route not found';
  end if;

  if not (
    current_status = new_status
    or (current_status='draft' and new_status in ('review','archived'))
    or (current_status='review' and new_status in ('draft','published','archived'))
    or (current_status='published' and new_status in ('review','archived'))
    or (current_status='archived' and new_status='draft')
  ) then
    raise exception 'invalid route status transition';
  end if;

  if new_status='published' and current_status <> 'published' then
    readiness := private.route_v2_readiness(target_route_id);

    if not coalesce((readiness->>'ready')::boolean,false) then
      select string_agg(reason,'; ' order by ordinal)
        into readiness_reasons
      from jsonb_array_elements_text(coalesce(readiness->'reasons','[]'::jsonb))
        with ordinality as r(reason,ordinal);

      raise exception 'route not ready for publication: %',
        coalesce(readiness_reasons,'validación V2 incompleta');
    end if;
  end if;

  update public.routes
  set status=new_status,
      updated_at=now()
  where id=target_route_id;
end;
$$;

revoke all on function private.admin_set_route_status(uuid,text,uuid) from public;
grant execute on function private.admin_set_route_status(uuid,text,uuid) to authenticated;
