export function assertSafeBrowserSupabaseKey(input) {
  const key = String(input ?? '').trim();
  if (!key) throw new Error('Supabase publishable key is required');

  if (key.startsWith('sb_publishable_')) return key;
  if (key.startsWith('sb_secret_')) throw new Error('Secret Supabase keys cannot be written to browser config');

  if (!key.startsWith('eyJ')) {
    throw new Error('Expected a Supabase publishable key or legacy anon JWT');
  }

  const parts = key.split('.');
  if (parts.length !== 3) throw new Error('Malformed legacy Supabase JWT');

  let payload;
  try {
    payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
  } catch {
    throw new Error('Malformed legacy Supabase JWT');
  }

  if (payload?.role !== 'anon') {
    throw new Error('Only a legacy anon JWT is safe for browser config');
  }

  return key;
}
