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

  it('starts native background updates with the active activity id when fully ready', async () => {
    const startedActivities: string[] = [];
    const provider = createLocationProvider(
      fakeAdapter({
        getForegroundPermission: async () => 'granted',
        getBackgroundPermission: async () => 'granted',
        startBackgroundUpdates: async (activityId) => {
          startedActivities.push(activityId);
        },
      }),
    );

    await provider.start('activity-123');

    expect(startedActivities).toEqual(['activity-123']);
  });

  it('refuses background tracking when background permission is denied', async () => {
    let starts = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        getForegroundPermission: async () => 'granted',
        getBackgroundPermission: async () => 'denied',
        startBackgroundUpdates: async () => {
          starts += 1;
        },
      }),
    );

    await expect(provider.start('activity-denied')).rejects.toThrow(
      'Background location permission is required',
    );
    expect(starts).toBe(0);
  });

  it('refuses tracking when device location services are disabled', async () => {
    let starts = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        isServicesEnabled: async () => false,
        getForegroundPermission: async () => 'granted',
        getBackgroundPermission: async () => 'granted',
        startBackgroundUpdates: async () => {
          starts += 1;
        },
      }),
    );

    await expect(provider.start('activity-gps-off')).rejects.toThrow(
      'Location services are disabled',
    );
    expect(starts).toBe(0);
  });
});
