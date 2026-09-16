create or replace function public.moderate_community_photo(
  p_photo_id uuid,
  p_action text,
  p_reason text default null
)
returns table(target_id uuid, resulting_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  normalized_action text := lower(trim(p_action));
  current_status text;
  next_status text;
  next_featured boolean;
begin
  if not public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  ) then
    raise exception 'community moderation requires staff role'
      using errcode = '42501';
  end if;

  select moderation_status, featured
  into current_status, next_featured
  from public.community_photos
  where id = p_photo_id
  for update;

  if not found then
    raise exception 'community photo does not exist'
      using errcode = 'P0002';
  end if;

  next_status := current_status;

  case normalized_action
    when 'approve' then
      next_status := 'approved';
      next_featured := false;
    when 'reject' then
      next_status := 'rejected';
      next_featured := false;
    when 'hide' then
      next_status := 'hidden';
      next_featured := false;
    when 'restore' then
      next_status := 'approved';
      next_featured := false;
    when 'delete' then
      next_status := 'deleted';
      next_featured := false;
    when 'feature' then
      if current_status <> 'approved' then
        raise exception 'only approved photos can be featured'
          using errcode = '22023';
      end if;
      next_featured := true;
    when 'unfeature' then
      next_featured := false;
    else
      raise exception 'unsupported photo moderation action: %', p_action
        using errcode = '22023';
  end case;

  update public.community_photos
  set moderation_status = next_status,
      featured = next_featured
  where id = p_photo_id;

  insert into public.moderation_actions (
    actor_user_id,
    target_type,
    target_id,
    action,
    reason
  ) values (
    auth.uid(),
    'photo',
    p_photo_id,
    normalized_action,
    p_reason
  );

  return query
  select p_photo_id, next_status;
end;
$$;

revoke all on function public.moderate_community_photo(uuid, text, text) from public;
grant execute on function public.moderate_community_photo(uuid, text, text) to authenticated;

create or replace function public.moderate_route_comment(
  p_comment_id uuid,
  p_action text,
  p_reason text default null
)
returns table(target_id uuid, resulting_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  normalized_action text := lower(trim(p_action));
  next_status text;
begin
  if not public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  ) then
    raise exception 'community moderation requires staff role'
      using errcode = '42501';
  end if;

  perform 1
  from public.route_comments
  where id = p_comment_id
  for update;

  if not found then
    raise exception 'route comment does not exist'
      using errcode = 'P0002';
  end if;

  case normalized_action
    when 'approve', 'restore' then next_status := 'approved';
    when 'hide' then next_status := 'hidden';
    when 'delete' then next_status := 'deleted';
    else
      raise exception 'unsupported comment moderation action: %', p_action
        using errcode = '22023';
  end case;

  update public.route_comments
  set moderation_status = next_status
  where id = p_comment_id;

  insert into public.moderation_actions (
    actor_user_id,
    target_type,
    target_id,
    action,
    reason
  ) values (
    auth.uid(),
    'comment',
    p_comment_id,
    normalized_action,
    p_reason
  );

  return query
  select p_comment_id, next_status;
end;
$$;

revoke all on function public.moderate_route_comment(uuid, text, text) from public;
grant execute on function public.moderate_route_comment(uuid, text, text) to authenticated;

create or replace function public.moderate_route_review(
  p_review_id uuid,
  p_action text,
  p_reason text default null
)
returns table(target_id uuid, resulting_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  normalized_action text := lower(trim(p_action));
  next_status text;
begin
  if not public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  ) then
    raise exception 'community moderation requires staff role'
      using errcode = '42501';
  end if;

  perform 1
  from public.route_reviews
  where id = p_review_id
  for update;

  if not found then
    raise exception 'route review does not exist'
      using errcode = 'P0002';
  end if;

  case normalized_action
    when 'approve', 'restore' then next_status := 'approved';
    when 'hide' then next_status := 'hidden';
    when 'delete' then next_status := 'deleted';
    else
      raise exception 'unsupported review moderation action: %', p_action
        using errcode = '22023';
  end case;

  update public.route_reviews
  set moderation_status = next_status
  where id = p_review_id;

  insert into public.moderation_actions (
    actor_user_id,
    target_type,
    target_id,
    action,
    reason
  ) values (
    auth.uid(),
    'review',
    p_review_id,
    normalized_action,
    p_reason
  );

  return query
  select p_review_id, next_status;
