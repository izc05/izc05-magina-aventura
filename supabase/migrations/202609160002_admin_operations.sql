create or replace function private.admin_set_route_status(target_route_id uuid, new_status text, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare current_status text; content_version integer; geometry_version integer;
begin
  if not private.admin_has_capability('routes.manage',actor) then raise exception 'not authorized'; end if;
  if new_status not in ('draft','review','published','archived') then raise exception 'invalid route status'; end if;
  select status,current_content_version,current_geometry_version into current_status,content_version,geometry_version
    from public.routes where id=target_route_id for update;
  if current_status is null then raise exception 'route not found'; end if;
  if new_status='published' then
    if not exists(select 1 from public.route_versions v where v.route_id=target_route_id and v.version=content_version) then raise exception 'route content version missing'; end if;
    if not exists(select 1 from public.route_geometries g where g.route_id=target_route_id and g.version=geometry_version) then raise exception 'route geometry missing'; end if;
  end if;
  if not (
    current_status = new_status
    or (current_status='draft' and new_status in ('review','archived'))
    or (current_status='review' and new_status in ('draft','published','archived'))
    or (current_status='published' and new_status in ('review','archived'))
    or (current_status='archived' and new_status='draft')
  ) then raise exception 'invalid route status transition'; end if;
  update public.routes set status=new_status,updated_at=now() where id=target_route_id;
end;
$$;
revoke all on function private.admin_set_route_status(uuid,text,uuid) from public;
grant execute on function private.admin_set_route_status(uuid,text,uuid) to authenticated;

create or replace function public.admin_set_route_status(target_route_id uuid, new_status text)
returns void language sql security invoker set search_path=''
as $$ select private.admin_set_route_status(target_route_id,new_status,auth.uid()); $$;
revoke all on function public.admin_set_route_status(uuid,text) from public;
grant execute on function public.admin_set_route_status(uuid,text) to authenticated;

create or replace function private.admin_save_route_geometry(target_route_id uuid, geometry_wkt text, actor uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare geometry_version integer; geom extensions.geometry;
begin
  if not private.admin_has_capability('routes.manage',actor) then raise exception 'not authorized'; end if;
  select current_geometry_version into geometry_version from public.routes where id=target_route_id for update;
  if geometry_version is null then raise exception 'route not found'; end if;
  geom := extensions.st_geomfromewkt(geometry_wkt);
  if extensions.geometrytype(geom) <> 'LINESTRING' then raise exception 'geometry must be a LineString'; end if;
  if extensions.st_srid(geom) <> 4326 then raise exception 'geometry SRID must be 4326'; end if;
  if extensions.st_npoints(geom) < 2 then raise exception 'geometry requires at least two points'; end if;
  insert into public.route_geometries(route_id,version,geometry,start_point)
  values(target_route_id,geometry_version,geom,extensions.st_startpoint(geom))
  on conflict(route_id,version) do update set geometry=excluded.geometry,start_point=excluded.start_point,created_at=now();
  return geometry_version;
end;
$$;
revoke all on function private.admin_save_route_geometry(uuid,text,uuid) from public;
grant execute on function private.admin_save_route_geometry(uuid,text,uuid) to authenticated;

create or replace function public.admin_save_route_geometry(target_route_id uuid, geometry_wkt text)
returns integer language sql security invoker set search_path=''
as $$ select private.admin_save_route_geometry(target_route_id,geometry_wkt,auth.uid()); $$;
revoke all on function public.admin_save_route_geometry(uuid,text) from public;
grant execute on function public.admin_save_route_geometry(uuid,text) to authenticated;

create or replace function private.cancel_reward_redemption(target_redemption_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare rr public.reward_redemptions%rowtype;
begin
  select * into rr from public.reward_redemptions where id=target_redemption_id for update;
  if rr.id is null then raise exception 'redemption not found'; end if;
  if rr.status <> 'reserved' then raise exception 'redemption is not cancellable'; end if;
  if rr.user_id <> actor and not private.admin_partner_allowed(rr.partner_id,'redemptions.manage',actor) then raise exception 'not authorized'; end if;
  update public.reward_redemptions set status='cancelled',cancelled_at=now() where id=rr.id;
  update public.rewards set stock=stock+1,updated_at=now() where id=rr.reward_id;
  insert into public.olive_transactions(user_id,amount,reason,source_type,source_id,actor_user_id)
  values(rr.user_id,rr.olive_cost,'Devolución por cancelación de premio','reward_refund',rr.id::text,actor);
  perform private.write_admin_audit('reward.cancel','reward_redemptions',rr.id::text,to_jsonb(rr),jsonb_build_object('status','cancelled'),actor);
end;
$$;
revoke all on function private.cancel_reward_redemption(uuid,uuid) from public;
grant execute on function private.cancel_reward_redemption(uuid,uuid) to authenticated;
create or replace function public.cancel_reward_redemption(redemption_id uuid)
returns void language sql security invoker set search_path=''
as $$ select private.cancel_reward_redemption(redemption_id,auth.uid()); $$;
revoke all on function public.cancel_reward_redemption(uuid) from public;
grant execute on function public.cancel_reward_redemption(uuid) to authenticated;

create or replace function private.expire_reward_redemptions(actor uuid default auth.uid())
returns integer
language plpgsql
security definer
set search_path=''
as $$
declare rr public.reward_redemptions%rowtype; affected integer := 0;
begin
  if not private.admin_has_capability('redemptions.manage',actor) then raise exception 'not authorized'; end if;
  for rr in
    select * from public.reward_redemptions
    where status='reserved' and expires_at <= now()
    order by expires_at
    for update skip locked
  loop
    if private.admin_partner_allowed(rr.partner_id,'redemptions.manage',actor) then
      update public.reward_redemptions set status='expired',cancelled_at=now() where id=rr.id;
      update public.rewards set stock=stock+1,updated_at=now() where id=rr.reward_id;
      insert into public.olive_transactions(user_id,amount,reason,source_type,source_id,actor_user_id)
      values(rr.user_id,rr.olive_cost,'Devolución por caducidad de reserva','reward_refund',rr.id::text,actor);
      perform private.write_admin_audit('reward.expire','reward_redemptions',rr.id::text,to_jsonb(rr),jsonb_build_object('status','expired'),actor);
      affected := affected + 1;
    end if;
  end loop;
  return affected;
end;
$$;
revoke all on function private.expire_reward_redemptions(uuid) from public;
grant execute on function private.expire_reward_redemptions(uuid) to authenticated;
create or replace function public.expire_reward_redemptions()
returns integer language sql security invoker set search_path=''
as $$ select private.expire_reward_redemptions(auth.uid()); $$;
revoke all on function public.expire_reward_redemptions() from public;
grant execute on function public.expire_reward_redemptions() to authenticated;

create or replace function private.admin_resolve_report(target_report_id uuid, new_status text, resolution_text text, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('moderation.manage',actor) then raise exception 'not authorized'; end if;
  if new_status not in ('resolved','dismissed') then raise exception 'invalid report resolution status'; end if;
  update public.moderation_reports
     set status=new_status,resolution=resolution_text,resolved_by=actor,resolved_at=now()
   where id=target_report_id and status in ('open','reviewing');
  if not found then raise exception 'report not found or already closed'; end if;
end;
$$;
revoke all on function private.admin_resolve_report(uuid,text,text,uuid) from public;
grant execute on function private.admin_resolve_report(uuid,text,text,uuid) to authenticated;
create or replace function public.admin_resolve_report(report_id uuid, new_status text, resolution text)
returns void language sql security invoker set search_path=''
as $$ select private.admin_resolve_report(report_id,new_status,resolution,auth.uid()); $$;
revoke all on function public.admin_resolve_report(uuid,text,text) from public;
grant execute on function public.admin_resolve_report(uuid,text,text) to authenticated;

create or replace function private.admin_publish_notification(target_notification_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('notifications.manage',actor) then raise exception 'not authorized'; end if;
  update public.admin_notifications set status='published',published_at=now() where id=target_notification_id and status='draft';
  if not found then raise exception 'notification not found or not draft'; end if;
end;
$$;
revoke all on function private.admin_publish_notification(uuid,uuid) from public;
grant execute on function private.admin_publish_notification(uuid,uuid) to authenticated;
create or replace function public.admin_publish_notification(notification_id uuid)
returns void language sql security invoker set search_path=''
as $$ select private.admin_publish_notification(notification_id,auth.uid()); $$;
revoke all on function public.admin_publish_notification(uuid) from public;
grant execute on function public.admin_publish_notification(uuid) to authenticated;

create or replace function private.admin_resolve_safety(target_incident_id uuid, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
begin
  if not private.admin_has_capability('safety.manage',actor) then raise exception 'not authorized'; end if;
  update public.route_safety_incidents set status='resolved',resolved_by=actor,resolved_at=now(),ends_at=coalesce(ends_at,now())
  where id=target_incident_id and status='open';
  if not found then raise exception 'incident not found or already closed'; end if;
end;
$$;
revoke all on function private.admin_resolve_safety(uuid,uuid) from public;
grant execute on function private.admin_resolve_safety(uuid,uuid) to authenticated;
create or replace function public.admin_resolve_safety(incident_id uuid)
returns void language sql security invoker set search_path=''
as $$ select private.admin_resolve_safety(incident_id,auth.uid()); $$;
revoke all on function public.admin_resolve_safety(uuid) from public;
grant execute on function public.admin_resolve_safety(uuid) to authenticated;

create or replace function private.admin_revoke_role(target_user_id uuid, target_role text, actor uuid default auth.uid())
returns void
language plpgsql
security definer
set search_path=''
as $$
declare super_admin_count integer;
begin
  if not private.admin_has_capability('admins.manage',actor) then raise exception 'not authorized'; end if;
  if target_role='super_admin' then
    select count(*) into super_admin_count from public.user_admin_roles where role_id='super_admin';
    if super_admin_count <= 1 then raise exception 'cannot revoke last super admin'; end if;
  end if;
  delete from public.user_admin_roles where user_id=target_user_id and role_id=target_role;
  if not found then raise exception 'role assignment not found'; end if;
  perform private.write_admin_audit('role.revoke','user_admin_roles',target_user_id::text,jsonb_build_object('role',target_role),null,actor);
end;
$$;
revoke all on function private.admin_revoke_role(uuid,text,uuid) from public;
grant execute on function private.admin_revoke_role(uuid,text,uuid) to authenticated;
create or replace function public.admin_revoke_role(target_user_id uuid, target_role text)
returns void language sql security invoker set search_path=''
as $$ select private.admin_revoke_role(target_user_id,target_role,auth.uid()); $$;
revoke all on function public.admin_revoke_role(uuid,text) from public;
grant execute on function public.admin_revoke_role(uuid,text) to authenticated;
