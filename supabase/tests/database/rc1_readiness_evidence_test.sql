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
  'new row violates row-level security policy for table "rc1_readiness_evidence"',
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
  'new row violates row-level security policy for table "rc1_readiness_evidence"',
  'Authenticated mobile users cannot forge readiness evidence'
);

-- Test 3: CI evidence cannot be stored as manual evidence (enforced by kind CHECK)
SELECT throws_ok(
  $$
    SET ROLE service_role;
    INSERT INTO public.rc1_readiness_evidence (gate_id, candidate_sha, kind, passed)
    VALUES ('gps-runtime', 'abc123', 'INVALID_KIND', true);
  $$,
  '23514',
  'new row for relation "rc1_readiness_evidence" violates check constraint',
  'Evidence kind must be CI or MANUAL'
);

SELECT * FROM finish();
ROLLBACK;
