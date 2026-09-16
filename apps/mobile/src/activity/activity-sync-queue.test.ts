import type { ActivitySnapshot, LocationSample } from '@magina-aventura/contracts';
import { describe, expect, it } from 'vitest';

import { createActivitySyncQueue } from './activity-sync-queue';
import {
  MemoryActivityStore,
  createMemoryActivityStoreDatabase,
} from './memory-activity-store';

function sample(sequence: number): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-16T10:00:${String(sequence).padStart(2, '0')}.000Z`,
    latitude: 37 + sequence * 0.00001,
    longitude: -3,
    accuracyMeters: 6,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };
}

const snapshot: ActivitySnapshot = {
  activityId: 'activity-sync',
  state: 'FINISHED',
  lastProcessedSequence: 3,
  validDistanceMeters: 20,
  totalElapsedSeconds: 30,
  movingElapsedSeconds: 25,
  currentSpeedMps: 0,
  paceSecondsPerKm: null,
  elevationGainMeters: 0,
  elevationLossMeters: 0,
  routeProgress: 0.1,
  maxRouteProgress: 0.1,
  distanceToRouteMeters: 3,
  offRouteState: 'on_route',
  lastValidSample: sample(3),
  algorithmVersion: 1,
  createdAt: '2026-09-16T10:00:30.000Z',
};

describe('activity sync queue', () => {
  it('deduplicates the same activity sequence range with a stable idempotency key', async () => {
    const store = new MemoryActivityStore(createMemoryActivityStoreDatabase());
    const queue = createActivitySyncQueue({
      store,
      now: () => '2026-09-16T10:01:00.000Z',
    });

    const samples = [sample(1), sample(2), sample(3)];

    const first = await queue.enqueue('activity-sync', samples, snapshot);
    const second = await queue.enqueue('activity-sync', samples, snapshot);
    const pending = await queue.pending('activity-sync');

    expect(first.idempotencyKey).toBe('activity:activity-sync:track:1-3');
    expect(second.idempotencyKey).toBe(first.idempotencyKey);
    expect(pending).toHaveLength(1);
    expect(pending[0]?.samples.map((item) => item.sequence)).toEqual([1, 2, 3]);
  });

  it('rejects an empty sample range instead of creating a meaningless batch', async () => {
    const store = new MemoryActivityStore(createMemoryActivityStoreDatabase());
    const queue = createActivitySyncQueue({
      store,
      now: () => '2026-09-16T10:01:00.000Z',
    });

    await expect(queue.enqueue('activity-sync', [], snapshot)).rejects.toThrow(
      'Cannot queue an empty activity track batch',
    );
  });
});
