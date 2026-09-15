begin;

create extension if not exists pgtap with schema extensions;
select plan(18);

select has_table('public', 'community_photos', 'community_photos exists');
select has_table('public', 'route_comments', 'route_comments exists');
select has_table('public', 'route_reviews', 'route_reviews exists');
select has_table('public', 'route_incidents', 'route_incidents exists');
select has_table('public', 'community_reports', 'community_reports exists');
select has_table('public', 'moderation_actions', 'moderation_actions exists');
select has_table('public', 'community_staff_members', 'community_staff_members exists');

select has_column('public', 'community_photos', 'object_key', 'photo object key exists');
select has_column('public', 'community_photos', 'activity_external_id', 'future activity link exists');
select has_column('public', 'route_incidents', 'position', 'internal incident position exists');
select has_column('public', 'moderation_actions', 'actor_user_id', 'audit actor exists');

select ok(
  to_regtype('public.community_staff_role') is not null,
  'community staff role enum exists'
);

select ok(
  to_regclass('public.community_photos_public') is not null,
  'public photo view exists'
);

select ok(
  to_regclass('public.route_incidents_public') is not null,
  'public incident view exists'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_photos_public'
      and column_name = 'location'
  ),
  'public photo view hides exact geometry'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'route_incidents_public'
      and column_name = 'position'
  ),
  'public incident view hides exact geometry'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'community_photos'
      and indexname = 'community_photos_object_key_uidx'
  ),
  'photo object key unique index exists'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'route_reviews'
      and indexname = 'route_reviews_active_user_route_uidx'
  ),
  'one active review index exists'
);

select * from finish();
rollback;
