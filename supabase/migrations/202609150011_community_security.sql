create or replace function public.has_community_staff_role(
  required_roles public.community_staff_role[]
)
returns boolean
language sql
stable
security definer
set search_path = public, auth, pg_temp
as $$
  select auth.uid() is not null
    and exists (
      select 1
      from public.community_staff_members member
      where member.user_id = auth.uid()
        and member.role = any(required_roles)
    );
$$;

revoke all on function public.has_community_staff_role(public.community_staff_role[]) from public;
grant execute on function public.has_community_staff_role(public.community_staff_role[]) to authenticated;

alter table public.community_staff_members enable row level security;
alter table public.community_photos enable row level security;
alter table public.route_comments enable row level security;
alter table public.route_reviews enable row level security;
alter table public.route_incidents enable row level security;
alter table public.community_reports enable row level security;
alter table public.moderation_actions enable row level security;

-- Staff directory: users can see their own role; only owners can manage staff.
create policy community_staff_members_select
on public.community_staff_members
for select
to authenticated
using (
  user_id = auth.uid()
  or public.has_community_staff_role(array['owner']::public.community_staff_role[])
);

create policy community_staff_members_insert_owner
on public.community_staff_members
for insert
to authenticated
with check (
  public.has_community_staff_role(array['owner']::public.community_staff_role[])
);

create policy community_staff_members_update_owner
on public.community_staff_members
for update
to authenticated
using (
  public.has_community_staff_role(array['owner']::public.community_staff_role[])
)
with check (
  public.has_community_staff_role(array['owner']::public.community_staff_role[])
);

create policy community_staff_members_delete_owner
on public.community_staff_members
for delete
to authenticated
using (
  public.has_community_staff_role(array['owner']::public.community_staff_role[])
);

-- Photos: owners can work on their own records. Staff moderation is performed
-- through audited security-definer RPCs added by the next migration.
create policy community_photos_select
on public.community_photos
for select
to anon, authenticated
using (
  user_id = auth.uid()
  or public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  )
  or (
    moderation_status = 'approved'
    and deleted_at is null
    and exists (
      select 1
      from public.routes route
      where route.id = community_photos.route_id
        and route.status = 'published'
    )
  )
);

create policy community_photos_insert_own
on public.community_photos
for insert
to authenticated
with check (user_id = auth.uid());

create policy community_photos_update_own
on public.community_photos
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy route_comments_select
on public.route_comments
for select
to anon, authenticated
using (
  user_id = auth.uid()
  or public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  )
  or (
    moderation_status = 'approved'
    and deleted_at is null
    and exists (
      select 1
      from public.routes route
      where route.id = route_comments.route_id
        and route.status = 'published'
    )
  )
);

create policy route_comments_insert_own
on public.route_comments
for insert
to authenticated
with check (user_id = auth.uid());

create policy route_comments_update_own
on public.route_comments
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy route_reviews_select
on public.route_reviews
for select
to anon, authenticated
using (
  user_id = auth.uid()
  or public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  )
  or (
    moderation_status = 'approved'
    and deleted_at is null
    and exists (
      select 1
      from public.routes route
      where route.id = route_reviews.route_id
        and route.status = 'published'
    )
  )
);

create policy route_reviews_insert_own
on public.route_reviews
for insert
to authenticated
with check (user_id = auth.uid());

create policy route_reviews_update_own
on public.route_reviews
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy route_incidents_select
on public.route_incidents
for select
to anon, authenticated
using (
  user_id = auth.uid()
  or public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  )
  or (
    status in ('confirmed','resolved')
    and deleted_at is null
    and exists (
      select 1
      from public.routes route
      where route.id = route_incidents.route_id
        and route.status = 'published'
    )
  )
);

create policy route_incidents_insert_own
on public.route_incidents
for insert
to authenticated
with check (user_id = auth.uid());

create policy route_incidents_update_own
on public.route_incidents
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy community_reports_select
on public.community_reports
for select
to authenticated
using (
  reporter_user_id = auth.uid()
  or public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  )
);

create policy community_reports_insert_own
on public.community_reports
for insert
to authenticated
with check (
  reporter_user_id = auth.uid()
  and status = 'open'
  and resolved_at is null
);

