begin;

create extension if not exists pgtap with schema extensions;
select plan(27);

select ok(
  has_table_privilege('anon', 'public.reward_partners', 'SELECT'),
  'anon can read active reward partners through RLS'
);
select ok(
  has_table_privilege('anon', 'public.reward_pickup_locations', 'SELECT'),
  'anon can read active pickup locations through RLS'
);
select ok(
  has_table_privilege('anon', 'public.reward_catalog_items', 'SELECT'),
  'anon can read active reward catalog through RLS'
);
select ok(
  has_table_privilege('anon', 'public.reward_inventory', 'SELECT'),
  'anon can read public reward inventory through RLS'
);

select ok(
  not has_table_privilege('anon', 'public.olive_wallets', 'SELECT'),
  'anon cannot read olive wallets'
);
select ok(
  not has_table_privilege('anon', 'public.olive_ledger', 'SELECT'),
  'anon cannot read olive ledger'
);
select ok(
  not has_table_privilege('anon', 'public.reward_entitlements', 'SELECT'),
  'anon cannot read reward entitlements'
);
select ok(
  not has_table_privilege('anon', 'public.reward_reservations', 'SELECT'),
  'anon cannot read reward reservations'
);
select ok(
  not has_table_privilege('anon', 'public.reward_redemptions', 'SELECT'),
  'anon cannot read reward redemptions'
);

select ok(
  has_table_privilege('authenticated', 'public.reward_partner_memberships', 'SELECT'),
  'authenticated users can read own partner memberships through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.olive_wallets', 'SELECT'),
  'authenticated users can read own olive wallet through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.olive_ledger', 'SELECT'),
  'authenticated users can read own olive ledger through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.reward_entitlements', 'SELECT'),
  'authenticated users can read own reward entitlements through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.reward_reservations', 'SELECT'),
  'authenticated users can read own reward reservations through RLS'
);
select ok(
  has_table_privilege('authenticated', 'public.reward_redemptions', 'SELECT'),
  'authenticated users can read own reward redemptions through RLS'
);

select ok(
  not has_table_privilege('authenticated', 'public.reward_redemption_credentials', 'SELECT'),
  'authenticated clients cannot read QR credential hashes'
);
select ok(
  not has_table_privilege('authenticated', 'public.reward_audit_log', 'SELECT'),
  'authenticated clients cannot read reward audit log directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.olive_wallets', 'INSERT'),
  'authenticated clients cannot insert wallet rows directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.olive_wallets', 'UPDATE'),
  'authenticated clients cannot update wallet balances directly'
);
select ok(
  not has_table_privilege('authenticated', 'public.olive_wallets', 'DELETE'),
  'authenticated clients cannot delete wallet rows directly'
);

select ok(
  has_function_privilege('authenticated', 'public.validate_reward_redemption_token(text)', 'EXECUTE'),
  'authenticated partner operators can validate redemption tokens'
);
select ok(
  has_function_privilege('authenticated', 'public.confirm_reward_redemption(text,text)', 'EXECUTE'),
  'authenticated partner operators can confirm redemption'
);
select ok(
  has_function_privilege('authenticated', 'public.cancel_reward_reservation(uuid)', 'EXECUTE'),
  'authenticated users can cancel own reservations'
);
select ok(
  not has_function_privilege('authenticated', 'public.purchase_digital_reward(uuid,uuid,text)', 'EXECUTE'),
  'digital purchases remain backend-only'
);
select ok(
  not has_function_privilege('authenticated', 'public.reserve_physical_reward(uuid,uuid,uuid,timestamp with time zone,text)', 'EXECUTE'),
  'physical reservations remain backend-only'
);
select ok(
  not has_function_privilege('anon', 'public.validate_reward_redemption_token(text)', 'EXECUTE'),
  'anonymous clients cannot validate redemption tokens'
);
select ok(
  not has_function_privilege('anon', 'public.cancel_reward_reservation(uuid)', 'EXECUTE'),
  'anonymous clients cannot cancel reservations'
);

select * from finish();
rollback;
