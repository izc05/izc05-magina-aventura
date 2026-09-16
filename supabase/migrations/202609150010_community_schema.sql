create type public.community_staff_role as enum ('owner', 'admin', 'moderator');

create table public.community_staff_members (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role public.community_staff_role not null,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

create table public.community_photos (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  discovery_id uuid references public.discoveries(id) on delete set null,
  activity_external_id uuid,
  object_provider text not null default 'r2' check (object_provider in ('r2')),
  object_key text not null,
  caption text check (caption is null or char_length(caption) <= 1000),
  taken_at timestamptz,
  location extensions.geometry(Point, 4326),
  location_visibility text not null default 'approximate'
    check (location_visibility in ('hidden', 'approximate')),
  moderation_status text not null default 'pending'
    check (moderation_status in ('pending', 'approved', 'hidden', 'rejected', 'deleted')),
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz,
  constraint community_photos_featured_requires_approved
    check (not featured or (moderation_status = 'approved' and deleted_at is null))
);

create unique index community_photos_object_key_uidx
  on public.community_photos (object_key);

create index community_photos_route_status_created_idx
  on public.community_photos (route_id, moderation_status, created_at desc);

create index community_photos_user_created_idx
  on public.community_photos (user_id, created_at desc);

create table public.route_comments (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  moderation_status text not null default 'approved'
    check (moderation_status in ('approved', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create index route_comments_route_status_created_idx
  on public.route_comments (route_id, moderation_status, created_at desc);

create table public.route_reviews (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  body text check (body is null or char_length(body) <= 3000),
  moderation_status text not null default 'approved'
    check (moderation_status in ('approved', 'hidden', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  deleted_at timestamptz
);

create unique index route_reviews_active_user_route_uidx
  on public.route_reviews (route_id, user_id)
  where deleted_at is null and moderation_status <> 'deleted';

create index route_reviews_route_status_idx
  on public.route_reviews (route_id, moderation_status);

create table public.route_incidents (
  id uuid primary key default gen_random_uuid(),
  route_id uuid not null references public.routes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  category text not null
    check (category in (
      'fallen_tree',
      'blocked_path',
      'landslide',
      'mud',
      'dry_water_source',
      'damaged_sign',
      'animal_risk',
      'other'
    )),
  description text not null check (char_length(description) between 1 and 2000),
  position extensions.geometry(Point, 4326),
  photo_id uuid references public.community_photos(id) on delete set null,
  status text not null default 'pending'
    check (status in ('pending', 'confirmed', 'dismissed', 'resolved', 'deleted')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  resolved_at timestamptz,
  deleted_at timestamptz
);

create index route_incidents_route_status_created_idx
  on public.route_incidents (route_id, status, created_at desc);

create table public.community_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('photo', 'comment', 'review', 'incident')),
  target_id uuid not null,
  reason text not null
    check (reason in ('spam', 'abuse', 'unsafe', 'privacy', 'copyright', 'not_route_related', 'other')),
  details text check (details is null or char_length(details) <= 2000),
  status text not null default 'open'
    check (status in ('open', 'reviewing', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_at timestamptz
);

create unique index community_reports_open_reporter_target_uidx
  on public.community_reports (reporter_user_id, target_type, target_id)
  where status in ('open', 'reviewing');

create index community_reports_status_created_idx
  on public.community_reports (status, created_at);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid not null references auth.users(id) on delete restrict,
  target_type text not null
    check (target_type in ('photo', 'comment', 'review', 'incident', 'report', 'user')),
  target_id uuid not null,
  action text not null
    check (action in (
      'approve',
      'reject',
      'hide',
      'restore',
      'delete',
      'feature',
      'unfeature',
      'confirm',
      'dismiss',
      'resolve',
      'warn',
      'suspend',
      'unsuspend'
    )),
  reason text check (reason is null or char_length(reason) <= 2000),
  created_at timestamptz not null default now()
);

create index moderation_actions_target_created_idx
  on public.moderation_actions (target_type, target_id, created_at desc);

create view public.community_photos_public
with (security_invoker = true)
as
select
  p.id,
  p.route_id,
  p.user_id,
  p.discovery_id,
  p.object_provider,
  p.object_key,
  p.caption,
  p.taken_at,
  p.location_visibility,
  p.featured,
  p.created_at,
  p.updated_at
from public.community_photos p
where p.moderation_status = 'approved'
  and p.deleted_at is null
  and exists (
    select 1
    from public.routes r
    where r.id = p.route_id
      and r.status = 'published'
  );

create view public.route_incidents_public
with (security_invoker = true)
as
select
  i.id,
  i.route_id,
  i.user_id,
  i.category,
  i.description,
  i.photo_id,
  i.status,
  i.created_at,
  i.updated_at,
  i.resolved_at
from public.route_incidents i
where i.status in ('confirmed', 'resolved')
  and i.deleted_at is null
  and exists (
    select 1
    from public.routes r
    where r.id = i.route_id
      and r.status = 'published'
  );
