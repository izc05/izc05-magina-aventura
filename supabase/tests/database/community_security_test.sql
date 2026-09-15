begin;

create extension if not exists pgtap with schema extensions;
select plan(19);

-- Test-only dynamic wrapper: a missing production helper becomes a failed
-- assertion instead of aborting the whole RED run.
create function public._test_has_community_staff_role(required_roles text[], expected boolean)
returns boolean
language plpgsql
as $$
declare
  actual boolean;
begin
  begin
    execute 'select public.has_community_staff_role($1::public.community_staff_role[])'
      into actual
      using required_roles;
  exception
    when undefined_function then
      return false;
  end;

  return actual is not distinct from expected;
end;
$$;

-- Execute UPDATE ... RETURNING as a top-level dynamic statement so row-count
-- assertions work without invalid nested data-modifying CTEs.
create function public._test_community_exec_count(statement text)
returns bigint
language plpgsql
as $$
declare
  result bigint;
begin
  execute format('with changed as (%s) select count(*) from changed', statement)
    into result;
  return result;
end;
$$;

-- RLS must protect every community table.
select ok((select relrowsecurity from pg_class where oid = 'public.community_staff_members'::regclass), 'RLS enabled on staff members');
select ok((select relrowsecurity from pg_class where oid = 'public.community_photos'::regclass), 'RLS enabled on community photos');
select ok((select relrowsecurity from pg_class where oid = 'public.route_comments'::regclass), 'RLS enabled on route comments');
select ok((select relrowsecurity from pg_class where oid = 'public.route_reviews'::regclass), 'RLS enabled on route reviews');
select ok((select relrowsecurity from pg_class where oid = 'public.route_incidents'::regclass), 'RLS enabled on route incidents');
select ok((select relrowsecurity from pg_class where oid = 'public.community_reports'::regclass), 'RLS enabled on community reports');
select ok((select relrowsecurity from pg_class where oid = 'public.moderation_actions'::regclass), 'RLS enabled on moderation actions');
select ok(to_regprocedure('public.has_community_staff_role(public.community_staff_role[])') is not null, 'staff role helper exists');

-- Fixture users. The existing auth trigger creates their profiles automatically.
insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'community-a@example.test', '{}'::jsonb, now(), now()),
  ('22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'community-b@example.test', '{}'::jsonb, now(), now()),
  ('33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'community-mod@example.test', '{}'::jsonb, now(), now()),
  ('44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'community-owner@example.test', '{}'::jsonb, now(), now()),
  ('55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'community-target@example.test', '{}'::jsonb, now(), now());

update public.routes
set status = 'published'
where id = '00000000-0000-4000-8000-000000000002';

insert into public.community_staff_members (user_id, role, created_by)
values
  ('33333333-3333-4333-8333-333333333333', 'moderator', '44444444-4444-4444-8444-444444444444'),
  ('44444444-4444-4444-8444-444444444444', 'owner', null);

insert into public.community_photos (
  id, route_id, user_id, object_key, moderation_status
) values
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
    '00000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'community/security/pending.jpg',
    'pending'
  ),
  (
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2',
    '00000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'community/security/approved.jpg',
    'approved'
  );

insert into public.route_comments (id, route_id, user_id, body)
values
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
    '00000000-0000-4000-8000-000000000002',
    '11111111-1111-4111-8111-111111111111',
    'Comentario propio'
  ),
  (
    'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2',
    '00000000-0000-4000-8000-000000000002',
    '22222222-2222-4222-8222-222222222222',
    'Comentario ajeno'
  );

set local role authenticated;
select set_config('request.jwt.claim.sub', '11111111-1111-4111-8111-111111111111', true);

select ok(
  public._test_has_community_staff_role(
    array['owner','admin','moderator']::text[],
    false
  ),
  'ordinary user has no community staff role'
);

select is(
  public._test_community_exec_count($sql$
    update public.route_comments
    set body = 'Intento de modificar contenido ajeno'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb2'
    returning id
  $sql$),
  0::bigint,
  'user A cannot update user B content'
);

select is(
  public._test_community_exec_count($sql$
    update public.route_comments
    set body = 'Comentario propio actualizado'
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
    returning id
  $sql$),
  1::bigint,
  'user can update own comment'
);

select is(
  public._test_community_exec_count($sql$
    update public.route_comments
    set deleted_at = now()
    where id = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'
    returning id
  $sql$),
  1::bigint,
  'user can soft-delete own comment'
);

select throws_ok(
  $$update public.community_photos
      set moderation_status = 'approved'
      where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'$$,
  '42501',
  null,
  'user cannot approve own pending photo'
);

select throws_ok(
  $$update public.community_photos
      set featured = true
      where id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa2'$$,
  '42501',
  null,
  'user cannot feature own approved photo'
);

select throws_ok(
  $$insert into public.community_staff_members (user_id, role, created_by)
      values (
        '55555555-5555-4555-8555-555555555555',
        'admin',
        '11111111-1111-4111-8111-111111111111'
      )$$,
  '42501',
  null,
  'ordinary user cannot grant staff role'
);

select throws_ok(
  $$insert into public.community_reports (
      reporter_user_id, target_type, target_id, reason
    ) values (
      '11111111-1111-4111-8111-111111111111',
      'photo',
      '99999999-9999-4999-8999-999999999999',
      'other'
    )$$,
  '23503',
  null,
  'report target must exist'
);

select set_config('request.jwt.claim.sub', '33333333-3333-4333-8333-333333333333', true);
select ok(
  public._test_has_community_staff_role(array['moderator']::text[], true),
  'moderator role is recognized'
);

select set_config('request.jwt.claim.sub', '44444444-4444-4444-8444-444444444444', true);
select ok(
  public._test_has_community_staff_role(array['owner']::text[], true),
  'owner role is recognized'
);

select lives_ok(
  $$insert into public.community_staff_members (user_id, role, created_by)
      values (
        '55555555-5555-4555-8555-555555555555',
        'admin',
        '44444444-4444-4444-8444-444444444444'
      )$$,
  'owner can grant a staff role'
);

select * from finish();
rollback;
