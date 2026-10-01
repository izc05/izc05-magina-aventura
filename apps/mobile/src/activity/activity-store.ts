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

export interface PassportGpsMetrics {
  sessionCount: number;
  distanceMeters: number;
  elapsedSeconds: number;
}

export interface PassportGpsSession {
  activityId: string;
  finishedAt: string;
  distanceMeters: number;
  elapsedSeconds: number;
  sampleCount: number;
}

export interface PassportGpsData {
  sessions: PassportGpsSession[];
  metrics: PassportGpsMetrics;
}

export interface RecoveredActivity {
  ownerId: string | null;
  session: ActivitySession;
  snapshot: ActivitySnapshot;
  samplesAfterSnapshot: LocationSample[];
  exploration: ExplorationPersistence;
  lastConsumedInboxId: number;
}

export interface ActivityStore {
  initialize(): Promise<void>;
  createSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    ownerId: string,
    exploration?: ExplorationPersistence,
  ): Promise<void>;
  appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
    exploration?: ExplorationPersistence,
    consumedInboxThrough?: number,
  ): Promise<void>;
  /** Loads only active personal data owned by this authenticated account. */
  loadActiveSession(ownerId: string): Promise<RecoveredActivity | null>;
  /** Internal background-only lookup; never render its result to an account UI. */
  loadActiveSessionForBackground(): Promise<RecoveredActivity | null>;
  updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration?: ExplorationPersistence,
  ): Promise<void>;
  finishSessionAndQueueSyncBatch(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration: ExplorationPersistence,
    batch: ActivitySyncBatch,
  ): Promise<ActivitySyncBatch>;
  loadTrack(activityId: string): Promise<LocationSample[]>;
  loadExploration(activityId: string): Promise<ExplorationPersistence>;
  queueSyncBatch(batch: ActivitySyncBatch): Promise<ActivitySyncBatch>;
  loadPendingSyncBatches(activityId: string): Promise<ActivitySyncBatch[]>;
  markSyncBatchSynced(batchId: string): Promise<void>;
  loadPassportGpsData(ownerId: string): Promise<PassportGpsData>;
  loadPassportGpsMetrics(ownerId: string): Promise<PassportGpsMetrics>;
}
