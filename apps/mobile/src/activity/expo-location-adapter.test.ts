import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_LOCATION_TASK,
  createExpoLocationAdapter,
} from './expo-location-adapter';

function expoApi() {
  const starts: Array<{ taskName: string; options: Record<string, unknown> }> = [];

  return {
    starts,
    api: {
      Accuracy: { High: 99 },
      hasServicesEnabledAsync: async () => true,
      getForegroundPermissionsAsync: async () => ({ status: 'granted' as const }),
      requestForegroundPermissionsAsync: async () => ({ status: 'granted' as const }),
      getBackgroundPermissionsAsync: async () => ({ status: 'granted' as const }),
      requestBackgroundPermissionsAsync: async () => ({ status: 'granted' as const }),
      hasStartedLocationUpdatesAsync: async () => false,
      startLocationUpdatesAsync: async (
        taskName: string,
        options: Record<string, unknown>,
      ) => {
        starts.push({ taskName, options });
      },
      stopLocationUpdatesAsync: async () => undefined,
    },
  };
}

describe('Expo background location adapter', () => {
  it('uses hiking-grade updates and a persistent route notification', async () => {
    const native = expoApi();
    const adapter = createExpoLocationAdapter(native.api);

    await adapter.startBackgroundUpdates('activity-123');

    expect(native.starts).toHaveLength(1);
    expect(native.starts[0]).toEqual({
      taskName: ACTIVITY_LOCATION_TASK,
      options: expect.objectContaining({
        accuracy: 99,
        distanceInterval: 8,
        deferredUpdatesDistance: 24,
        deferredUpdatesInterval: 15000,
        foregroundService: {
          notificationTitle: 'Mágina Aventura · Ruta en curso',
          notificationBody: 'Registrando tu recorrido aunque bloquees la pantalla.',
          killServiceOnDestroy: false,
        },
      }),
    });
  });
});
