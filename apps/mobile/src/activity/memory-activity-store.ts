import type {
  ActivitySession,
  ActivitySnapshot,
  ActivitySyncBatch,
  LocationSample,
} from '@magina-aventura/contracts';
import type {
  ExplorationObservation,
  ExplorationState,
} from '@magina-aventura/activity-engine';

import type {
  ActivityStore,
  ExplorationPersistence,
  PassportGpsData,
  PassportGpsMetrics,
  PassportGpsSample,
  PassportGpsSession,
  PassportGpsSessionDetail,
  RecoveredActivity,
} from './activity-store';

export interface MemoryActivityStoreDatabase {
  sessions: Map<string, ActivitySession>;
  sessionOwners: Map<string, string | null>;
  samples: Map<string, Map<number, LocationSample>>;
  snapshots: Map<string, Map<number, ActivitySnapshot>>;
  explorations: Map<string, ExplorationPersistence>;
  lastConsumedInboxIds: Map<string, number>;
  syncBatches: Map<string, ActivitySyncBatch>;
  syncedBatchIds: Set<string>;
}

export function createMemoryActivityStoreDatabase(): MemoryActivityStoreDatabase {
  return {
    sessions: new Map(),
    sessionOwners: new Map(),
    samples: new Map(),
    snapshots: new Map(),
    explorations: new Map(),
    lastConsumedInboxIds: new Map(),
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

function cloneExploration(item: ExplorationPersistence): ExplorationPersistence {
  const observationsByTarget = new Map(
    item.observations.map((observation) => [observation.targetKey, observation]),
  );
  return {
    state: {
      progressByTargetKey: Object.fromEntries(
        Object.entries(item.state.progressByTargetKey).map(([key, value]) => [
          key,
          { ...value },
        ]),
      ),
      unlockedTargetKeys: [...item.state.unlockedTargetKeys],
      lastEvaluatedSequence: item.state.lastEvaluatedSequence,
    },
    observations: [...observationsByTarget.values()].map((observation) => ({ ...observation })),
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

const emptyExploration: ExplorationPersistence = {
  state: {
    progressByTargetKey: {},
    unlockedTargetKeys: [],
    lastEvaluatedSequence: 0,
  },
  observations: [],
};

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
    ownerId: string,
    exploration: ExplorationPersistence = emptyExploration,
  ): Promise<void> {
    if (!ownerId.trim()) throw new Error('An authenticated owner is required for a personal activity');
    this.database.sessions.set(session.activityId, cloneSession(session));
    this.database.sessionOwners.set(session.activityId, ownerId);
    ensureSampleMap(this.database, session.activityId);
    ensureSnapshotMap(this.database, session.activityId).set(
      snapshot.lastProcessedSequence,
      cloneSnapshot(snapshot),
    );
    this.database.explorations.set(session.activityId, cloneExploration(exploration));
    this.database.lastConsumedInboxIds.set(session.activityId, 0);
  }

  async appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
    exploration?: ExplorationPersistence,
    consumedInboxThrough?: number,
  ): Promise<void> {
    const sampleMap = ensureSampleMap(this.database, activityId);

    for (const sample of samples) {
      if (!sampleMap.has(sample.sequence)) {
        sampleMap.set(sample.sequence, cloneSample(sample));
      }
    }

    if (snapshot) {
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

    if (exploration) {
      this.database.explorations.set(activityId, cloneExploration(exploration));
    }

    if (consumedInboxThrough !== undefined) {
      const current = this.database.lastConsumedInboxIds.get(activityId) ?? 0;
      this.database.lastConsumedInboxIds.set(
        activityId,
        Math.max(current, consumedInboxThrough),
      );
    }
  }

  private async loadActiveSessionInternal(ownerId?: string): Promise<RecoveredActivity | null> {
    const activeSession = [...this.database.sessions.values()]
      .filter((session) => {
        const storedOwner = this.database.sessionOwners.get(session.activityId);
        return storedOwner !== null && storedOwner !== undefined
          && (ownerId === undefined || storedOwner === ownerId)
          && (session.state === 'ACTIVE' || session.state === 'PAUSED');
      })
      .sort((left, right) => right.startedAt.localeCompare(left.startedAt))[0];

    if (!activeSession) return null;

    const snapshot = latestSnapshot(this.database, activeSession.activityId);
    if (!snapshot) return null;

    const samplesAfterSnapshot = [
      ...(this.database.samples.get(activeSession.activityId)?.values() ?? []),
    ]
      .filter((sample) => sample.sequence > snapshot.lastProcessedSequence)
      .sort((left, right) => left.sequence - right.sequence)
      .map(cloneSample);

    return {
      ownerId: this.database.sessionOwners.get(activeSession.activityId) ?? null,
      session: cloneSession(activeSession),
      snapshot,
      samplesAfterSnapshot,
      exploration: await this.loadExploration(activeSession.activityId),
      lastConsumedInboxId:
        this.database.lastConsumedInboxIds.get(activeSession.activityId) ?? 0,
    };
  }

  async loadActiveSession(ownerId: string): Promise<RecoveredActivity | null> {
    if (!ownerId.trim()) throw new Error('An authenticated owner is required to load an activity');
    return this.loadActiveSessionInternal(ownerId);
  }

  async loadActiveSessionForBackground(): Promise<RecoveredActivity | null> {
    return this.loadActiveSessionInternal();
  }

  async updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration?: ExplorationPersistence,
  ): Promise<void> {
    this.database.sessions.set(session.activityId, {
      ...cloneSession(session),
      lastProcessedSequence: snapshot.lastProcessedSequence,
    });
    ensureSnapshotMap(this.database, session.activityId).set(
      snapshot.lastProcessedSequence,
      cloneSnapshot(snapshot),
    );
    if (exploration) {
      this.database.explorations.set(session.activityId, cloneExploration(exploration));
    }
  }

  async finishSessionAndQueueSyncBatch(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration: ExplorationPersistence,
    batch: ActivitySyncBatch,
  ): Promise<ActivitySyncBatch> {
    const existing = [...this.database.syncBatches.values()].find(
      (item) => item.idempotencyKey === batch.idempotencyKey,
    );

    this.database.sessions.set(session.activityId, {
      ...cloneSession(session),
      lastProcessedSequence: snapshot.lastProcessedSequence,
      syncState: 'queued',
    });
    ensureSnapshotMap(this.database, session.activityId).set(
      snapshot.lastProcessedSequence,
      cloneSnapshot(snapshot),
    );
    this.database.explorations.set(
      session.activityId,
      cloneExploration(exploration),
    );

    if (existing) return cloneBatch(existing);

    const queued = {
      ...batch,
      snapshot: batch.snapshot ? cloneSnapshot(batch.snapshot) : null,
      samples: batch.samples.map(cloneSample),
    };
    this.database.syncBatches.set(batch.batchId, queued);
    return cloneBatch(queued);
  }

  async loadTrack(activityId: string): Promise<LocationSample[]> {
    return [...(this.database.samples.get(activityId)?.values() ?? [])]
      .sort((left, right) => left.sequence - right.sequence)
      .map(cloneSample);
  }

  async loadExploration(activityId: string): Promise<ExplorationPersistence> {
    return cloneExploration(this.database.explorations.get(activityId) ?? emptyExploration);
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

  async loadPassportGpsData(ownerId: string): Promise<PassportGpsData> {
    if (!ownerId.trim()) throw new Error('An authenticated owner is required to load personal GPS data');
    const sessions: PassportGpsSession[] = [...this.database.sessions.values()]
      .filter((session) =>
        this.database.sessionOwners.get(session.activityId) === ownerId
        && session.state === 'FINISHED'
        && session.recordingSource === 'device-gps'
        && session.finishedAt !== null,
      )
      .sort((left, right) => (right.finishedAt ?? '').localeCompare(left.finishedAt ?? ''))
      .map((session) => {
        const snapshot = latestSnapshot(this.database, session.activityId);
        return {
          activityId: session.activityId,
          finishedAt: session.finishedAt!,
          distanceMeters: snapshot?.validDistanceMeters ?? 0,
          elapsedSeconds: snapshot?.totalElapsedSeconds ?? 0,
          sampleCount: this.database.samples.get(session.activityId)?.size ?? 0,
        };
      });

    return {
      sessions,
      metrics: sessions.reduce<PassportGpsMetrics>((metrics, session) => ({
        sessionCount: metrics.sessionCount + 1,
        distanceMeters: metrics.distanceMeters + session.distanceMeters,
        elapsedSeconds: metrics.elapsedSeconds + session.elapsedSeconds,
      }), { sessionCount: 0, distanceMeters: 0, elapsedSeconds: 0 }),
    };
  }

  async loadPassportGpsMetrics(ownerId: string): Promise<PassportGpsMetrics> {
    return (await this.loadPassportGpsData(ownerId)).metrics;
  }

  async loadPassportGpsSessionDetail(
    ownerId: string,
    activityId: string,
  ): Promise<PassportGpsSessionDetail | null> {
    if (!ownerId.trim()) throw new Error('An authenticated owner is required to load personal GPS data');
    const session = this.database.sessions.get(activityId);
    if (
      !session ||
      this.database.sessionOwners.get(activityId) !== ownerId ||
      session.state !== 'FINISHED' ||
      session.recordingSource !== 'device-gps' ||
      !session.finishedAt ||
      !Number.isFinite(Date.parse(session.finishedAt))
    ) return null;

    const snapshot = latestSnapshot(this.database, activityId);
    const samples = [...(this.database.samples.get(activityId)?.values() ?? [])]
      .sort((left, right) => left.sequence - right.sequence);
    if (
      !snapshot ||
      snapshot.state !== 'FINISHED' ||
      snapshot.lastProcessedSequence !== session.lastProcessedSequence ||
      snapshot.createdAt !== session.finishedAt ||
      samples.length === 0 ||
      samples.at(-1)?.sequence !== session.lastProcessedSequence
    ) return null;

    let previousSequence = 0;
    const detailSamples: PassportGpsSample[] = [];
    for (const sample of samples) {
      if (
        !Number.isInteger(sample.sequence) ||
        sample.sequence <= previousSequence ||
        sample.sequence > session.lastProcessedSequence ||
        !Number.isFinite(Date.parse(sample.timestamp)) ||
        !Number.isFinite(sample.latitude) ||
        !Number.isFinite(sample.longitude) ||
        !Number.isFinite(sample.accuracyMeters) ||
        sample.accuracyMeters < 0 ||
        sample.validForMetrics !== (sample.rejectionReason === null)
      ) return null;
      const contextSnapshot = [...(this.database.snapshots.get(activityId)?.values() ?? [])]
        .filter((item) => item.lastProcessedSequence <= sample.sequence && item.createdAt <= sample.timestamp)
        .sort((left, right) => right.lastProcessedSequence - left.lastProcessedSequence)[0];
      detailSamples.push({
        sequence: sample.sequence,
        timestamp: sample.timestamp,
        latitude: sample.latitude,
        longitude: sample.longitude,
        accuracyMeters: sample.accuracyMeters,
        validForMetrics: sample.validForMetrics,
        rejectionReason: sample.rejectionReason,
        activeIntervalStartedAt: contextSnapshot?.activeIntervalStartedAt ?? null,
      });
      previousSequence = sample.sequence;
    }

    return {
      activityId,
      finishedAt: session.finishedAt,
      distanceMeters: snapshot.validDistanceMeters,
      elapsedSeconds: snapshot.totalElapsedSeconds,
      sampleCount: detailSamples.length,
      samples: detailSamples,
    };
  }

  async deletePassportGpsSession(ownerId: string, activityId: string): Promise<boolean> {
    if (!ownerId.trim() || !activityId.trim() || activityId.length > 200) return false;
    const detail = await this.loadPassportGpsSessionDetail(ownerId, activityId);
    if (!detail) return false;

    this.database.sessions.delete(activityId);
    this.database.sessionOwners.delete(activityId);
    this.database.samples.delete(activityId);
    this.database.snapshots.delete(activityId);
    this.database.explorations.delete(activityId);
    this.database.lastConsumedInboxIds.delete(activityId);
    for (const [batchId, batch] of this.database.syncBatches) {
      if (batch.activityId === activityId) {
        this.database.syncBatches.delete(batchId);
        this.database.syncedBatchIds.delete(batchId);
      }
    }
    return true;
  }
}
