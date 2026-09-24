import { describe, expect, it } from 'vitest';

import { readSupabasePublicConfig } from './supabase-config';

describe('readSupabasePublicConfig', () => {
  it('returns null while Supabase cloud is not configured', () => {
    expect(readSupabasePublicConfig({})).toBeNull();
    expect(
      readSupabasePublicConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      }),
    ).toBeNull();
  });

  it('reads public Expo Supabase variables and includes environment', () => {
    expect(
      readSupabasePublicConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-key',
        EXPO_PUBLIC_APP_ENV: 'staging',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test-key',
      environment: 'staging',
    });
  });

  it('defaults environment to dev when unconfigured', () => {
    const config = readSupabasePublicConfig({
      EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-key',
    });
    expect(config?.environment).toBe('dev');
  });

  it('rejects a configured non-HTTPS project URL', () => {
    expect(() =>
      readSupabasePublicConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'http://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-key',
      }),
    ).toThrow('Supabase URL must use HTTPS');
  });

  it('does not accept a service-role variable as mobile configuration', () => {
    expect(
      readSupabasePublicConfig({
        SUPABASE_SERVICE_ROLE_KEY: 'service-role-must-never-be-used-here',
      }),
    ).toBeNull();
  });

  it('rejects privileged service-role key passed as publishable key', () => {
    expect(() =>
      readSupabasePublicConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'ey...service_role_secret',
      }),
    ).toThrow(/Privileged keys/);
  });
});
