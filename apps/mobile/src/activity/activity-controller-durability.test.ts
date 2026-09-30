import type { AdventureDefinition, RouteDetail } from '@magina-aventura/contracts';
import { describe, expect, it, vi } from 'vitest';

import type { BackgroundLocationInbox } from './background-location-inbox';
import {
  createMemoryBackgroundLocationInboxDatabase,
  MemoryBackgroundLocationInbox,
} from './background-location-inbox';
import { createActivityController } from './activity-controller';
import {
  createMemoryActivityStoreDatabase,
  MemoryActivityStore,
} from './memory-activity-store';
import type { LocationProvider } from './location-provider';

const route: RouteDetail = {
  id: 'route-durable',
  slug: 'durable-route',
  title: 'Durable route',
  municipalityId: 'bedmar',
  municipalityName: 'Bedmar',
  distanceKm: 3,
  elevationGainM: 100,
  durationMinutes: 60,
  difficulty: 'easy',
  rewardPreview: { xp: 25, olives: 1, discoveries: 1 },
  contentVersion: 1,
  description: 'Durability fixture',
  safetyNotes: [],
  startLatitude: 37.82,
  startLongitude: -3.41,
  geometryVersion: 1,
  offlineAvailable: true,
  developmentFixture: true,
};

const definition: AdventureDefinition = {
  slug: 'durable-adventure',
  version: 1,
  routeId: route.id,
  geometryVersion: route.geometryVersion,
  gpx: { uri: 'test://durable.gpx', sha256: 'durable-gpx' },
  offlineMap: {
    manifestUri: 'test://manifest.json',
    styleTemplateUri: 'test://style.json',
    contentHash: 'durable-map',
  },
  explorationPolicy: {
    maxAccuracyMeters: 20,
    requiredConsecutiveSamples: 1,
    maxEvidenceGapSeconds: 15,
  },
  checkpoints: [],
  discoveries: [],
  missions: [],
  assets: [],
  scenes3d: [],
  progression: { xpRulesetVersion: 1, rewards: [] },
};

