import type { RouteDetail } from '@magina-aventura/contracts';
import { describe, expect, it, vi } from 'vitest';

import {
  MemoryBackgroundLocationInbox,
  createMemoryBackgroundLocationInboxDatabase,
} from './background-location-inbox';
import { createActivityController } from './activity-controller';
import {
  MemoryActivityStore,
  createMemoryActivityStoreDatabase,
} from './memory-activity-store';
import type { LocationProvider } from './location-provider';

const route: RouteDetail = {
  id: 'route-1',
  slug: 'bedmar-test',
  title: 'Bedmar test',
  municipalityId: 'bedmar',
  municipalityName: 'Bedmar',
  distanceKm: 4.2,
  elevationGainM: 180,
  durationMinutes: 90,
  difficulty: 'moderate',
  rewardPreview: { xp: 50, olives: 2, discoveries: 3 },
  contentVersion: 1,
  description: 'Ruta de prueba',
  safetyNotes: [],
  startLatitude: 37.82,
  startLongitude: -3.41,
  geometryVersion: 1,
  offlineAvailable: false,
  developmentFixture: true,
};

function createProvider(): LocationProvider & {
  start: ReturnType<typeof vi.fn>;
  stop: ReturnType<typeof vi.fn>;
} {
  return {
    getPermissionState: vi.fn(async () => ({
      foregroundGranted: true,
      backgroundGranted: true,
      servicesEnabled: true,
    })),
    requestAdventurePermissions: vi.fn(async () => ({
      foregroundGranted: true,
      backgroundGranted: true,
      servicesEnabled: true,
    })),
    start: vi.fn(async () => undefined),
    stop: vi.fn(async () => undefined),
  };
}

function rawPoint(timestampMs: number, latitude: number, longitude: number) {
  return {
    timestampMs,
    latitude,
    longitude,
    accuracyMeters: 6,
    altitudeMeters: 900,
    speedMps: 1.1,
    headingDegrees: 90,
  };
}

describe('ActivityController', () => {
  it('starts, drains durable GPS points, pauses, resumes, finishes and queues the track', async () => {
    const store = new MemoryActivityStore();
    const inbox = new MemoryBackgroundLocationInbox();
    const provider = createProvider();
    const controller = createActivityController({
      store,
      inbox,
      locationProvider: provider,
      createActivityId: () => 'activity-1',
      now: () => '2026-09-16T10:00:00.000Z',
    });

    const started = await controller.start(route);
    expect(started.session.state).toBe('ACTIVE');
    expect(provider.start).toHaveBeenCalledWith('activity-1');

    await inbox.append('activity-1', [
      rawPoint(Date.parse('2026-09-16T10:00:05.000Z'), 37.82, -3.41),
      rawPoint(Date.parse('2026-09-16T10:00:15.000Z'), 37.82008, -3.41),
    ]);

    const refreshed = await controller.refresh();
    expect(refreshed?.snapshot.validDistanceMeters).toBeGreaterThan(5);
    expect(await store.loadTrack('activity-1')).toHaveLength(2);

    const paused = await controller.pause();
    expect(paused.session.state).toBe('PAUSED');
    expect(provider.stop).toHaveBeenCalledTimes(1);

    const resumed = await controller.resume();
    expect(resumed.session.state).toBe('ACTIVE');
    expect(provider.start).toHaveBeenCalledTimes(2);

    const finished = await controller.finish();
    expect(finished.session.state).toBe('FINISHED');
    expect(provider.stop).toHaveBeenCalledTimes(2);

    const pending = await store.loadPendingSyncBatches('activity-1');
    expect(pending).toHaveLength(1);
    expect(pending[0]?.idempotencyKey).toBe('activity:activity-1:track:1-2');
  });

  it('recovers samples stored after the latest snapshot after process-like restart', async () => {
    const storeDb = createMemoryActivityStoreDatabase();
    const inboxDb = createMemoryBackgroundLocationInboxDatabase();
    const provider = createProvider();

    const first = createActivityController({
      store: new MemoryActivityStore(storeDb),
      inbox: new MemoryBackgroundLocationInbox(inboxDb),
      locationProvider: provider,
      createActivityId: () => 'activity-recovery',
      now: () => '2026-09-16T10:00:00.000Z',
    });

    await first.start(route);
    await new MemoryBackgroundLocationInbox(inboxDb).append('activity-recovery', [
      rawPoint(Date.parse('2026-09-16T10:00:05.000Z'), 37.82, -3.41),
      rawPoint(Date.parse('2026-09-16T10:00:12.000Z'), 37.82006, -3.41),
    ]);
    const beforeRestart = await first.refresh();
    expect(beforeRestart?.snapshot.validDistanceMeters).toBeGreaterThan(0);

    const second = createActivityController({
      store: new MemoryActivityStore(storeDb),
      inbox: new MemoryBackgroundLocationInbox(inboxDb),
      locationProvider: provider,
      createActivityId: () => 'unused',
      now: () => '2026-09-16T10:01:00.000Z',
    });

    const recovered = await second.recover(route);
    expect(recovered?.session.activityId).toBe('activity-recovery');
    expect(recovered?.session.state).toBe('ACTIVE');
    expect(recovered?.snapshot.validDistanceMeters).toBeCloseTo(
      beforeRestart?.snapshot.validDistanceMeters ?? 0,
      3,
    );
  });
});