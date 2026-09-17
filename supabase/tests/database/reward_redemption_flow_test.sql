begin;

create extension if not exists pgtap with schema extensions;
select plan(47);

select has_function(
  'public',
  'credit_reward_olives',
  array['uuid', 'integer', 'text', 'timestamp with time zone', 'jsonb'],
  'trusted olive credit RPC exists'
);
select has_function(
  'public',
  'reserve_physical_reward',
  array['uuid', 'uuid', 'uuid', 'timestamp with time zone', 'text'],
  'physical reward reservation RPC exists'
);
select has_function(
  'public',
  'rotate_reward_redemption_token',
  array['uuid'],
  'QR token rotation RPC exists'
);
select has_function(
  'public',
  'validate_reward_redemption_token',
  array['text'],
  'partner QR validation RPC exists'
);
select has_function(
  'public',
  'confirm_reward_redemption',
  array['text', 'text'],
  'partner reward confirmation RPC exists'
);
select has_function(
  'public',
  'cancel_reward_reservation',
  array['uuid', 'text'],
  'reward cancellation RPC exists'
);

insert into auth.users (id) values
  ('20000000-0000-4000-8000-000000000001'),
  ('20000000-0000-4000-8000-000000000002'),
  ('20000000-0000-4000-8000-000000000003');

insert into public.reward_partners (id, slug, name, active)
values (
  '20000000-0000-4000-8000-000000000010',
  'almazara-test',
  'Almazara Test',
  true
);

insert into public.reward_partner_memberships (partner_id, user_id, role, active)
values (
  '20000000-0000-4000-8000-000000000010',
  '20000000-0000-4000-8000-000000000002',
  'operator',
  true
);

insert into public.reward_pickup_locations (
  id,
  partner_id,
  slug,
  name,
  active
) values (
  '20000000-0000-4000-8000-000000000011',
  '20000000-0000-4000-8000-000000000010',
  'tienda-test',
  'Tienda Test',
  true
);

insert into public.reward_catalog_items (
  id,
  partner_id,
  sku,
  name,
  reward_type,
  rarity,
  olive_cost,
  active,
  stock_mode,
  repeatable
) values (
  '20000000-0000-4000-8000-000000000012',
  '20000000-0000-4000-8000-000000000010',
  'aove-test-500',
  'Botella AOVE 500 ml',
  'physical',
  'rare',
  3500,
  true,
  'tracked',
  true
);

insert into public.reward_inventory (
  id,
  reward_id,
  pickup_location_id,
  available_quantity,
  reserved_quantity
) values (
  '20000000-0000-4000-8000-000000000013',
  '20000000-0000-4000-8000-000000000012',
  '20000000-0000-4000-8000-000000000011',
  2,
  0
);

