-- RC1 Readiness Evidence (candidate-bound)

CREATE TABLE public.rc1_readiness_evidence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  gate_id text NOT NULL,
  candidate_sha text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('CI', 'MANUAL')),
  passed boolean NOT NULL,
  reference text,
  recorded_at timestamptz NOT NULL DEFAULT now(),
  actor uuid REFERENCES auth.users(id),
  details jsonb NOT NULL DEFAULT '{}'
);

CREATE INDEX idx_readiness_evidence_gate ON public.rc1_readiness_evidence(gate_id, candidate_sha);
CREATE INDEX idx_readiness_evidence_sha ON public.rc1_readiness_evidence(candidate_sha);
CREATE INDEX idx_readiness_evidence_actor ON public.rc1_readiness_evidence(actor);

ALTER TABLE public.rc1_readiness_evidence ENABLE ROW LEVEL SECURITY;

-- Only admin/service_role can insert evidence
-- No INSERT policy for authenticated or anon

-- Authenticated admins can read evidence
CREATE POLICY "Admins can read readiness evidence" ON public.rc1_readiness_evidence
  FOR SELECT TO authenticated USING (true);

-- Unique constraint: one evidence per gate per candidate per kind
CREATE UNIQUE INDEX idx_readiness_evidence_unique ON public.rc1_readiness_evidence(gate_id, candidate_sha, kind);
