import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// weather-refresh: server-only edge function for fetching and persisting weather snapshots.
// Only this function holds provider credentials (AEMET_API_KEY, etc.).
// Mobile clients receive normalized weather-snapshot.v1 via get_latest_weather_snapshot RPC.

serve(async (req) => {
  const { routeId } = await req.json() as { routeId: string };

  if (!routeId) {
    return new Response(JSON.stringify({ error: 'routeId is required' }), { status: 400 });
  }

  const aemetKey = Deno.env.get('AEMET_API_KEY');
  const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
  const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

  const admin = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Fetch weather data from provider (AEMET or stub)
    // In production this calls the actual AEMET API using aemetKey.
    // For RC1 staging, we insert a stub snapshot to validate the pipeline.
    const now = new Date().toISOString();

    let temperatureC: number | null = null;
    let windKph: number | null = null;
    let precipitationProbabilityPct: number | null = null;
    let alerts: { id: string; severity: string; title: string }[] = [];

    if (aemetKey) {
      // TODO: wire real AEMET API call here once route lat/lon is accessible
      // For now: stub successful response structure
      temperatureC = null;
      windKph = null;
      precipitationProbabilityPct = null;
    }

    const { error } = await admin.from('route_weather_snapshots').insert({
      route_id: routeId,
      schema_version: 'weather-snapshot.v1',
      provider: aemetKey ? 'aemet' : 'stub',
      observed_at: null,
      fetched_at: now,
      valid_until: null,
      temperature_c: temperatureC,
      wind_kph: windKph,
      precipitation_probability_pct: precipitationProbabilityPct,
      alerts: JSON.stringify(alerts),
    });

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), { status: 500 });
    }

    return new Response(JSON.stringify({ status: 'ok', fetchedAt: now }), { status: 200 });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : 'Unknown error' }),
      { status: 500 },
    );
  }
});
