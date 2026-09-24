BEGIN;

SELECT plan(3);

-- Test 1: Mobile users cannot insert validation decisions
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.activity_validation_decisions (activity_id, user_id, state)
    VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'VERIFIED');
  $$,
  '42501',
  'new row violates row-level security policy for table "activity_validation_decisions"',
  'Mobile users cannot insert validation decisions'
);

-- Test 2: Mobile users cannot update validation decisions
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    UPDATE public.activity_validation_decisions SET state = 'VERIFIED' WHERE user_id = '00000000-0000-0000-0000-000000000001';
  $$,
  '42501',
  'new row violates row-level security policy for table "activity_validation_decisions"',
  'Mobile users cannot update validation decisions'
);

-- Test 3: Users can read their own decisions
SELECT lives_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    SELECT id FROM public.activity_validation_decisions WHERE user_id = '00000000-0000-0000-0000-000000000001';
  $$,
  'Users can read their own validation decisions'
);

SELECT * FROM finish();
ROLLBACK;