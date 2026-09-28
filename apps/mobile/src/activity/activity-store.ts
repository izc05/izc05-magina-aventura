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

export interface ExplorationPersistence {
  state: ExplorationState;
  observations: ExplorationObservation[];
}

export interface RecoveredActivity {
  session: ActivitySession;
  snapshot: ActivitySnapshot;
  samplesAfterSnapshot: LocationSample[];
  exploration: ExplorationPersistence;
}

export interface ActivityStore {
  initialize(): Promise<void>;
  createSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration?: ExplorationPersistence,
  ): Promise<void>;
  appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
    exploration?: ExplorationPersistence,
  ): Promise<void>;
  loadActiveSession(): Promise<RecoveredActivity | null>;
  updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration?: ExplorationPersistence,
  ): Promise<void>;
  loadTrack(activityId: string): Promise<LocationSample[]>;
  loadExploration(activityId: string): Promise<ExplorationPersistence>;
  queueSyncBatch(batch: ActivitySyncBatch): Promise<ActivitySyncBatch>;
  loadPendingSyncBatches(activityId: string): Promise<ActivitySyncBatch[]>;
  markSyncBatchSynced(batchId: string): Promise<void>;
}
