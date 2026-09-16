import { describe, expect, it, vi } from 'vitest';

import { handleBackgroundLocations } from './background-location-handler';
import type { ActivityStore, RecoveredActivity } from './activity-store';
import type { BackgroundLocationInbox } from './background-location-inbox';

function recoveredActivity(): RecoveredActivity {
  return {
    session: {
      activityId: 'activity-background',
      routeId: 'route-1',
      routeSlug: 'route-1',
      geometryVersion: 1,
      state: 'ACTIVE',
      startedAt: '2026-09-16T10:00:00.000Z',
      pausedAt: null,
      finishedAt: null,
      lastProcessedSequence: 0,
      syncState: 'local',
    },
    snapshot: {
      activityId: 'activity-background',
      state: 'ACTIVE',
      lastProcessedSequence: 0,
      validDistanceMeters: 0,
      totalElapsedSeconds: 0,
      movingElapsedSeconds: 0,
      currentSpeedMps: null,
      paceSecondsPerKm: null,
      elevationGainMeters: 0,
      elevationLossMeters: 0,
      routeProgress: 0,
      maxRouteProgress: 0,
      distanceToRouteMeters: null,
      offRouteState: 'on_route',
      lastValidSample: null,
      algorithmVersion: 1,
      createdAt: '2026-09-16T10:00:00.000Z',
    },
    samplesAfterSnapshot: [],
  };
}

function dependencies(active: RecoveredActivity | null) {
  const append = vi.fn(async () => undefined);
  const store = {
    initialize: vi.fn(async () => undefined),
    loadActiveSession: vi.fn(async () => active),
  } as unknown as ActivityStore;
  const inbox = {
    initialize: vi.fn(async () => undefined),
    append,
  } as unknown as BackgroundLocationInbox;
  return { store, inbox, append };
}

describe('handleBackgroundLocations', () => {
  it('persists Expo locations for the currently active adventure', async () => {
    const { store, inbox, append } = dependencies(recoveredActivity());

    await handleBackgroundLocations(
      [
        {
          timestamp: 1_789_550_405_000,
          coords: {
            latitude: 37.82,
            longitude: -3.41,
            accuracy: 6,
            altitude: 900,
            speed: 1.2,
            heading: 85,
          },
        },
      ],
      { store, inbox },
    );

    expect(append).toHaveBeenCalledWith('activity-background', [
      {
        timestampMs: 1_789_550_405_000,
        latitude: 37.82,
        longitude: -3.41,
        accuracyMeters: 6,
        altitudeMeters: 900,
        speedMps: 1.2,
        headingDegrees: 85,
      },
    ]);
  });

  it('drops delivery safely when there is no active adventure', async () => {
    const { store, inbox, append } = dependencies(null);

    await handleBackgroundLocations(
      [
        {
          timestamp: 1_789_550_405_000,
          coords: {
            latitude: 37.82,
            longitude: -3.41,
            accuracy: null,
            altitude: null,
            speed: null,
            heading: null,
          },
        },
      ],
      { store, inbox },
    );

    expect(append).not.toHaveBeenCalled();
  });
});
