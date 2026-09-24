-- Verified Progression

CREATE TABLE public.verified_activity_stats (
  activity_id uuid PRIMARY KEY REFERENCES public.activities(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  distance_km numeric NOT NULL,
  elevation_gain_m integer NOT NULL,
  duration_minutes integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.user_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_id uuid REFERENCES public.activities(id) ON DELETE SET NULL,
  xp_awarded integer NOT NULL DEFAULT 0,
  olives_awarded integer NOT NULL DEFAULT 0,
  reason text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- RLS
ALTER TABLE public.verified_activity_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verified stats" ON public.verified_activity_stats
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE POLICY "Users can view own ledger entries" ON public.user_ledger
  FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ONLY the server (service_role) can insert/update progression tables
-- No INSERT/UPDATE/DELETE policy for authenticated users.

CREATE INDEX idx_verified_stats_user ON public.verified_activity_stats(user_id);
CREATE INDEX idx_user_ledger_user ON public.user_ledger(user_id);
CREATE INDEX idx_user_ledger_activity ON public.user_ledger(activity_id);

-- Step 4: Consolidate a verified activity atomically
CREATE OR REPLACE FUNCTION public.consolidate_verified_activity(
  p_activity_id uuid,
  p_user_id uuid,
  p_distance_km numeric,
  p_elevation_gain_m integer,
  p_duration_minutes integer,
  p_xp_awarded integer,
  p_olives_awarded integer,
  p_reason_codes text[],
  p_policy_version text
) RETURNS void AS $$
BEGIN
  -- Update activity state
  UPDATE public.activities
  SET state = 'VERIFIED'
  WHERE id = p_activity_id AND user_id = p_user_id;

  -- Insert validation decision
  INSERT INTO public.activity_validation_decisions (activity_id, user_id, state, reason_codes, policy_version)
  VALUES (p_activity_id, p_user_id, 'VERIFIED', p_reason_codes, p_policy_version)
  ON CONFLICT (activity_id) DO UPDATE SET
    state = 'VERIFIED',
    reason_codes = EXCLUDED.reason_codes,
    policy_version = EXCLUDED.policy_version,
    decided_at = now();

  -- Insert verified stats
  INSERT INTO public.verified_activity_stats (activity_id, user_id, distance_km, elevation_gain_m, duration_minutes)
  VALUES (p_activity_id, p_user_id, p_distance_km, p_elevation_gain_m, p_duration_minutes)
  ON CONFLICT (activity_id) DO UPDATE SET
    distance_km = EXCLUDED.distance_km,
    elevation_gain_m = EXCLUDED.elevation_gain_m,
    duration_minutes = EXCLUDED.duration_minutes;

  -- Insert ledger entry for rewards
  IF p_xp_awarded > 0 OR p_olives_awarded > 0 THEN
    INSERT INTO public.user_ledger (user_id, activity_id, xp_awarded, olives_awarded, reason)
    VALUES (p_user_id, p_activity_id, p_xp_awarded, p_olives_awarded, 'Activity verified');
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