function provider(): LocationProvider & {
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

function point(timestampMs: number, latitude: number) {
  return {
    timestampMs,
    latitude,
    longitude: -3.41,
    accuracyMeters: 6,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
  };
}

describe('ActivityController durability boundaries', () => {
  it('does not replay committed inbox rows when cleanup ACK fails', async () => {
    const storeDb = createMemoryActivityStoreDatabase();
    const inboxDb = createMemoryBackgroundLocationInboxDatabase();
    const durableInbox = new MemoryBackgroundLocationInbox(inboxDb);
    const failingCleanupInbox: BackgroundLocationInbox = {
      initialize: () => durableInbox.initialize(),
      append: (activityId, points) => durableInbox.append(activityId, points),
      loadPending: (activityId, afterInboxId) =>
        durableInbox.loadPending(activityId, afterInboxId),
      acknowledgeThrough: async () => {
        throw new Error('simulated cleanup failure');
      },
    };

    const first = createActivityController({
      store: new MemoryActivityStore(storeDb),
      inbox: failingCleanupInbox,
      locationProvider: provider(),
      createActivityId: () => 'activity-cursor',
      now: () => '2026-09-28T08:00:00.000Z',
    });

    await first.start(definition, route);
    await durableInbox.append('activity-cursor', [
      point(Date.parse('2026-09-28T08:00:05.000Z'), 37.82),
      point(Date.parse('2026-09-28T08:00:15.000Z'), 37.82008),
    ]);

    await first.refresh();

    const persisted = await new MemoryActivityStore(storeDb).loadActiveSession();
    expect(persisted?.lastConsumedInboxId).toBe(2);
    expect((await durableInbox.loadPending('activity-cursor'))).toHaveLength(2);

    const secondStore = new MemoryActivityStore(storeDb);
    const second = createActivityController({
      store: secondStore,
      inbox: durableInbox,
      locationProvider: provider(),
      createActivityId: () => 'unused',
      now: () => '2026-09-28T08:01:00.000Z',
    });

    await second.recover(definition, route);

    const track = await secondStore.loadTrack('activity-cursor');
    expect(track.map((sample) => sample.sequence)).toEqual([1, 2]);
    expect(await durableInbox.loadPending('activity-cursor', 2)).toHaveLength(0);
  });

  it('serializes concurrent refresh calls so one inbox range is evaluated once', async () => {
    const store = new MemoryActivityStore();
    const realInbox = new MemoryBackgroundLocationInbox();
    let loadCalls = 0;
    const inbox: BackgroundLocationInbox = {
      initialize: () => realInbox.initialize(),
      append: (activityId, points) => realInbox.append(activityId, points),
      async loadPending(activityId, afterInboxId) {
        loadCalls += 1;
        await Promise.resolve();
        return realInbox.loadPending(activityId, afterInboxId);
      },
      acknowledgeThrough: (activityId, inboxId) =>
        realInbox.acknowledgeThrough(activityId, inboxId),
    };

    const controller = createActivityController({
      store,
      inbox,
      locationProvider: provider(),
      createActivityId: () => 'activity-concurrent',
      now: () => '2026-09-28T08:10:00.000Z',
    });

    await controller.start(definition, route);
    await realInbox.append('activity-concurrent', [
      point(Date.parse('2026-09-28T08:10:05.000Z'), 37.82),
      point(Date.parse('2026-09-28T08:10:15.000Z'), 37.82008),
    ]);

    await Promise.all([controller.refresh(), controller.refresh()]);

    expect(loadCalls).toBe(1);
    expect((await store.loadTrack('activity-concurrent')).map((sample) => sample.sequence))
      .toEqual([1, 2]);
  });

  it('durably pauses a recovered ACTIVE session when GPS restart fails', async () => {
    const database = createMemoryActivityStoreDatabase();
    const inbox = new MemoryBackgroundLocationInbox();
    const first = createActivityController({
      store: new MemoryActivityStore(database),
      inbox,
      locationProvider: provider(),
      createActivityId: () => 'activity-recover-provider-failure',
      now: () => '2026-09-28T08:15:00.000Z',
    });

    await first.start(definition, route);

    const failingProvider = provider();
    failingProvider.start.mockRejectedValueOnce(new Error('simulated GPS restart failure'));
    const secondStore = new MemoryActivityStore(database);
    const second = createActivityController({
      store: secondStore,
      inbox,
      locationProvider: failingProvider,
      createActivityId: () => 'unused',
      now: () => '2026-09-28T08:16:00.000Z',
    });

    await expect(second.recover(definition, route)).rejects.toThrow(
      'simulated GPS restart failure',
    );

    expect(second.current()?.session.state).toBe('PAUSED');
    expect((await secondStore.loadActiveSession())?.session.state).toBe('PAUSED');

    const thirdProvider = provider();
    const third = createActivityController({
      store: new MemoryActivityStore(database),
      inbox,
      locationProvider: thirdProvider,
      createActivityId: () => 'unused-again',
      now: () => '2026-09-28T08:17:00.000Z',
    });

    const recoveredPaused = await third.recover(definition, route);
    expect(recoveredPaused?.session.state).toBe('PAUSED');
    expect(thirdProvider.start).not.toHaveBeenCalled();
  });

  it('stops a residual native GPS task when reopening after the session finished', async () => {
    const database = createMemoryActivityStoreDatabase();
    const inbox = new MemoryBackgroundLocationInbox();
    const first = createActivityController({
      store: new MemoryActivityStore(database),
      inbox,
      locationProvider: provider(),
      createActivityId: () => 'activity-finished-before-reopen',
      now: () => '2026-09-28T08:18:00.000Z',
    });
    await first.start(definition, route);
    await first.finish();

    const reopenedProvider = provider();
    const reopened = createActivityController({
      store: new MemoryActivityStore(database),
      inbox,
      locationProvider: reopenedProvider,
      createActivityId: () => 'unused-after-finish',
      now: () => '2026-09-28T08:19:00.000Z',
    });

    await expect(reopened.recover(definition, route)).resolves.toBeNull();
    expect(reopenedProvider.stop).toHaveBeenCalledTimes(1);
  });

  it('keeps the in-memory activity ACTIVE when atomic finish persistence fails', async () => {
    const store = new MemoryActivityStore();
    const inbox = new MemoryBackgroundLocationInbox();
    const locationProvider = provider();
    const controller = createActivityController({
      store,
      inbox,
      locationProvider,
      createActivityId: () => 'activity-finish-failure',
      now: () => '2026-09-28T08:20:00.000Z',
    });

    await controller.start(definition, route);
    await inbox.append('activity-finish-failure', [
      point(Date.parse('2026-09-28T08:20:05.000Z'), 37.82),
      point(Date.parse('2026-09-28T08:20:15.000Z'), 37.82008),
    ]);
    await controller.refresh();

    store.finishSessionAndQueueSyncBatch = vi.fn(async () => {
      throw new Error('simulated atomic persistence failure');
    });

    await expect(controller.finish()).rejects.toThrow(
      'simulated atomic persistence failure',
    );

    expect(controller.current()?.session.state).toBe('ACTIVE');
    expect(locationProvider.stop).not.toHaveBeenCalled();
  });

  it('persists FINISHED and the sync outbox together on successful finish', async () => {
    const database = createMemoryActivityStoreDatabase();
    const store = new MemoryActivityStore(database);
    const inbox = new MemoryBackgroundLocationInbox();
    const controller = createActivityController({
      store,
      inbox,
      locationProvider: provider(),
      createActivityId: () => 'activity-atomic-finish',
      now: () => '2026-09-28T08:30:00.000Z',
    });

    await controller.start(definition, route);
    await inbox.append('activity-atomic-finish', [
      point(Date.parse('2026-09-28T08:30:05.000Z'), 37.82),
      point(Date.parse('2026-09-28T08:30:15.000Z'), 37.82008),
    ]);
    await controller.refresh();
    await controller.finish();

    expect(database.sessions.get('activity-atomic-finish')?.state).toBe('FINISHED');
    expect(database.sessions.get('activity-atomic-finish')?.syncState).toBe('queued');
    expect(database.syncBatches.size).toBe(1);
    expect(
      [...database.syncBatches.values()][0]?.idempotencyKey,
    ).toBe('activity:activity-atomic-finish:track:1-2');
  });
});
