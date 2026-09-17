begin;

create extension if not exists pgtap with schema extensions;
select plan(13);

select has_function(
  'public',
  'expire_reward_reservations',
  array['timestamp with time zone', 'integer'],
  'expired reservation worker exists'
);

insert into auth.users (id)
values ('30000000-0000-4000-8000-000000000001');

insert into public.reward_partners (id, slug, name, active)
values (
  '30000000-0000-4000-8000-000000000010',
  'expiry-almazara',
  'Expiry Almazara',
  true
);

insert into public.reward_pickup_locations (id, partner_id, slug, name, active)
values (
  '30000000-0000-4000-8000-000000000011',
  '30000000-0000-4000-8000-000000000010',
  'expiry-shop',
  'Expiry Shop',
  true
);

insert into public.reward_catalog_items (
  id, partner_id, sku, name, reward_type, rarity, olive_cost,
  active, stock_mode, repeatable
) values (
  '30000000-0000-4000-8000-000000000012',
  '30000000-0000-4000-8000-000000000010',
  'expiry-aove-500',
  'Expiry AOVE 500 ml',
  'physical',
  'rare',
  3500,
  true,
  'tracked',
  true
);

insert into public.reward_inventory (
  id, reward_id, pickup_location_id, available_quantity, reserved_quantity
) values (
  '30000000-0000-4000-8000-000000000013',
  '30000000-0000-4000-8000-000000000012',
  '30000000-0000-4000-8000-000000000011',
  1,
  1
);

insert into public.olive_wallets (
  user_id, available, reserved, lifetime_granted, lifetime_spent
) values (
  '30000000-0000-4000-8000-000000000001',
  1500,
  3500,
  5000,
  0
);

insert into public.reward_reservations (
  id, user_id, reward_id, partner_id, pickup_location_id, status,
  olive_cost, idempotency_key, reserved_at, expires_at
) values (
  '30000000-0000-4000-8000-000000000020',
  '30000000-0000-4000-8000-000000000001',
  '30000000-0000-4000-8000-000000000012',
  '30000000-0000-4000-8000-000000000010',
  '30000000-0000-4000-8000-000000000011',
  'reserved',
  3500,
  'expiry-reserve-1',
  '2026-09-16T10:00:00Z',
  '2026-09-16T12:00:00Z'
);

insert into public.olive_ledger (
  user_id, movement_type, amount, source_key, reservation_id, occurred_at
) values (
  '30000000-0000-4000-8000-000000000001',
  'reserve',
  3500,
  'expiry-reservation:reserve',
  '30000000-0000-4000-8000-000000000020',
  '2026-09-16T10:00:00Z'
);

insert into public.reward_redemption_credentials (
  id, reservation_id, token_hash, status, issued_at, expires_at
) values (
  '30000000-0000-4000-8000-000000000021',
  '30000000-0000-4000-8000-000000000020',
  repeat('a', 64),
  'active',
  '2026-09-16T10:00:00Z',
  '2026-09-16T12:00:00Z'
);

select lives_ok(
  $$select public.expire_reward_reservations('2026-09-16T13:00:00Z'::timestamptz, 50)$$,
  'expiry worker releases a due reservation'
);

select is(
  (select status from public.reward_reservations where id = '30000000-0000-4000-8000-000000000020'),
  'expired',
  'due reservation becomes expired'
);
select is(
  (select available::text || ':' || reserved::text from public.olive_wallets where user_id = '30000000-0000-4000-8000-000000000001'),
  '5000:0',
  'expiry restores reserved olives to available balance'
);
select is(
  (select available_quantity::text || ':' || reserved_quantity::text from public.reward_inventory where id = '30000000-0000-4000-8000-000000000013'),
  '2:0',
  'expiry restores tracked inventory'
);
select is(
  (select status from public.reward_redemption_credentials where id = '30000000-0000-4000-8000-000000000021'),
  'expired',
  'expiry invalidates the active QR credential'
);
select is(
  (select count(*)::integer from public.olive_ledger where reservation_id = '30000000-0000-4000-8000-000000000020' and movement_type = 'release'),
  1,
  'expiry writes exactly one olive release movement'
);
select is(
  (select count(*)::integer from public.reward_audit_log where subject_id = '30000000-0000-4000-8000-000000000020' and action = 'reward.expire'),
  1,
  'expiry writes an audit event'
);

select lives_ok(
  $$select public.expire_reward_reservations('2026-09-16T14:00:00Z'::timestamptz, 50)$$,
  'running the expiry worker again is safe'
);
select is(
  (select available::text || ':' || reserved::text from public.olive_wallets where user_id = '30000000-0000-4000-8000-000000000001'),
  '5000:0',
  'expiry replay never releases olives twice'
);
select is(
  (select available_quantity::text || ':' || reserved_quantity::text from public.reward_inventory where id = '30000000-0000-4000-8000-000000000013'),
  '2:0',
  'expiry replay never releases stock twice'
);
select is(
  (select count(*)::integer from public.olive_ledger where reservation_id = '30000000-0000-4000-8000-000000000020' and movement_type = 'release'),
  1,
  'expiry replay does not duplicate ledger entries'
);
select is(
  (select count(*)::integer from public.reward_audit_log where subject_id = '30000000-0000-4000-8000-000000000020' and action = 'reward.expire'),
  1,
  'expiry replay does not duplicate audit events'
);

select * from finish();
rollback;
