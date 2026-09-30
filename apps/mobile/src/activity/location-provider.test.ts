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
    startForegroundUpdates: async () => undefined,
    stopForegroundUpdates: async () => undefined,
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


  it('keeps a valid foreground-only permission state without requesting background', async () => {
    let backgroundRequests = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        requestForegroundPermission: async () => 'granted',
        getBackgroundPermission: async () => 'denied',
        requestBackgroundPermission: async () => {
          backgroundRequests += 1;
          return 'granted';
        },
      }),
    );

    await expect(provider.requestAdventurePermissions()).resolves.toEqual({
      foregroundGranted: true,
      backgroundGranted: false,
      servicesEnabled: true,
    });
    expect(backgroundRequests).toBe(0);
  });

  it('uses foreground tracking during physical QA even when background permission already exists', async () => {
    let foregroundStarts = 0;
    let backgroundStarts = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        getForegroundPermission: async () => 'granted',
        getBackgroundPermission: async () => 'granted',
        startForegroundUpdates: async () => {
          foregroundStarts += 1;
        },
        startBackgroundUpdates: async () => {
          backgroundStarts += 1;
        },
      }),
    );

    await provider.start('activity-123', () => undefined);

    expect(foregroundStarts).toBe(1);
    expect(backgroundStarts).toBe(0);
  });

  it('falls back to foreground tracking when background permission is denied', async () => {
    let foregroundStarts = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        getForegroundPermission: async () => 'granted',
        getBackgroundPermission: async () => 'denied',
        startForegroundUpdates: async () => {
          foregroundStarts += 1;
        },
      }),
    );

    await provider.start('activity-denied', () => undefined);
    expect(foregroundStarts).toBe(1);
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

  it('refuses tracking when foreground permission is no longer granted', async () => {
    let starts = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        getForegroundPermission: async () => 'denied',
        getBackgroundPermission: async () => 'granted',
        startBackgroundUpdates: async () => {
          starts += 1;
        },
      }),
    );

    await expect(provider.start('activity-foreground-denied')).rejects.toThrow(
      'Foreground location permission is required',
    );
    expect(starts).toBe(0);
  });

  it('stops native updates only when background tracking is active', async () => {
    let started = true;
    let stops = 0;
    const provider = createLocationProvider(
      fakeAdapter({
        hasStartedBackgroundUpdates: async () => started,
        stopBackgroundUpdates: async () => {
          stops += 1;
          started = false;
        },
      }),
    );

    await provider.stop();
    await provider.stop();

    expect(stops).toBe(1);
  });
});
