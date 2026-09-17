BEGIN;

SELECT plan(2);

-- Test 1: Users can only insert PRIVATE media
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.activity_media (activity_id, user_id, privacy)
    VALUES ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000001', 'PUBLIC');
  $$,
  '23514',
  'new row violates row-level security policy for table "activity_media"',
  'Users cannot directly insert PUBLIC media'
);

-- Test 2: Users can read their own media
SELECT lives_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    SELECT id FROM public.activity_media WHERE user_id = '00000000-0000-0000-0000-000000000001' LIMIT 1;
  $$,
  'Users can read their own media'
);

SELECT * FROM finish();
ROLLBACK;
