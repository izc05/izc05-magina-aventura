import { describe, expect, it } from 'vitest';
import type { ActivitySession, ActivitySnapshot, LocationSample } from '@magina-aventura/contracts';
import type { ExplorationObservation } from '@magina-aventura/activity-engine';

import type { ActivityStore } from './activity-store';
import {
  createMemoryActivityStoreDatabase,
  MemoryActivityStore,
} from './memory-activity-store';

function session(state: ActivitySession['state'] = 'ACTIVE'): ActivitySession {
  return {
    activityId: 'activity-store-test',
    routeId: 'route-test',
    routeSlug: 'synthetic-route',
    geometryVersion: 2,
    state,
    startedAt: '2026-09-16T08:00:00.000Z',
    pausedAt: state === 'PAUSED' ? '2026-09-16T08:00:15.000Z' : null,
    finishedAt: state === 'FINISHED' ? '2026-09-16T08:00:30.000Z' : null,
    lastProcessedSequence: 0,
    syncState: 'local',
  };
}

function snapshot(sequence: number, state: ActivitySnapshot['state'] = 'ACTIVE'): ActivitySnapshot {
  return {
    activityId: 'activity-store-test',
    state,
    lastProcessedSequence: sequence,
    validDistanceMeters: sequence * 10,
    totalElapsedSeconds: sequence * 5,
    movingElapsedSeconds: sequence * 5,
    currentSpeedMps: 1,
    paceSecondsPerKm: 1000,
    elevationGainMeters: 0,
    elevationLossMeters: 0,
    routeProgress: sequence / 10,
    maxRouteProgress: sequence / 10,
    distanceToRouteMeters: 5,
    offRouteState: 'on_route',
    lastValidSample: null,
    algorithmVersion: 1,
    createdAt: `2026-09-16T08:00:${String(sequence * 5).padStart(2, '0')}.000Z`,
  };
}

function sample(sequence: number): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-16T08:00:${String(sequence * 5).padStart(2, '0')}.000Z`,
    latitude: 37,
    longitude: -4 + sequence * 0.0001,
    accuracyMeters: 8,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };
}

async function writeRecoverableActivity(store: ActivityStore) {
  await store.initialize();
  await store.createSession(session(), snapshot(0));
  await store.appendBatch('activity-store-test', [sample(1), sample(2)], snapshot(1));
}

describe('ActivityStore recovery contract', () => {
  it('recovers the latest snapshot and only samples after its sequence', async () => {
    const store = new MemoryActivityStore();
    await writeRecoverableActivity(store);

    const recovered = await store.loadActiveSession();

    expect(recovered?.session.state).toBe('ACTIVE');
    expect(recovered?.session.lastProcessedSequence).toBe(1);
    expect(recovered?.snapshot.lastProcessedSequence).toBe(1);
    expect(recovered?.samplesAfterSnapshot.map((item) => item.sequence)).toEqual([2]);
  });

  it('survives process-like store re-instantiation over the same database', async () => {
    const database = createMemoryActivityStoreDatabase();
    const firstProcess = new MemoryActivityStore(database);
    await writeRecoverableActivity(firstProcess);

    const secondProcess = new MemoryActivityStore(database);
    await secondProcess.initialize();
    const recovered = await secondProcess.loadActiveSession();
    const track = await secondProcess.loadTrack('activity-store-test');

    expect(recovered?.session.activityId).toBe('activity-store-test');
    expect(track.map((item) => item.sequence)).toEqual([1, 2]);
  });

  it('makes sample append idempotent by activity and sequence', async () => {
    const store = new MemoryActivityStore();
    await writeRecoverableActivity(store);
    await store.appendBatch('activity-store-test', [sample(2), sample(3)], snapshot(2));

    const track = await store.loadTrack('activity-store-test');
    expect(track.map((item) => item.sequence)).toEqual([1, 2, 3]);
  });

  it('does not recover FINISHED sessions as active', async () => {
    const store = new MemoryActivityStore();
    await writeRecoverableActivity(store);
    await store.updateSession(session('FINISHED'), snapshot(2, 'FINISHED'));

    expect(await store.loadActiveSession()).toBeNull();
    expect((await store.loadTrack('activity-store-test')).length).toBe(2);
  });

  it('persists exploration state and deduplicates the same activity target', async () => {
    const store = new MemoryActivityStore();
    await store.createSession(session(), snapshot(0));
    const observation: ExplorationObservation = {
      targetId: '00000000-0000-4000-8000-000000000021',
      targetKey: 'checkpoint:00000000-0000-4000-8000-000000000021',
      kind: 'checkpoint',
      observedAt: '2026-09-16T08:00:10.000Z',
      sampleSequence: 2,
      distanceMeters: 4,
      accuracyMeters: 7,
    };
    const exploration = {
      state: {
        progressByTargetKey: {},
        unlockedTargetKeys: [observation.targetKey],
        lastEvaluatedSequence: 2,
      },
      observations: [observation, { ...observation, sampleSequence: 3 }],
    };

    await store.appendBatch('activity-store-test', [], null, exploration);
    const recovered = await store.loadActiveSession();

    expect(recovered?.exploration.state.lastEvaluatedSequence).toBe(2);
    expect(recovered?.exploration.state.unlockedTargetKeys).toEqual([observation.targetKey]);
    expect(recovered?.exploration.observations).toHaveLength(1);
  });
});
