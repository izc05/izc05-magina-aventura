begin;

create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('public', 'activities', 'activities exists');
select has_table('public', 'activity_track_batches', 'activity_track_batches exists');
select has_column('public', 'activities', 'geometry_version', 'activities pins geometry_version');
select has_column('public', 'activity_track_batches', 'idempotency_key', 'track batches expose idempotency_key');
select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'activity_track_batches'
      and indexdef ilike '%unique%'
      and indexdef ilike '%activity_id%'
      and indexdef ilike '%idempotency_key%'
  ),
  'track batches enforce idempotency per activity'
);
select ok(
  coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.activities')), false),
  'RLS enabled on activities'
);
select ok(
  coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.activity_track_batches')), false),
  'RLS enabled on activity_track_batches'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activities' and policyname = 'owners can read activities'),
  'activities owner read policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activities' and policyname = 'owners can insert activities'),
  'activities owner insert policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activity_track_batches' and policyname = 'owners can read activity track batches'),
  'track owner read policy exists'
);
select ok(
  exists (select 1 from pg_policies where schemaname = 'public' and tablename = 'activity_track_batches' and policyname = 'owners can insert activity track batches'),
  'track owner insert policy exists'
);
select ok(
  not has_table_privilege('anon', 'public.activities', 'SELECT'),
  'anonymous users cannot select activities'
);
select ok(
  not has_table_privilege('anon', 'public.activity_track_batches', 'SELECT'),
  'anonymous users cannot select raw tracks'
);
select ok(
  has_table_privilege('authenticated', 'public.activity_track_batches', 'INSERT'),
  'authenticated users may submit private track batches through RLS'
);

select * from finish();
rollback;
