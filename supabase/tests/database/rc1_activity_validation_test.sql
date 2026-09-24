BEGIN;

SELECT plan(2);

-- Test 1: Mobile users cannot insert validation decisions
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.activity_validation_decisions (activity_id, user_id, state, policy_version)
    VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'VERIFIED', 'v1');
  $$,
  '42501',
  NULL,
  'Mobile users cannot insert validation decisions'
);

-- Test 2: Users can read their own decisions
SELECT lives_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    SELECT activity_id FROM public.activity_validation_decisions WHERE user_id = '00000000-0000-0000-0000-000000000001';
  $$,
  'Users can read their own validation decisions'
);

SELECT * FROM finish();
ROLLBACK;