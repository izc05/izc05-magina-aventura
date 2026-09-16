-- Rewards RPC execution boundary.
-- Supabase projects may inherit automatic EXECUTE grants on newly created
-- public functions, so revoke client execution first and re-grant only the
-- intentionally exposed operator/user actions.

revoke execute on function public.credit_reward_olives(uuid, integer, text, timestamptz, jsonb) from anon, authenticated;
revoke execute on function public.rotate_reward_redemption_token(uuid) from anon, authenticated;
revoke execute on function public.reserve_physical_reward(uuid, uuid, uuid, timestamptz, text) from anon, authenticated;
revoke execute on function public.validate_reward_redemption_token(text) from anon, authenticated;
revoke execute on function public.confirm_reward_redemption(text, text) from anon, authenticated;
revoke execute on function public.cancel_reward_reservation(uuid, text) from anon, authenticated;
revoke execute on function public.expire_reward_reservations(timestamptz, integer) from anon, authenticated;
revoke execute on function public.purchase_digital_reward(uuid, uuid, text) from anon, authenticated;

-- Partner operators need an authenticated session; the RPCs enforce partner
-- membership and reservation ownership internally.
grant execute on function public.validate_reward_redemption_token(text) to authenticated;
grant execute on function public.confirm_reward_redemption(text, text) to authenticated;
grant execute on function public.cancel_reward_reservation(uuid, text) to authenticated;

-- Trusted backend access is explicit for every value-changing RPC.
grant execute on function public.credit_reward_olives(uuid, integer, text, timestamptz, jsonb) to service_role;
grant execute on function public.rotate_reward_redemption_token(uuid) to service_role;
grant execute on function public.reserve_physical_reward(uuid, uuid, uuid, timestamptz, text) to service_role;
grant execute on function public.validate_reward_redemption_token(text) to service_role;
grant execute on function public.confirm_reward_redemption(text, text) to service_role;
grant execute on function public.cancel_reward_reservation(uuid, text) to service_role;
grant execute on function public.expire_reward_reservations(timestamptz, integer) to service_role;
grant execute on function public.purchase_digital_reward(uuid, uuid, text) to service_role;
