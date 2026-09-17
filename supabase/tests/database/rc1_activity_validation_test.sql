BEGIN;

SELECT plan(3);

-- Test 1: Mobile users cannot insert validation decisions
SELECT throws_ok(
  \$\$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.activity_validation_decisions (activity_id, user_id, state, policy_version)
    VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'VERIFIED', 'v1');
  \$\$,
  '42501',
  'new row violates row-level security policy for table "activity_validation_decisions"',
  'Authenticated users cannot insert validation decisions'
);

-- Test 2: Mobile users cannot update activities to VERIFIED directly
SELECT throws_ok(
  \$\$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    UPDATE public.activities SET state = 'VERIFIED' WHERE id = '00000000-0000-0000-0000-000000000002';
  \$\$,
  '42501',
  'new row violates row-level security policy for table "activities"',
  'Authenticated users cannot update activities to VERIFIED'
);

-- Test 3: Users can read their own decisions
SELECT set_has(
  \$\$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    SELECT user_id FROM public.activity_validation_decisions;
  \$\$,
  \$\$ VALUES ('00000000-0000-0000-0000-000000000001'::uuid) \$\$,
  'Authenticated users can read their own validation decisions'
);

SELECT * FROM finish();
ROLLBACK;