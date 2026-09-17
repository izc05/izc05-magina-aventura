BEGIN;

SELECT plan(2);

-- Test 1: Authenticated users cannot insert weather snapshots
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.route_weather_snapshots (route_id, provider, temperature_c)
    VALUES ('00000000-0000-0000-0000-000000000001', 'fake', 30);
  $$,
  '42501',
  'new row violates row-level security policy for table "route_weather_snapshots"',
  'Authenticated users cannot forge weather snapshots'
);

-- Test 2: Authenticated users can read weather snapshots
SELECT lives_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    SELECT id FROM public.route_weather_snapshots LIMIT 1;
  $$,
  'Authenticated users can read weather snapshots'
);

SELECT * FROM finish();
ROLLBACK;
