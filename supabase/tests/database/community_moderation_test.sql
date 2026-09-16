begin;

create extension if not exists pgtap with schema extensions;
select plan(34);

create function public._test_moderation_exec_count(statement text)
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

select ok(to_regprocedure('public.moderate_community_photo(uuid,text,text)') is not null, 'photo moderation RPC exists');
select ok(to_regprocedure('public.moderate_route_comment(uuid,text,text)') is not null, 'comment moderation RPC exists');
select ok(to_regprocedure('public.moderate_route_review(uuid,text,text)') is not null, 'review moderation RPC exists');
select ok(to_regprocedure('public.moderate_route_incident(uuid,text,text)') is not null, 'incident moderation RPC exists');
select ok(to_regprocedure('public.resolve_community_report(uuid,text,text)') is not null, 'report moderation RPC exists');
select ok(to_regprocedure('public.set_community_staff_role(uuid,public.community_staff_role)') is not null, 'set staff role RPC exists');
select ok(to_regprocedure('public.remove_community_staff_role(uuid)') is not null, 'remove staff role RPC exists');

insert into auth.users (id, aud, role, email, raw_user_meta_data, created_at, updated_at)
values
  ('61111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated', 'mod-normal@example.test', '{}'::jsonb, now(), now()),
  ('62222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated', 'mod-moderator@example.test', '{}'::jsonb, now(), now()),
  ('63333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated', 'mod-admin@example.test', '{}'::jsonb, now(), now()),
  ('64444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated', 'mod-owner@example.test', '{}'::jsonb, now(), now()),
  ('65555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated', 'mod-target@example.test', '{}'::jsonb, now(), now());

update public.routes
set status = 'published'
where id = '00000000-0000-4000-8000-000000000002';

insert into public.community_staff_members (user_id, role, created_by)
values
  ('62222222-2222-4222-8222-222222222222', 'moderator', '64444444-4444-4444-8444-444444444444'),
  ('63333333-3333-4333-8333-333333333333', 'admin', '64444444-4444-4444-8444-444444444444'),
  ('64444444-4444-4444-8444-444444444444', 'owner', null);

insert into public.community_photos (
  id, route_id, user_id, object_key
) values (
  '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1',
  '00000000-0000-4000-8000-000000000002',
  '61111111-1111-4111-8111-111111111111',
  'community/moderation/pending.jpg'
);

insert into public.route_comments (id, route_id, user_id, body)
values (
  '6bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  '00000000-0000-4000-8000-000000000002',
  '61111111-1111-4111-8111-111111111111',
  'Comentario para moderar'
);

insert into public.route_reviews (id, route_id, user_id, rating, body)
values (
  '6ccccccc-cccc-4ccc-8ccc-ccccccccccc1',
  '00000000-0000-4000-8000-000000000002',
  '61111111-1111-4111-8111-111111111111',
  4,
  'Reseña para moderar'
);

insert into public.route_incidents (
  id, route_id, user_id, category, description
) values (
  '6ddddddd-dddd-4ddd-8ddd-ddddddddddd1',
  '00000000-0000-4000-8000-000000000002',
  '61111111-1111-4111-8111-111111111111',
  'fallen_tree',
  'Árbol caído en el sendero'
);

insert into public.community_reports (
  id, reporter_user_id, target_type, target_id, reason
) values (
  '6eeeeeee-eeee-4eee-8eee-eeeeeeeeeee1',
  '61111111-1111-4111-8111-111111111111',
  'comment',
  '6bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1',
  'other'
);

set local role authenticated;
select set_config('request.jwt.claim.sub', '61111111-1111-4111-8111-111111111111', true);

select throws_ok(
  $$select public.moderate_community_photo(
      '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'approve', 'No autorizado'
    )$$,
  '42501',
  null,
  'normal user cannot moderate a photo'
);

select throws_ok(
  $$select public.set_community_staff_role(
      '65555555-5555-4555-8555-555555555555', 'admin'::public.community_staff_role
    )$$,
  '42501',
  null,
  'normal user cannot grant staff role'
);

select set_config('request.jwt.claim.sub', '62222222-2222-4222-8222-222222222222', true);

