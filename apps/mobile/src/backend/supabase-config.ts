export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
}

type PublicEnv = Readonly<Record<string, string | undefined>>;

export function readSupabasePublicConfig(
  env: PublicEnv,
): SupabasePublicConfig | null {
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url || !publishableKey) {
    return null;
  }

  if (!url.startsWith('https://')) {
    throw new Error('Supabase URL must use HTTPS');
  }

  return {
    url,
    publishableKey,
  };
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  return readSupabasePublicConfig({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });
}