select lives_ok(
  $$select public.credit_reward_olives(
    '20000000-0000-4000-8000-000000000001'::uuid,
    5000,
    'activity:test-1',
    '2026-09-16T18:00:00Z'::timestamptz,
    '{"activityId":"test-1"}'::jsonb
  )$$,
  'verified activity credits olives'
);
select is(
  (select available from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  5000,
  'olive credit increases available balance'
);
select is(
  (select lifetime_granted from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  5000,
  'olive credit increases lifetime granted'
);
select is(
  (select count(*)::integer from public.olive_ledger where source_key = 'activity:test-1'),
  1,
  'olive credit writes one immutable ledger row'
);
select lives_ok(
  $$select public.credit_reward_olives(
    '20000000-0000-4000-8000-000000000001'::uuid,
    5000,
    'activity:test-1',
    '2026-09-16T18:00:00Z'::timestamptz,
    '{"activityId":"test-1"}'::jsonb
  )$$,
  'replaying the same olive credit is idempotent'
);
select is(
  (select available from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  5000,
  'credit replay does not duplicate balance'
);
select is(
  (select count(*)::integer from public.olive_ledger where source_key = 'activity:test-1'),
  1,
  'credit replay does not duplicate ledger'
);

do $$
declare
  response jsonb;
begin
  response := public.reserve_physical_reward(
    '20000000-0000-4000-8000-000000000001'::uuid,
    '20000000-0000-4000-8000-000000000012'::uuid,
    '20000000-0000-4000-8000-000000000011'::uuid,
    '2099-09-18T18:00:00Z'::timestamptz,
    'reserve-test-1'
  );
  perform set_config('test.reward_reservation_1', response::text, true);
end;
$$;

select is(
  current_setting('test.reward_reservation_1')::jsonb->>'status',
  'reserved',
  'physical reward is reserved'
);
select ok(
  char_length(current_setting('test.reward_reservation_1')::jsonb->>'token') >= 32,
  'reservation returns a strong opaque QR token'
);
select is(
  (select available::text || ':' || reserved::text from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  '1500:3500',
  'reservation moves olives from available to reserved'
);
select is(
  (select available_quantity::text || ':' || reserved_quantity::text from public.reward_inventory where id = '20000000-0000-4000-8000-000000000013'),
  '1:1',
  'reservation atomically reserves one stock unit'
);
select is(
  (select count(*)::integer from public.reward_reservations where id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid),
  1,
  'reservation is persisted once'
);
select isnt(
  (select token_hash from public.reward_redemption_credentials where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid and status = 'active'),
  current_setting('test.reward_reservation_1')::jsonb->>'token',
  'raw QR token is never stored'
);
select is(
  (select char_length(token_hash) from public.reward_redemption_credentials where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid and status = 'active'),
  64,
  'stored QR credential is a SHA-256 hex hash'
);

do $$
declare
  response jsonb;
begin
  response := public.reserve_physical_reward(
    '20000000-0000-4000-8000-000000000001'::uuid,
    '20000000-0000-4000-8000-000000000012'::uuid,
    '20000000-0000-4000-8000-000000000011'::uuid,
    '2099-09-18T18:00:00Z'::timestamptz,
    'reserve-test-1'
  );
  perform set_config('test.reward_reservation_1_replay', response::text, true);
end;
$$;

select is(
  current_setting('test.reward_reservation_1_replay')::jsonb->>'reservationId',
  current_setting('test.reward_reservation_1')::jsonb->>'reservationId',
  'reservation replay returns the original reservation'
);
select isnt(
  current_setting('test.reward_reservation_1_replay')::jsonb->>'token',
  current_setting('test.reward_reservation_1')::jsonb->>'token',
  'reservation replay rotates the presentation token'
);
select is(
  (select count(*)::integer from public.reward_reservations where user_id = '20000000-0000-4000-8000-000000000001'),
  1,
  'reservation replay does not duplicate reservation rows'
);
select is(
  (select available::text || ':' || reserved::text from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  '1500:3500',
  'reservation replay does not reserve olives twice'
);
select is(
  (select available_quantity::text || ':' || reserved_quantity::text from public.reward_inventory where id = '20000000-0000-4000-8000-000000000013'),
  '1:1',
  'reservation replay does not reserve stock twice'
);
select is(
  (select count(*)::integer from public.reward_redemption_credentials where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid and status = 'active'),
  1,
  'only one QR credential remains active after rotation'
);

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';

select is(
  (public.validate_reward_redemption_token(current_setting('test.reward_reservation_1_replay')::jsonb->>'token')->>'valid')::boolean,
  true,
  'authorized almazara operator can validate QR'
);
select is(
  public.validate_reward_redemption_token(current_setting('test.reward_reservation_1_replay')::jsonb->>'token')->>'rewardId',
  '20000000-0000-4000-8000-000000000012',
  'QR validation returns the reserved reward identity'
);
select is(
  public.confirm_reward_redemption(
    current_setting('test.reward_reservation_1_replay')::jsonb->>'token',
    'redeem-test-1'
  )->>'status',
  'redeemed',
  'authorized operator confirms physical delivery'
);

reset role;

select is(
  (select available::text || ':' || reserved::text || ':' || lifetime_spent::text from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  '1500:0:3500',
  'delivery consumes reserved olives exactly once'
);
select is(
  (select available_quantity::text || ':' || reserved_quantity::text from public.reward_inventory where id = '20000000-0000-4000-8000-000000000013'),
  '1:0',
  'delivery finalizes reserved stock exactly once'
);
select is(
  (select status from public.reward_reservations where id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid),
  'redeemed',
  'delivery closes reservation as redeemed'
);
select is(
  (select count(*)::integer from public.reward_redemption_credentials where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid and status = 'consumed'),
  1,
  'delivered QR credential becomes consumed'
);
select is(
  (select count(*)::integer from public.reward_redemptions where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid),
  1,
  'delivery writes one immutable redemption record'
);
select is(
  (select count(*)::integer from public.olive_ledger where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid and movement_type = 'spend'),
  1,
  'delivery writes one spend movement'
);

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';

select is(
  public.confirm_reward_redemption(
    current_setting('test.reward_reservation_1_replay')::jsonb->>'token',
    'redeem-test-1'
  )->>'status',
  'already-redeemed',
  'replaying delivery is an idempotent no-op'
);

reset role;

select is(
  (select count(*)::integer from public.reward_redemptions where reservation_id = (current_setting('test.reward_reservation_1')::jsonb->>'reservationId')::uuid),
  1,
  'delivery replay never creates a second redemption'
);

select lives_ok(
  $$select public.credit_reward_olives(
    '20000000-0000-4000-8000-000000000001'::uuid,
    3500,
    'activity:test-2',
    '2026-09-16T19:00:00Z'::timestamptz,
    '{"activityId":"test-2"}'::jsonb
  )$$,
  'player can earn enough olives for another reservation'
);

do $$
declare
  response jsonb;
begin
  response := public.reserve_physical_reward(
    '20000000-0000-4000-8000-000000000001'::uuid,
    '20000000-0000-4000-8000-000000000012'::uuid,
    '20000000-0000-4000-8000-000000000011'::uuid,
    '2099-09-18T19:00:00Z'::timestamptz,
    'reserve-test-2'
  );
  perform set_config('test.reward_reservation_2', response::text, true);
end;
$$;

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000003';
set local request.jwt.claim.role = 'authenticated';

select is(
  (public.validate_reward_redemption_token(current_setting('test.reward_reservation_2')::jsonb->>'token')->>'valid')::boolean,
  false,
  'unrelated authenticated user cannot validate almazara QR'
);
select is(
  public.validate_reward_redemption_token(current_setting('test.reward_reservation_2')::jsonb->>'token')->>'reason',
  'not-authorized',
  'unauthorized validation does not leak reward details'
);

reset role;
set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000001';
set local request.jwt.claim.role = 'authenticated';

select is(
  public.cancel_reward_reservation(
    (current_setting('test.reward_reservation_2')::jsonb->>'reservationId')::uuid,
    'user-cancelled'
  )->>'status',
  'cancelled',
  'owner can cancel an active reservation'
);

reset role;

select is(
  (select available::text || ':' || reserved::text from public.olive_wallets where user_id = '20000000-0000-4000-8000-000000000001'),
  '5000:0',
  'cancellation releases reserved olives'
);
select is(
  (select available_quantity::text || ':' || reserved_quantity::text from public.reward_inventory where id = '20000000-0000-4000-8000-000000000013'),
  '1:0',
  'cancellation releases reserved stock'
);
select is(
  (select status from public.reward_reservations where id = (current_setting('test.reward_reservation_2')::jsonb->>'reservationId')::uuid),
  'cancelled',
  'cancelled reservation is terminal'
);
select is(
  (select count(*)::integer from public.reward_redemption_credentials where reservation_id = (current_setting('test.reward_reservation_2')::jsonb->>'reservationId')::uuid and status = 'active'),
  0,
  'cancellation revokes every active QR credential'
);

set local role authenticated;
set local request.jwt.claim.sub = '20000000-0000-4000-8000-000000000002';
set local request.jwt.claim.role = 'authenticated';

select is(
  (public.validate_reward_redemption_token(current_setting('test.reward_reservation_2')::jsonb->>'token')->>'valid')::boolean,
  false,
  'cancelled QR cannot be validated later'
);

reset role;

select is(
  (select count(*)::integer from public.olive_ledger where reservation_id = (current_setting('test.reward_reservation_2')::jsonb->>'reservationId')::uuid and movement_type = 'release'),
  1,
  'cancellation writes one release movement'
);

select * from finish();
rollback;
