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

  it('reads only the public Expo Supabase variables', () => {
    expect(
      readSupabasePublicConfig({
        EXPO_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'sb_publishable_test-key',
      }),
    ).toEqual({
      url: 'https://example.supabase.co',
      publishableKey: 'sb_publishable_test-key',
    });
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
});
