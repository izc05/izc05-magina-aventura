import type {
  ActivitySession,
  ActivitySnapshot,
  ActivitySyncBatch,
  LocationSample,
} from '@magina-aventura/contracts';

export interface RecoveredActivity {
  session: ActivitySession;
  snapshot: ActivitySnapshot;
  samplesAfterSnapshot: LocationSample[];
}

export interface ActivityStore {
  initialize(): Promise<void>;
  createSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
  ): Promise<void>;
  appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
  ): Promise<void>;
  loadActiveSession(): Promise<RecoveredActivity | null>;
  updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
  ): Promise<void>;
  loadTrack(activityId: string): Promise<LocationSample[]>;
  queueSyncBatch(batch: ActivitySyncBatch): Promise<ActivitySyncBatch>;
  loadPendingSyncBatches(activityId: string): Promise<ActivitySyncBatch[]>;
  markSyncBatchSynced(batchId: string): Promise<void>;
}
