import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { activityId, userId, distanceKm, elevationGainM, durationMinutes, xp, olives, reasonCodes } = await req.json();

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  );

  const { error } = await supabaseAdmin.rpc('consolidate_verified_activity', {
    p_activity_id: activityId,
    p_user_id: userId,
    p_distance_km: distanceKm,
    p_elevation_gain_m: elevationGainM,
    p_duration_minutes: durationMinutes,
    p_xp_awarded: xp,
    p_olives_awarded: olives,
    p_reason_codes: reasonCodes ?? [],
    p_policy_version: 'v1.0'
  });

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  }

  return new Response(JSON.stringify({ status: 'VERIFIED' }), { status: 200 });
});