BEGIN;

SELECT plan(3);

-- Test 1: Anonymous users cannot insert readiness evidence
SELECT throws_ok(
  $$
    SET ROLE anon;
    INSERT INTO public.rc1_readiness_evidence (gate_id, candidate_sha, kind, passed)
    VALUES ('gps-runtime', 'abc123', 'CI', true);
  $$,
  '42501',
  NULL,
  'Anonymous users cannot forge readiness evidence'
);

-- Test 2: Authenticated mobile users cannot insert evidence
SELECT throws_ok(
  $$
    SET ROLE authenticated;
    SET request.jwt.claims TO '{"sub": "00000000-0000-0000-0000-000000000001"}';
    INSERT INTO public.rc1_readiness_evidence (gate_id, candidate_sha, kind, passed)
    VALUES ('gps-runtime', 'abc123', 'CI', true);
  $$,
  '42501',
  NULL,
  'Authenticated mobile users cannot forge readiness evidence'
);

-- Test 3: Invalid evidence kind is rejected
SELECT throws_ok(
  $$
    SET ROLE service_role;
    INSERT INTO public.rc1_readiness_evidence (gate_id, candidate_sha, kind, passed)
    VALUES ('gps-runtime', 'abc123', 'INVALID_KIND', true);
  $$,
  '23514',
  NULL,
  'Evidence kind must be CI or MANUAL'
);

SELECT * FROM finish();
ROLLBACK;
