-- Rewards Data API boundary.
-- Keep this scoped to the reward subsystem: do not change project-wide
-- default privileges because unrelated modules may rely on them.

revoke all on table public.reward_partners from anon, authenticated;
revoke all on table public.reward_partner_memberships from anon, authenticated;
revoke all on table public.reward_pickup_locations from anon, authenticated;
revoke all on table public.reward_catalog_items from anon, authenticated;
revoke all on table public.reward_inventory from anon, authenticated;
revoke all on table public.olive_wallets from anon, authenticated;
revoke all on table public.olive_ledger from anon, authenticated;
revoke all on table public.reward_entitlements from anon, authenticated;
revoke all on table public.reward_reservations from anon, authenticated;
revoke all on table public.reward_redemption_credentials from anon, authenticated;
revoke all on table public.reward_redemptions from anon, authenticated;
revoke all on table public.reward_audit_log from anon, authenticated;

-- Public catalogue surface. RLS still determines which rows are visible.
grant select on table public.reward_partners to anon, authenticated;
grant select on table public.reward_pickup_locations to anon, authenticated;
grant select on table public.reward_catalog_items to anon, authenticated;
grant select on table public.reward_inventory to anon, authenticated;

-- Signed-in users may read only their own rows according to the existing RLS
-- ownership policies. No direct client writes are granted to value-bearing data.
grant select on table public.reward_partner_memberships to authenticated;
grant select on table public.olive_wallets to authenticated;
grant select on table public.olive_ledger to authenticated;
grant select on table public.reward_entitlements to authenticated;
grant select on table public.reward_reservations to authenticated;
grant select on table public.reward_redemptions to authenticated;

-- Intentionally no client grants for:
--   reward_redemption_credentials (contains credential hashes)
--   reward_audit_log (internal audit trail)
-- All mutations of balances, reservations, entitlements, credentials and
-- redemptions remain behind explicitly granted RPCs / trusted backend calls.
