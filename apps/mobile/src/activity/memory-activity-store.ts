import type {
  ActivitySession,
  ActivitySnapshot,
  ActivitySyncBatch,
  LocationSample,
} from '@magina-aventura/contracts';

import type { ActivityStore, RecoveredActivity } from './activity-store';

export interface MemoryActivityStoreDatabase {
  sessions: Map<string, ActivitySession>;
  samples: Map<string, Map<number, LocationSample>>;
  snapshots: Map<string, Map<number, ActivitySnapshot>>;
  syncBatches: Map<string, ActivitySyncBatch>;
  syncedBatchIds: Set<string>;
}

export function createMemoryActivityStoreDatabase(): MemoryActivityStoreDatabase {
  return {
    sessions: new Map(),
    samples: new Map(),
    snapshots: new Map(),
    syncBatches: new Map(),
    syncedBatchIds: new Set(),
  };
}

function cloneSession(session: ActivitySession): ActivitySession {
  return { ...session };
}

function cloneSample(sample: LocationSample): LocationSample {
  return { ...sample };
}

function cloneSnapshot(snapshot: ActivitySnapshot): ActivitySnapshot {
  return {
    ...snapshot,
    lastValidSample: snapshot.lastValidSample
      ? cloneSample(snapshot.lastValidSample)
      : null,
  };
}

function cloneBatch(batch: ActivitySyncBatch): ActivitySyncBatch {
  return {
    ...batch,
    samples: batch.samples.map(cloneSample),
    snapshot: batch.snapshot ? cloneSnapshot(batch.snapshot) : null,
  };
}

function ensureSampleMap(
  database: MemoryActivityStoreDatabase,
  activityId: string,
): Map<number, LocationSample> {
  const existing = database.samples.get(activityId);
  if (existing) return existing;
  const created = new Map<number, LocationSample>();
  database.samples.set(activityId, created);
  return created;
}

function ensureSnapshotMap(
  database: MemoryActivityStoreDatabase,
  activityId: string,
): Map<number, ActivitySnapshot> {
  const existing = database.snapshots.get(activityId);
  if (existing) return existing;
  const created = new Map<number, ActivitySnapshot>();
  database.snapshots.set(activityId, created);
  return created;
}

function latestSnapshot(
  database: MemoryActivityStoreDatabase,
  activityId: string,
): ActivitySnapshot | null {
  const snapshots = database.snapshots.get(activityId);
  if (!snapshots || snapshots.size === 0) return null;
  const latestSequence = Math.max(...snapshots.keys());
  const snapshot = snapshots.get(latestSequence);
  return snapshot ? cloneSnapshot(snapshot) : null;
}

export class MemoryActivityStore implements ActivityStore {
  constructor(
    private readonly database: MemoryActivityStoreDatabase =
      createMemoryActivityStoreDatabase(),
  ) {}

  async initialize(): Promise<void> {
    return undefined;
  }

  async createSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
  ): Promise<void> {
    this.database.sessions.set(session.activityId, cloneSession(session));
    ensureSampleMap(this.database, session.activityId);
    ensureSnapshotMap(this.database, session.activityId).set(
      snapshot.lastProcessedSequence,
      cloneSnapshot(snapshot),
    );
  }

  async appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
  ): Promise<void> {
    const sampleMap = ensureSampleMap(this.database, activityId);

    for (const sample of samples) {
      if (!sampleMap.has(sample.sequence)) {
        sampleMap.set(sample.sequence, cloneSample(sample));
      }
    }

    if (!snapshot) return;

    ensureSnapshotMap(this.database, activityId).set(
      snapshot.lastProcessedSequence,
      cloneSnapshot(snapshot),
    );

    const session = this.database.sessions.get(activityId);
    if (session) {
      this.database.sessions.set(activityId, {
        ...session,
        lastProcessedSequence: snapshot.lastProcessedSequence,
      });
    }
  }

  async loadActiveSession(): Promise<RecoveredActivity | null> {
    const activeSession = [...this.database.sessions.values()]
      .filter(
        (session) => session.state === 'ACTIVE' || session.state === 'PAUSED',
      )
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];

    if (!activeSession) return null;

    const snapshot = latestSnapshot(this.database, activeSession.activityId);
    if (!snapshot) return null;

    const samplesAfterSnapshot = [...(
      this.database.samples.get(activeSession.activityId)?.values() ?? []
    )]
      .filter((sample) => sample.sequence > snapshot.lastProcessedSequence)
      .sort((left, right) => left.sequence - right.sequence)
      .map(cloneSample);

    return {
      session: cloneSession(activeSession),
      snapshot,
      samplesAfterSnapshot,
    };
  }

  async updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
  ): Promise<void> {
    this.database.sessions.set(session.activityId, {
      ...cloneSession(session),
      lastProcessedSequence: snapshot.lastProcessedSequence,
    });
    ensureSnapshotMap(this.database, session.activityId).set(
      snapshot.lastProcessedSequence,
      cloneSnapshot(snapshot),
    );
  }

  async loadTrack(activityId: string): Promise<LocationSample[]> {
    return [...(this.database.samples.get(activityId)?.values() ?? [])]
      .sort((left, right) => left.sequence - right.sequence)
      .map(cloneSample);
  }

  async queueSyncBatch(batch: ActivitySyncBatch): Promise<ActivitySyncBatch> {
    const existing = [...this.database.syncBatches.values()].find(
      (item) => item.idempotencyKey === batch.idempotencyKey,
    );
    if (existing) return cloneBatch(existing);

    this.database.syncBatches.set(batch.batchId, cloneBatch(batch));
    const session = this.database.sessions.get(batch.activityId);
    if (session) {
      this.database.sessions.set(batch.activityId, {
        ...session,
        syncState: 'queued',
      });
    }
    return cloneBatch(batch);
  }

  async loadPendingSyncBatches(activityId: string): Promise<ActivitySyncBatch[]> {
    return [...this.database.syncBatches.values()]
      .filter(
        (batch) =>
          batch.activityId === activityId &&
          !this.database.syncedBatchIds.has(batch.batchId),
      )
      .sort((left, right) => left.sequenceStart - right.sequenceStart)
      .map(cloneBatch);
  }

  async markSyncBatchSynced(batchId: string): Promise<void> {
    const batch = this.database.syncBatches.get(batchId);
    if (!batch) return;

    this.database.syncedBatchIds.add(batchId);
    const hasPendingForActivity = [...this.database.syncBatches.values()].some(
      (item) =>
        item.activityId === batch.activityId &&
        !this.database.syncedBatchIds.has(item.batchId),
    );
    const session = this.database.sessions.get(batch.activityId);
    if (session && !hasPendingForActivity) {
      this.database.sessions.set(batch.activityId, {
        ...session,
        syncState: 'synced',
      });
    }
  }
}
