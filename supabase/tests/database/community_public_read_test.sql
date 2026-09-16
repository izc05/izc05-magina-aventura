begin;

create extension if not exists pgtap with schema extensions;
select plan(10);

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('71111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'public-reader-author@example.test', '{}'::jsonb, now(), now()),
  ('72222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'public-reader-owner@example.test', '{}'::jsonb, now(), now());

update public.routes
set status = 'published'
where id = '00000000-0000-4000-8000-000000000002';

insert into public.community_staff_members (user_id, role, created_by)
values ('72222222-2222-4222-8222-222222222222', 'owner', null);

insert into public.community_photos (
  id, route_id, user_id, object_key, moderation_status, location
) values
  (
    '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '00000000-0000-4000-8000-000000000002',
    '71111111-1111-4111-8111-111111111111',
    'community/public/approved.jpg',
    'approved',
    extensions.st_setsrid(extensions.st_makepoint(-3.45, 37.95), 4326)
  ),
  (
    '7aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '00000000-0000-4000-8000-000000000002',
    '71111111-1111-4111-8111-111111111111',
    'community/public/pending.jpg',
    'pending',
    extensions.st_setsrid(extensions.st_makepoint(-3.46, 37.96), 4326)
  );

insert into public.route_comments (id, route_id, user_id, body)
values (
  '7bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  '00000000-0000-4000-8000-000000000002',
  '71111111-1111-4111-8111-111111111111',
  'Comentario público real'
);

insert into public.route_reviews (id, route_id, user_id, rating, body)
values (
  '7ccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  '00000000-0000-4000-8000-000000000002',
  '71111111-1111-4111-8111-111111111111',
  5,
  'Reseña pública real'
);

insert into public.route_incidents (
  id, route_id, user_id, category, description, position
) values (
  '7ddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  '00000000-0000-4000-8000-000000000002',
  '71111111-1111-4111-8111-111111111111',
  'fallen_tree',
  'Árbol caído comunicado por la comunidad',
  extensions.st_setsrid(extensions.st_makepoint(-3.47, 37.97), 4326)
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '72222222-2222-4222-8222-222222222222', true);
select public.moderate_route_incident(
  '7ddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  'confirm',
  'Confirmada para contrato público'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role anon;

select ok(
  has_table_privilege('anon', 'public.community_photos_public', 'SELECT'),
  'anonymous role can select the safe photo view'
);

select is(
  (select count(*) from public.community_photos_public where route_id = '00000000-0000-4000-8000-000000000002'),
  1::bigint,
  'anonymous photo view exposes only approved public photos'
);

select is(
  (select count(id) from public.community_photos where route_id = '00000000-0000-4000-8000-000000000002'),
  1::bigint,
  'RLS hides pending photos from anonymous base-table reads'
);

select ok(
  not has_column_privilege('anon', 'public.community_photos', 'location', 'SELECT'),
  'anonymous role cannot select exact photo geometry'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'community_photos_public'
      and column_name = 'location'
  ),
  'public photo view has no raw location column'
);

select is(
  (select count(*) from public.route_comments where route_id = '00000000-0000-4000-8000-000000000002'),
  1::bigint,
  'anonymous role can read approved route comments'
);

select is(
  (select count(*) from public.route_reviews where route_id = '00000000-0000-4000-8000-000000000002'),
  1::bigint,
  'anonymous role can read approved route reviews'
);

select is(
  (select count(*) from public.route_incidents_public where route_id = '00000000-0000-4000-8000-000000000002'),
  1::bigint,
  'anonymous role can read confirmed community incidents'
);

select ok(
  not has_column_privilege('anon', 'public.route_incidents', 'position', 'SELECT'),
  'anonymous role cannot select exact incident geometry'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'route_incidents_public'
      and column_name = 'position'
  ),
  'public incident view has no raw position column'
);

select * from finish();
rollback;
