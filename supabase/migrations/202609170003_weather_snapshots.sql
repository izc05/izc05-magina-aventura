-- Weather snapshots (server authority only)

CREATE TABLE public.route_weather_snapshots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  route_id uuid NOT NULL REFERENCES public.routes(id) ON DELETE CASCADE,
  schema_version text NOT NULL DEFAULT 'weather-snapshot.v1',
  provider text NOT NULL,
  observed_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  valid_until timestamptz,
  temperature_c numeric,
  wind_kph numeric,
  precipitation_probability_pct numeric,
  alerts jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_weather_snapshots_route ON public.route_weather_snapshots(route_id, fetched_at DESC);
CREATE INDEX route_weather_snapshots_route_id_fk_idx ON public.route_weather_snapshots(route_id);

-- RLS: mobile clients can read (for offline manifest enrichment)
ALTER TABLE public.route_weather_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read weather snapshots" ON public.route_weather_snapshots
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Anonymous users can read weather snapshots" ON public.route_weather_snapshots
  FOR SELECT TO anon USING (true);

-- No INSERT/UPDATE/DELETE for authenticated users; only service_role (edge function) writes.

-- Helper: get latest snapshot for a route
CREATE OR REPLACE FUNCTION public.get_latest_weather_snapshot(p_route_id uuid)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY INVOKER
AS $$
  SELECT jsonb_build_object(
    'schemaVersion', schema_version,
    'provider', provider,
    'routeId', route_id,
    'observedAt', observed_at,
    'fetchedAt', fetched_at,
    'validUntil', valid_until,
    'temperatureC', temperature_c,
    'windKph', wind_kph,
    'precipitationProbabilityPct', precipitation_probability_pct,
    'alerts', alerts
  )
  FROM public.route_weather_snapshots
  WHERE route_id = p_route_id
  ORDER BY fetched_at DESC
  LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.get_latest_weather_snapshot(uuid) TO authenticated, anon;
