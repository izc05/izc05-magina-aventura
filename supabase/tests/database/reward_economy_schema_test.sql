begin;

create extension if not exists pgtap with schema extensions;
select plan(47);

select has_table('public', 'reward_partners', 'reward_partners exists');
select has_table('public', 'reward_partner_memberships', 'reward_partner_memberships exists');
select has_table('public', 'reward_pickup_locations', 'reward_pickup_locations exists');
select has_table('public', 'reward_catalog_items', 'reward_catalog_items exists');
select has_table('public', 'reward_inventory', 'reward_inventory exists');
select has_table('public', 'olive_wallets', 'olive_wallets exists');
select has_table('public', 'olive_ledger', 'olive_ledger exists');
select has_table('public', 'reward_entitlements', 'reward_entitlements exists');
select has_table('public', 'reward_reservations', 'reward_reservations exists');
select has_table('public', 'reward_redemption_credentials', 'reward_redemption_credentials exists');
select has_table('public', 'reward_redemptions', 'reward_redemptions exists');
select has_table('public', 'reward_audit_log', 'reward_audit_log exists');

select has_column('public', 'olive_wallets', 'available', 'wallet available exists');
select has_column('public', 'olive_wallets', 'reserved', 'wallet reserved exists');
select has_column('public', 'olive_wallets', 'lifetime_granted', 'wallet lifetime_granted exists');
select has_column('public', 'olive_wallets', 'lifetime_spent', 'wallet lifetime_spent exists');

select has_column('public', 'olive_ledger', 'movement_type', 'ledger movement_type exists');
select has_column('public', 'olive_ledger', 'amount', 'ledger amount exists');
select has_column('public', 'olive_ledger', 'source_key', 'ledger source_key exists');
select has_column('public', 'olive_ledger', 'reservation_id', 'ledger reservation_id exists');

select has_column('public', 'reward_catalog_items', 'reward_type', 'catalog reward_type exists');
select has_column('public', 'reward_catalog_items', 'olive_cost', 'catalog olive_cost exists');
select has_column('public', 'reward_catalog_items', 'rarity', 'catalog rarity exists');
select has_column('public', 'reward_catalog_items', 'minimum_level', 'catalog minimum_level exists');
select has_column('public', 'reward_catalog_items', 'minimum_tree_stage', 'catalog minimum_tree_stage exists');
select has_column('public', 'reward_catalog_items', 'stock_mode', 'catalog stock_mode exists');

select has_column('public', 'reward_reservations', 'status', 'reservation status exists');
select has_column('public', 'reward_reservations', 'olive_cost', 'reservation olive_cost exists');
select has_column('public', 'reward_reservations', 'expires_at', 'reservation expires_at exists');

select has_column('public', 'reward_redemption_credentials', 'token_hash', 'credential token_hash exists');
select has_column('public', 'reward_redemption_credentials', 'status', 'credential status exists');
select has_column('public', 'reward_redemption_credentials', 'expires_at', 'credential expires_at exists');

select has_column('public', 'reward_redemptions', 'partner_id', 'redemption partner_id exists');
select has_column('public', 'reward_redemptions', 'operator_user_id', 'redemption operator_user_id exists');
select has_column('public', 'reward_redemptions', 'redeemed_at', 'redemption redeemed_at exists');

select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_partners')), false), 'RLS enabled on reward_partners');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_partner_memberships')), false), 'RLS enabled on reward_partner_memberships');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_pickup_locations')), false), 'RLS enabled on reward_pickup_locations');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_catalog_items')), false), 'RLS enabled on reward_catalog_items');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_inventory')), false), 'RLS enabled on reward_inventory');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.olive_wallets')), false), 'RLS enabled on olive_wallets');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.olive_ledger')), false), 'RLS enabled on olive_ledger');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_entitlements')), false), 'RLS enabled on reward_entitlements');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_reservations')), false), 'RLS enabled on reward_reservations');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_redemption_credentials')), false), 'RLS enabled on reward_redemption_credentials');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_redemptions')), false), 'RLS enabled on reward_redemptions');
select ok(coalesce((select relrowsecurity from pg_class where oid = to_regclass('public.reward_audit_log')), false), 'RLS enabled on reward_audit_log');

select * from finish();
rollback;
