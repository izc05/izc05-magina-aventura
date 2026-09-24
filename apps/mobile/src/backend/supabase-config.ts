export type AppEnvironment = 'dev' | 'staging' | 'production';

export interface SupabasePublicConfig {
  url: string;
  publishableKey: string;
  environment: AppEnvironment;
}

type PublicEnv = Readonly<Record<string, string | undefined>>;

/** Privileged key patterns that must NEVER be present in client config. */
const PRIVILEGED_KEY_PATTERNS = [/service_role/i, /service-role/i, /secret/i];

export function readSupabasePublicConfig(
  env: PublicEnv,
): SupabasePublicConfig | null {
  const url = env.EXPO_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  const rawEnv = (env.EXPO_PUBLIC_APP_ENV?.trim() || env.APP_ENV?.trim() || 'dev').toLowerCase();

  // Reject privileged keys passed in client environment
  if (publishableKey) {
    for (const pattern of PRIVILEGED_KEY_PATTERNS) {
      if (pattern.test(publishableKey)) {
        throw new Error('Privileged keys (service_role/secret) must not be configured on client');
      }
    }
  }

  if (!url || !publishableKey) {
    return null;
  }

  if (!url.startsWith('https://')) {
    throw new Error('Supabase URL must use HTTPS');
  }

  const validEnvironments: AppEnvironment[] = ['dev', 'staging', 'production'];
  const environment: AppEnvironment = validEnvironments.includes(rawEnv as AppEnvironment)
    ? (rawEnv as AppEnvironment)
    : 'dev';

  return {
    url,
    publishableKey,
    environment,
  };
}

export function getSupabasePublicConfig(): SupabasePublicConfig | null {
  return readSupabasePublicConfig({
    EXPO_PUBLIC_SUPABASE_URL: process.env.EXPO_PUBLIC_SUPABASE_URL,
    EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    EXPO_PUBLIC_APP_ENV: process.env.EXPO_PUBLIC_APP_ENV,
  });
}