select lives_ok(
  $$select public.moderate_community_photo(
      '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'approve', 'Contenido correcto'
    )$$,
  'moderator can approve a photo'
);
select is(
  (select moderation_status from public.community_photos where id = '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  'approved',
  'photo becomes approved'
);
select is(
  (select count(*) from public.moderation_actions where target_type = 'photo' and target_id = '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' and action = 'approve'),
  1::bigint,
  'photo approval writes one audit row'
);

select lives_ok(
  $$select public.moderate_community_photo(
      '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'feature', 'Foto destacada'
    )$$,
  'moderator can feature an approved photo'
);
select is(
  (select featured from public.community_photos where id = '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  true,
  'photo becomes featured'
);
select is(
  (select count(*) from public.moderation_actions where target_type = 'photo' and target_id = '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1' and action = 'feature'),
  1::bigint,
  'photo feature writes one audit row'
);

select lives_ok(
  $$select public.moderate_route_comment(
      '6bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1', 'hide', 'Ocultar comentario'
    )$$,
  'moderator can hide a comment'
);
select is(
  (select moderation_status from public.route_comments where id = '6bbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbb1'),
  'hidden',
  'comment becomes hidden'
);

select lives_ok(
  $$select public.moderate_route_review(
      '6ccccccc-cccc-4ccc-8ccc-ccccccccccc1', 'hide', 'Ocultar reseña'
    )$$,
  'moderator can hide a review'
);
select is(
  (select moderation_status from public.route_reviews where id = '6ccccccc-cccc-4ccc-8ccc-ccccccccccc1'),
  'hidden',
  'review becomes hidden'
);

select lives_ok(
  $$select public.moderate_route_incident(
      '6ddddddd-dddd-4ddd-8ddd-ddddddddddd1', 'confirm', 'Incidencia comprobada'
    )$$,
  'moderator can confirm an incident'
);
select is(
  (select status from public.route_incidents where id = '6ddddddd-dddd-4ddd-8ddd-ddddddddddd1'),
  'confirmed',
  'incident becomes confirmed'
);

select lives_ok(
  $$select public.resolve_community_report(
      '6eeeeeee-eeee-4eee-8eee-eeeeeeeeeee1', 'resolve', 'Reporte revisado'
    )$$,
  'moderator can resolve a report'
);
select is(
  (select status from public.community_reports where id = '6eeeeeee-eeee-4eee-8eee-eeeeeeeeeee1'),
  'resolved',
  'report becomes resolved'
);
select is(
  (select count(*) from public.moderation_actions where target_type = 'report' and target_id = '6eeeeeee-eeee-4eee-8eee-eeeeeeeeeee1' and action = 'resolve'),
  1::bigint,
  'report resolution writes one audit row'
);

select throws_ok(
  $$select public.set_community_staff_role(
      '65555555-5555-4555-8555-555555555555', 'admin'::public.community_staff_role
    )$$,
  '42501',
  null,
  'moderator cannot manage staff roles'
);

select set_config('request.jwt.claim.sub', '63333333-3333-4333-8333-333333333333', true);
select lives_ok(
  $$select public.moderate_community_photo(
      '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1', 'hide', 'Ocultada por admin'
    )$$,
  'admin can moderate content'
);
select is(
  (select moderation_status from public.community_photos where id = '6aaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaa1'),
  'hidden',
  'admin moderation changes photo state'
);
select throws_ok(
  $$select public.set_community_staff_role(
      '65555555-5555-4555-8555-555555555555', 'owner'::public.community_staff_role
    )$$,
  '42501',
  null,
  'admin cannot assign owner role'
);

select set_config('request.jwt.claim.sub', '64444444-4444-4444-8444-444444444444', true);
select lives_ok(
  $$select public.set_community_staff_role(
      '65555555-5555-4555-8555-555555555555', 'admin'::public.community_staff_role
    )$$,
  'owner can grant admin role'
);
select is(
  (select role::text from public.community_staff_members where user_id = '65555555-5555-4555-8555-555555555555'),
  'admin',
  'target receives admin role'
);
select lives_ok(
  $$select public.remove_community_staff_role(
      '65555555-5555-4555-8555-555555555555'
    )$$,
  'owner can remove non-owner staff role'
);
select is(
  (select count(*) from public.community_staff_members where user_id = '65555555-5555-4555-8555-555555555555'),
  0::bigint,
  'target staff role is removed'
);

select set_config('request.jwt.claim.sub', '62222222-2222-4222-8222-222222222222', true);
select is(
  public._test_moderation_exec_count($sql$
    update public.moderation_actions
    set reason = 'Manipulado'
    returning id
  $sql$),
  0::bigint,
  'moderation audit rows cannot be updated by authenticated staff'
);
select is(
  public._test_moderation_exec_count($sql$
    delete from public.moderation_actions
    returning id
  $sql$),
  0::bigint,
  'moderation audit rows cannot be deleted by authenticated staff'
);

select * from finish();
rollback;