end;
$$;

revoke all on function public.moderate_route_review(uuid, text, text) from public;
grant execute on function public.moderate_route_review(uuid, text, text) to authenticated;

create or replace function public.moderate_route_incident(
  p_incident_id uuid,
  p_action text,
  p_reason text default null
)
returns table(target_id uuid, resulting_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  normalized_action text := lower(trim(p_action));
  next_status text;
begin
  if not public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  ) then
    raise exception 'community moderation requires staff role'
      using errcode = '42501';
  end if;

  perform 1
  from public.route_incidents
  where id = p_incident_id
  for update;

  if not found then
    raise exception 'route incident does not exist'
      using errcode = 'P0002';
  end if;

  case normalized_action
    when 'confirm' then next_status := 'confirmed';
    when 'dismiss' then next_status := 'dismissed';
    when 'resolve' then next_status := 'resolved';
    when 'restore' then next_status := 'pending';
    when 'delete' then next_status := 'deleted';
    else
      raise exception 'unsupported incident moderation action: %', p_action
        using errcode = '22023';
  end case;

  update public.route_incidents
  set status = next_status
  where id = p_incident_id;

  insert into public.moderation_actions (
    actor_user_id,
    target_type,
    target_id,
    action,
    reason
  ) values (
    auth.uid(),
    'incident',
    p_incident_id,
    normalized_action,
    p_reason
  );

  return query
  select p_incident_id, next_status;
end;
$$;

revoke all on function public.moderate_route_incident(uuid, text, text) from public;
grant execute on function public.moderate_route_incident(uuid, text, text) to authenticated;

create or replace function public.resolve_community_report(
  p_report_id uuid,
  p_resolution text,
  p_reason text default null
)
returns table(target_id uuid, resulting_status text)
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  normalized_resolution text := lower(trim(p_resolution));
  next_status text;
begin
  if not public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  ) then
    raise exception 'community moderation requires staff role'
      using errcode = '42501';
  end if;

  perform 1
  from public.community_reports
  where id = p_report_id
  for update;

  if not found then
    raise exception 'community report does not exist'
      using errcode = 'P0002';
  end if;

  case normalized_resolution
    when 'resolve' then next_status := 'resolved';
    when 'dismiss' then next_status := 'dismissed';
    else
      raise exception 'unsupported report resolution: %', p_resolution
        using errcode = '22023';
  end case;

  update public.community_reports
  set status = next_status
  where id = p_report_id;

  insert into public.moderation_actions (
    actor_user_id,
    target_type,
    target_id,
    action,
    reason
  ) values (
    auth.uid(),
    'report',
    p_report_id,
    normalized_resolution,
    p_reason
  );

  return query
  select p_report_id, next_status;
end;
$$;

revoke all on function public.resolve_community_report(uuid, text, text) from public;
grant execute on function public.resolve_community_report(uuid, text, text) to authenticated;

create or replace function public.set_community_staff_role(
  p_target_user_id uuid,
  p_new_role public.community_staff_role
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.has_community_staff_role(
    array['owner']::public.community_staff_role[]
  ) then
    raise exception 'community staff management requires owner role'
      using errcode = '42501';
  end if;

  insert into public.community_staff_members (
    user_id,
    role,
    created_by
  ) values (
    p_target_user_id,
    p_new_role,
    auth.uid()
  )
  on conflict (user_id) do update
  set role = excluded.role,
      created_by = auth.uid();

  return p_target_user_id;
end;
$$;

revoke all on function public.set_community_staff_role(uuid, public.community_staff_role) from public;
grant execute on function public.set_community_staff_role(uuid, public.community_staff_role) to authenticated;

create or replace function public.remove_community_staff_role(
  p_target_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
begin
  if not public.has_community_staff_role(
    array['owner']::public.community_staff_role[]
  ) then
    raise exception 'community staff management requires owner role'
      using errcode = '42501';
  end if;

  delete from public.community_staff_members
  where user_id = p_target_user_id;

  return p_target_user_id;
end;
$$;

revoke all on function public.remove_community_staff_role(uuid) from public;
grant execute on function public.remove_community_staff_role(uuid) to authenticated;