create policy moderation_actions_select_staff
on public.moderation_actions
for select
to authenticated
using (
  public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  )
);

-- Exact photo/incident geometry must not be available from ordinary REST
-- table reads. Safe views and safe column grants remain usable.
revoke select on public.community_photos from anon, authenticated;
grant select (
  id,
  route_id,
  user_id,
  discovery_id,
  activity_external_id,
  object_provider,
  object_key,
  caption,
  taken_at,
  location_visibility,
  moderation_status,
  featured,
  created_at,
  updated_at,
  deleted_at
) on public.community_photos to authenticated;
grant select (
  id,
  route_id,
  user_id,
  discovery_id,
  object_provider,
  object_key,
  caption,
  taken_at,
  location_visibility,
  featured,
  created_at,
  updated_at
) on public.community_photos to anon;

revoke select on public.route_incidents from anon, authenticated;
grant select (
  id,
  route_id,
  user_id,
  category,
  description,
  photo_id,
  status,
  created_at,
  updated_at,
  resolved_at,
  deleted_at
) on public.route_incidents to authenticated;
grant select (
  id,
  route_id,
  user_id,
  category,
  description,
  photo_id,
  status,
  created_at,
  updated_at,
  resolved_at
) on public.route_incidents to anon;

create or replace function public.guard_community_photo_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  is_staff boolean := public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  );
begin
  if tg_op = 'INSERT' then
    if not is_staff and (
      new.moderation_status <> 'pending'
      or new.featured
      or new.deleted_at is not null
    ) then
      raise exception 'community photo moderation fields are staff-controlled'
        using errcode = '42501';
    end if;

    new.updated_at := now();
    return new;
  end if;

  if not is_staff then
    if new.moderation_status is distinct from old.moderation_status
      or new.featured is distinct from old.featured then
      raise exception 'community photo moderation fields are staff-controlled'
        using errcode = '42501';
    end if;

    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'deleted community photos can only be restored by staff'
        using errcode = '42501';
    end if;

    if old.deleted_at is null and new.deleted_at is not null then
      new.moderation_status := 'deleted';
      new.featured := false;
    end if;
  else
    if new.moderation_status = 'deleted' then
      new.deleted_at := coalesce(new.deleted_at, now());
      new.featured := false;
    elsif old.moderation_status = 'deleted'
      and new.moderation_status <> 'deleted' then
      new.deleted_at := null;
    end if;

    if new.moderation_status <> 'approved' then
      new.featured := false;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger community_photos_guard_write
before insert or update on public.community_photos
for each row
execute function public.guard_community_photo_write();

create or replace function public.guard_route_comment_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  is_staff boolean := public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  );
begin
  if tg_op = 'INSERT' then
    if not is_staff and (
      new.moderation_status <> 'approved'
      or new.deleted_at is not null
    ) then
      raise exception 'route comment moderation fields are staff-controlled'
        using errcode = '42501';
    end if;

    new.updated_at := now();
    return new;
  end if;

  if not is_staff then
    if new.moderation_status is distinct from old.moderation_status then
      raise exception 'route comment moderation fields are staff-controlled'
        using errcode = '42501';
    end if;

    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'deleted route comments can only be restored by staff'
        using errcode = '42501';
    end if;

    if old.deleted_at is null and new.deleted_at is not null then
      new.moderation_status := 'deleted';
    end if;
  else
    if new.moderation_status = 'deleted' then
      new.deleted_at := coalesce(new.deleted_at, now());
    elsif old.moderation_status = 'deleted'
      and new.moderation_status <> 'deleted' then
      new.deleted_at := null;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger route_comments_guard_write
before insert or update on public.route_comments
for each row
execute function public.guard_route_comment_write();

