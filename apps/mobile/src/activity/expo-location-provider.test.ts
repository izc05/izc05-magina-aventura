import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  startLocationUpdatesAsync: vi.fn(async () => undefined),
  watchPositionAsync: vi.fn(async () => ({ remove: vi.fn() })),
}));

vi.mock('expo-location', () => ({
  Accuracy: { High: 99 },
  hasServicesEnabledAsync: vi.fn(async () => true),
  getForegroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  requestForegroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  getBackgroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  requestBackgroundPermissionsAsync: vi.fn(async () => ({ status: 'granted' })),
  hasStartedLocationUpdatesAsync: vi.fn(async () => false),
  startLocationUpdatesAsync: mocks.startLocationUpdatesAsync,
  stopLocationUpdatesAsync: vi.fn(async () => undefined),
  watchPositionAsync: mocks.watchPositionAsync,
}));

import { expoLocationProvider } from './expo-location-provider';

beforeEach(() => {
  mocks.startLocationUpdatesAsync.mockClear();
  mocks.watchPositionAsync.mockClear();
});

describe('expoLocationProvider native wiring', () => {
  it('uses Expo foreground GPS during the physical QA isolation gate', async () => {
    await expoLocationProvider.start('activity-native-wiring', () => undefined);

    expect(mocks.watchPositionAsync).toHaveBeenCalledTimes(1);
    expect(mocks.watchPositionAsync).toHaveBeenCalledWith(
      expect.objectContaining({ distanceInterval: 8, timeInterval: 5000 }),
      expect.any(Function),
    );
    expect(mocks.startLocationUpdatesAsync).not.toHaveBeenCalled();
  });
});
