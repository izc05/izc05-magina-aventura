export type ActivityState =
  | 'DRAFT'
  | 'ACTIVE'
  | 'PAUSED'
  | 'FINISHED'
  | 'VALIDATING'
  | 'VERIFIED'
  | 'REJECTED';

export type SyncState = 'local' | 'queued' | 'syncing' | 'synced' | 'failed';

export type LocationRejectionReason =
  | 'invalid_coordinate'
  | 'non_monotonic_time'
  | 'poor_accuracy'
  | 'impossible_speed';

export interface LocationSample {
  sequence: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
  validForMetrics: boolean;
  rejectionReason: LocationRejectionReason | null;
}

export interface ActivitySession {
  activityId: string;
  /** Adventure editorial identity pinned when the activity starts. */
  adventureSlug: string;
  /** Exact immutable AdventureDefinition version pinned at start. */
  adventureVersion: number;
  routeId: string;
  routeSlug: string;
  geometryVersion: number;
  state: ActivityState;
  startedAt: string;
  pausedAt: string | null;
  finishedAt: string | null;
  lastProcessedSequence: number;
  syncState: SyncState;
}

export interface ActivitySnapshot {
  activityId: string;
  state: ActivityState;
  lastProcessedSequence: number;
  validDistanceMeters: number;
  totalElapsedSeconds: number;
  movingElapsedSeconds: number;
  currentSpeedMps: number | null;
  paceSecondsPerKm: number | null;
  elevationGainMeters: number;
  elevationLossMeters: number;
  routeProgress: number;
  maxRouteProgress: number;
  distanceToRouteMeters: number | null;
  offRouteState: 'on_route' | 'uncertain' | 'off_route' | 'recovering';
  lastValidSample: LocationSample | null;
  algorithmVersion: 1;
  createdAt: string;
}

export type ActivityAction =
  | { type: 'START'; at: string }
  | { type: 'PAUSE'; at: string }
  | { type: 'RESUME'; at: string }
  | { type: 'FINISH'; at: string }
  | { type: 'LOCATION'; sample: LocationSample };

export interface ActivitySyncBatch {
  batchId: string;
  activityId: string;
  sequenceStart: number;
  sequenceEnd: number;
  idempotencyKey: string;
  samples: LocationSample[];
  snapshot: ActivitySnapshot | null;
  createdAt: string;
}
