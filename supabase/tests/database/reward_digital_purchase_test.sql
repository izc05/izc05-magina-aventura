begin;

create extension if not exists pgtap with schema extensions;
select plan(15);

select has_function(
  'public',
  'purchase_digital_reward',
  array['uuid', 'uuid', 'text'],
  'digital reward purchase RPC exists'
);

insert into auth.users (id)
values ('40000000-0000-4000-8000-000000000001');

insert into public.olive_wallets (
  user_id, available, reserved, lifetime_granted, lifetime_spent
) values (
  '40000000-0000-4000-8000-000000000001',
  2000,
  0,
  2000,
  0
);

insert into public.reward_catalog_items (
  id, sku, name, reward_type, rarity, olive_cost,
  active, stock_mode, repeatable, digital_asset_key
) values
  (
    '40000000-0000-4000-8000-000000000010',
    'olive-grove-dawn',
    'Amanecer entre Olivos',
    'digital',
    'rare',
    800,
    true,
    'unlimited',
    false,
    'background:olive-grove-dawn'
  ),
  (
    '40000000-0000-4000-8000-000000000011',
    'legendary-stone-wall',
    'Muro de Piedra Legendario',
    'digital',
    'legendary',
    5000,
    true,
    'unlimited',
    false,
    'scene:legendary-stone-wall'
  );

select lives_ok(
  $$select public.purchase_digital_reward(
    '40000000-0000-4000-8000-000000000001'::uuid,
    '40000000-0000-4000-8000-000000000010'::uuid,
    'purchase-digital-1'
  )$$,
  'player can buy an eligible digital reward'
);

select is(
  (select available::text || ':' || reserved::text || ':' || lifetime_spent::text from public.olive_wallets where user_id = '40000000-0000-4000-8000-000000000001'),
  '1200:0:800',
  'digital purchase spends available olives only'
);
select is(
  (select count(*)::integer from public.reward_entitlements where user_id = '40000000-0000-4000-8000-000000000001' and reward_id = '40000000-0000-4000-8000-000000000010'),
  1,
  'digital purchase grants one entitlement'
);
select is(
  (select count(*)::integer from public.olive_ledger where user_id = '40000000-0000-4000-8000-000000000001' and movement_type = 'spend'),
  1,
  'digital purchase writes one spend ledger row'
);
select is(
  (select count(*)::integer from public.reward_audit_log where actor_user_id = '40000000-0000-4000-8000-000000000001' and action = 'reward.digital-purchase'),
  1,
  'digital purchase writes one audit event'
);

select lives_ok(
  $$select public.purchase_digital_reward(
    '40000000-0000-4000-8000-000000000001'::uuid,
    '40000000-0000-4000-8000-000000000010'::uuid,
    'purchase-digital-1'
  )$$,
  'replaying the same digital purchase is safe'
);

select is(
  (select available::text || ':' || lifetime_spent::text from public.olive_wallets where user_id = '40000000-0000-4000-8000-000000000001'),
  '1200:800',
  'digital purchase replay never charges twice'
);
select is(
  (select count(*)::integer from public.reward_entitlements where user_id = '40000000-0000-4000-8000-000000000001' and reward_id = '40000000-0000-4000-8000-000000000010'),
  1,
  'digital purchase replay never duplicates entitlement'
);
select is(
  (select count(*)::integer from public.olive_ledger where user_id = '40000000-0000-4000-8000-000000000001' and movement_type = 'spend'),
  1,
  'digital purchase replay never duplicates ledger spend'
);
select is(
  (select count(*)::integer from public.reward_audit_log where actor_user_id = '40000000-0000-4000-8000-000000000001' and action = 'reward.digital-purchase'),
  1,
  'digital purchase replay never duplicates audit'
);

select throws_ok(
  $$select public.purchase_digital_reward(
    '40000000-0000-4000-8000-000000000001'::uuid,
    '40000000-0000-4000-8000-000000000010'::uuid,
    'purchase-digital-2'
  )$$,
  '55000',
  'reward user limit reached',
  'non-repeatable digital reward cannot be bought twice with a new key'
);

select is(
  (select available::text || ':' || lifetime_spent::text from public.olive_wallets where user_id = '40000000-0000-4000-8000-000000000001'),
  '1200:800',
  'rejected duplicate never changes wallet'
);

select throws_ok(
  $$select public.purchase_digital_reward(
    '40000000-0000-4000-8000-000000000001'::uuid,
    '40000000-0000-4000-8000-000000000011'::uuid,
    'purchase-digital-expensive'
  )$$,
  '55000',
  'insufficient olives',
  'digital reward cannot overspend wallet'
);

select is(
  (select count(*)::integer from public.reward_entitlements where user_id = '40000000-0000-4000-8000-000000000001'),
  1,
  'failed expensive purchase grants no entitlement'
);

select * from finish();
rollback;
