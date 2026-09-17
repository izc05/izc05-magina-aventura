create or replace function private.admin_delete_route(target_route_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare route_row public.routes%rowtype;
begin
  if actor is null or actor is distinct from auth.uid() then
    raise exception 'actor mismatch';
  end if;

  if not exists (
    select 1
    from public.user_admin_roles
    where user_id = actor
      and role_id = 'super_admin'
  ) then
    raise exception 'not authorized';
  end if;

  select * into route_row
  from public.routes
  where id = target_route_id
  for update;

  if route_row.id is null then
    raise exception 'route not found';
  end if;

  if route_row.status = 'published' then
    raise exception 'published route must be archived before deletion';
  end if;

  perform private.write_admin_audit(
    'route.delete',
    'routes',
    route_row.id::text,
    to_jsonb(route_row),
    null,
    actor
  );

  delete from public.routes where id = target_route_id;
end;
$$;

revoke all on function private.admin_delete_route(uuid,uuid) from public;
grant execute on function private.admin_delete_route(uuid,uuid) to authenticated;

create or replace function public.admin_delete_route(target_route_id uuid)
returns void
language sql
security invoker
set search_path=''
as $$
  select private.admin_delete_route(target_route_id,auth.uid());
$$;

revoke all on function public.admin_delete_route(uuid) from public;
grant execute on function public.admin_delete_route(uuid) to authenticated;
