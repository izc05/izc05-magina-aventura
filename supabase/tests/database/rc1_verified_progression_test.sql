BEGIN;

SELECT plan(2);

-- Test 1: Mobile users cannot insert verified stats
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.verified_activity_stats (activity_id, user_id, distance_km, elevation_gain_m, duration_minutes)
    VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 5.0, 100, 60);
  $$,
  '42501',
  'new row violates row-level security policy for table "verified_activity_stats"',
  'Mobile users cannot insert verified stats'
);

-- Test 2: Mobile users cannot insert ledger entries
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.user_ledger (user_id, xp_awarded, olives_awarded, reason)
    VALUES ('00000000-0000-0000-0000-000000000001', 100, 10, 'Self awarded');
  $$,
  '42501',
  'new row violates row-level security policy for table "user_ledger"',
  'Mobile users cannot insert ledger entries'
);

SELECT * FROM finish();
ROLLBACK;