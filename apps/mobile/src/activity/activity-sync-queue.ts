import type {
  ActivitySnapshot,
  ActivitySyncBatch,
  LocationSample,
} from '@magina-aventura/contracts';

import type { ActivityStore } from './activity-store';

export interface ActivitySyncQueueDependencies {
  store: ActivityStore;
  now(): string;
}

export function createActivitySyncQueue(dependencies: ActivitySyncQueueDependencies) {
  return {
    async enqueue(
      activityId: string,
      samples: readonly LocationSample[],
      snapshot: ActivitySnapshot | null,
    ): Promise<ActivitySyncBatch> {
      if (samples.length === 0) {
        throw new Error('Cannot queue an empty activity track batch');
      }

      const sortedSamples = [...samples].sort(
        (left, right) => left.sequence - right.sequence,
      );
      const sequenceStart = sortedSamples[0]!.sequence;
      const sequenceEnd = sortedSamples[sortedSamples.length - 1]!.sequence;
      const idempotencyKey = `activity:${activityId}:track:${sequenceStart}-${sequenceEnd}`;
      const batch: ActivitySyncBatch = {
        batchId: idempotencyKey,
        activityId,
        sequenceStart,
        sequenceEnd,
        idempotencyKey,
        samples: sortedSamples,
        snapshot,
        createdAt: dependencies.now(),
      };

      return dependencies.store.queueSyncBatch(batch);
    },

    pending(activityId: string): Promise<ActivitySyncBatch[]> {
      return dependencies.store.loadPendingSyncBatches(activityId);
    },

    markSynced(batchId: string): Promise<void> {
      return dependencies.store.markSyncBatchSynced(batchId);
    },
  };
}

export type ActivitySyncQueue = ReturnType<typeof createActivitySyncQueue>;
