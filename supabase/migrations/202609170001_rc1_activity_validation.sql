-- Activity Validation Decisions

CREATE TYPE activity_validation_state AS ENUM ('VALIDATING', 'VERIFIED', 'FLAGGED', 'REJECTED');

CREATE TABLE public.activity_validation_decisions (
  activity_id uuid PRIMARY KEY REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  state activity_validation_state NOT NULL,
  reason_codes text[] NOT NULL DEFAULT '{}',
  policy_version text NOT NULL,
  decided_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.activity_validation_decisions ENABLE ROW LEVEL SECURITY;

-- Authenticated users can view their own validation decisions
CREATE POLICY "Users can view own validation decisions" ON public.activity_validation_decisions
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ONLY the server (service_role) can insert/update validation decisions
-- There is intentionally no INSERT/UPDATE/DELETE policy for authenticated users.

CREATE INDEX idx_activity_validation_user ON public.activity_validation_decisions(user_id);