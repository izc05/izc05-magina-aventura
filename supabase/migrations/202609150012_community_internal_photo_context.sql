create or replace function public.guard_community_photo_write()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_temp
as $$
declare
  is_staff boolean := auth.uid() is null
    or public.has_community_staff_role(
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
