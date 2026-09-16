import { beforeEach, describe, expect, it, vi } from 'vitest';

const startLocationUpdatesAsync = vi.fn(async () => undefined);

vi.mock('expo-location', () => ({
  Accuracy: { High: 99 },
  hasServicesEnabledAsync: vi.fn(async () => true),
  getForegroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  requestForegroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  getBackgroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  hasStartedLocationUpdatesAsync: vi.fn(async () => false),
  startLocationUpdatesAsync,
  stopLocationUpdatesAsync: vi.fn(async () => undefined),
}));

import { ACTIVITY_LOCATION_TASK } from './expo-location-adapter';
import { expoLocationProvider } from './expo-location-provider';

beforeEach(() => {
  startLocationUpdatesAsync.mockClear();
});

describe('expoLocationProvider native wiring', () => {
  it('starts the Expo background task through the shared provider contract', async () => {
    await expoLocationProvider.start('activity-native-wiring');

    expect(startLocationUpdatesAsync).toHaveBeenCalledTimes(1);
    expect(startLocationUpdatesAsync).toHaveBeenCalledWith(
      ACTIVITY_LOCATION_TASK,
      expect.objectContaining({ distanceInterval: 8 }),
    );
  });
});
