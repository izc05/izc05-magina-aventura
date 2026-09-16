create table public.activities (
  id uuid primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  route_id uuid not null references public.routes(id),
  geometry_version integer not null check (geometry_version > 0),
  state text not null check (state in ('FINISHED', 'VALIDATING', 'VERIFIED', 'REJECTED')),
  started_at timestamptz not null,
  paused_at timestamptz,
  finished_at timestamptz,
  algorithm_version integer not null default 1 check (algorithm_version > 0),
  summary jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id)
);

create table public.activity_track_batches (
  id uuid primary key default gen_random_uuid(),
  activity_id uuid not null,
  user_id uuid not null references auth.users(id) on delete cascade,
  sequence_start integer not null check (sequence_start > 0),
  sequence_end integer not null check (sequence_end >= sequence_start),
  idempotency_key text not null,
  samples jsonb not null,
  snapshot jsonb,
  created_at timestamptz not null default now(),
  unique (activity_id, idempotency_key),
  foreign key (activity_id, user_id)
    references public.activities(id, user_id)
    on delete cascade
);

create index activities_user_started_idx
  on public.activities(user_id, started_at desc);

create index activity_track_batches_activity_sequence_idx
  on public.activity_track_batches(activity_id, sequence_start);

alter table public.activities enable row level security;
alter table public.activity_track_batches enable row level security;

create policy "owners can read activities"
  on public.activities
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owners can insert activities"
  on public.activities
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and state = 'FINISHED'
  );

create policy "owners can read activity track batches"
  on public.activity_track_batches
  for select
  to authenticated
  using (auth.uid() = user_id);

create policy "owners can insert activity track batches"
  on public.activity_track_batches
  for insert
  to authenticated
  with check (
    auth.uid() = user_id
    and exists (
      select 1
      from public.activities a
      where a.id = activity_track_batches.activity_id
        and a.user_id = auth.uid()
    )
  );

revoke all on public.activities from anon, authenticated;
revoke all on public.activity_track_batches from anon, authenticated;

grant select, insert on public.activities to authenticated;
grant select, insert on public.activity_track_batches to authenticated;