create or replace function public.guard_route_review_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  is_staff boolean := public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  );
begin
  if tg_op = 'INSERT' then
    if not is_staff and (
      new.moderation_status <> 'approved'
      or new.deleted_at is not null
    ) then
      raise exception 'route review moderation fields are staff-controlled'
        using errcode = '42501';
    end if;

    new.updated_at := now();
    return new;
  end if;

  if not is_staff then
    if new.moderation_status is distinct from old.moderation_status then
      raise exception 'route review moderation fields are staff-controlled'
        using errcode = '42501';
    end if;

    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'deleted route reviews can only be restored by staff'
        using errcode = '42501';
    end if;

    if old.deleted_at is null and new.deleted_at is not null then
      new.moderation_status := 'deleted';
    end if;
  else
    if new.moderation_status = 'deleted' then
      new.deleted_at := coalesce(new.deleted_at, now());
    elsif old.moderation_status = 'deleted'
      and new.moderation_status <> 'deleted' then
      new.deleted_at := null;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger route_reviews_guard_write
before insert or update on public.route_reviews
for each row
execute function public.guard_route_review_write();

create or replace function public.guard_route_incident_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  is_staff boolean := public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  );
begin
  if tg_op = 'INSERT' then
    if not is_staff and (
      new.status <> 'pending'
      or new.resolved_at is not null
      or new.deleted_at is not null
    ) then
      raise exception 'route incident status fields are staff-controlled'
        using errcode = '42501';
    end if;

    new.updated_at := now();
    return new;
  end if;

  if not is_staff then
    if new.status is distinct from old.status
      or new.resolved_at is distinct from old.resolved_at then
      raise exception 'route incident status fields are staff-controlled'
        using errcode = '42501';
    end if;

    if old.deleted_at is not null and new.deleted_at is null then
      raise exception 'deleted route incidents can only be restored by staff'
        using errcode = '42501';
    end if;

    if old.deleted_at is null and new.deleted_at is not null then
      new.status := 'deleted';
    end if;
  else
    if new.status = 'resolved' then
      new.resolved_at := coalesce(new.resolved_at, now());
      new.deleted_at := null;
    elsif new.status = 'deleted' then
      new.deleted_at := coalesce(new.deleted_at, now());
      new.resolved_at := null;
    else
      new.resolved_at := null;
      if old.status = 'deleted' and new.status <> 'deleted' then
        new.deleted_at := null;
      end if;
    end if;
  end if;

  new.updated_at := now();
  return new;
end;
$$;

create trigger route_incidents_guard_write
before insert or update on public.route_incidents
for each row
execute function public.guard_route_incident_write();

create or replace function public.validate_community_report_target()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  target_exists boolean := false;
begin
  case new.target_type
    when 'photo' then
      select exists (
        select 1 from public.community_photos where id = new.target_id
      ) into target_exists;
    when 'comment' then
      select exists (
        select 1 from public.route_comments where id = new.target_id
      ) into target_exists;
    when 'review' then
      select exists (
        select 1 from public.route_reviews where id = new.target_id
      ) into target_exists;
    when 'incident' then
      select exists (
        select 1 from public.route_incidents where id = new.target_id
      ) into target_exists;
    else
      target_exists := false;
  end case;

  if not target_exists then
    raise exception 'community report target does not exist'
      using errcode = '23503';
  end if;

  return new;
end;
$$;

create trigger community_reports_validate_target
before insert or update of target_type, target_id on public.community_reports
for each row
execute function public.validate_community_report_target();

create or replace function public.guard_community_report_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  is_staff boolean := public.has_community_staff_role(
    array['owner','admin','moderator']::public.community_staff_role[]
  );
begin
  if tg_op = 'INSERT' then
    if not is_staff and (
      new.status <> 'open'
      or new.resolved_at is not null
    ) then
      raise exception 'community report status is staff-controlled'
        using errcode = '42501';
    end if;
    return new;
  end if;

  if not is_staff and (
    new.status is distinct from old.status
    or new.resolved_at is distinct from old.resolved_at
  ) then
    raise exception 'community report status is staff-controlled'
      using errcode = '42501';
  end if;

  if is_staff then
    if new.status in ('resolved','dismissed') then
      new.resolved_at := coalesce(new.resolved_at, now());
    else
      new.resolved_at := null;
    end if;
  end if;

  return new;
end;
$$;

create trigger community_reports_guard_write
before insert or update on public.community_reports
for each row
execute function public.guard_community_report_write();
