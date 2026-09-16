import { describe, expect, it } from 'vitest';

import { createLocationProvider, type NativeLocationAdapter } from './location-provider';

function fakeAdapter(overrides: Partial<NativeLocationAdapter> = {}): NativeLocationAdapter {
  return {
    isServicesEnabled: async () => true,
    getForegroundPermission: async () => 'undetermined',
    requestForegroundPermission: async () => 'granted',
    getBackgroundPermission: async () => 'undetermined',
    requestBackgroundPermission: async () => 'granted',
    hasStartedBackgroundUpdates: async () => false,
    startBackgroundUpdates: async () => undefined,
    stopBackgroundUpdates: async () => undefined,
    ...overrides,
  };
}

describe('LocationProvider permissions', () => {
  it('does not request background permission when foreground permission is denied', async () => {
    let backgroundRequests = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        requestForegroundPermission: async () => 'denied',
        requestBackgroundPermission: async () => {
          backgroundRequests += 1;
          return 'granted';
        },
      }),
    );

    const state = await provider.requestAdventurePermissions();

    expect(backgroundRequests).toBe(0);
    expect(state).toEqual({
      foregroundGranted: false,
      backgroundGranted: false,
      servicesEnabled: true,
    });
  });
});
