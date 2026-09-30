import type {
  ActivityAction,
  ActivitySession,
  ActivitySnapshot,
  ActivitySyncBatch,
  LocationSample,
} from './activity';

const session: ActivitySession = {
  activityId: 'activity-test-1',
  adventureSlug: 'synthetic-adventure',
  adventureVersion: 2,
  routeId: 'route-test-1',
  routeSlug: 'synthetic-route',
  geometryVersion: 3,
  state: 'ACTIVE',
  startedAt: '2026-09-15T10:00:00.000Z',
  pausedAt: null,
  finishedAt: null,
  lastProcessedSequence: 0,
  syncState: 'local',
};

const sample: LocationSample = {
  sequence: 1,
  timestamp: '2026-09-15T10:00:05.000Z',
  latitude: 37,
  longitude: -3,
  accuracyMeters: 8,
  altitudeMeters: 900,
  speedMps: 1.2,
  headingDegrees: 90,
  validForMetrics: true,
  rejectionReason: null,
};

const action: ActivityAction = { type: 'LOCATION', sample };

const snapshot: ActivitySnapshot = {
  activityId: session.activityId,
  state: session.state,
  lastProcessedSequence: sample.sequence,
  validDistanceMeters: 0,
  totalElapsedSeconds: 0,
  activeIntervalStartedAt: sample.timestamp,
  gpsGapSecondsExcluded: 0,
  movingElapsedSeconds: 0,
  currentSpeedMps: null,
  paceSecondsPerKm: null,
  elevationGainMeters: 0,
  elevationLossMeters: 0,
  routeProgress: 0,
  maxRouteProgress: 0,
  distanceToRouteMeters: null,
  offRouteState: 'on_route',
  lastValidSample: sample,
  algorithmVersion: 1,
  createdAt: sample.timestamp,
};

const batch: ActivitySyncBatch = {
  batchId: 'batch-test-1',
  activityId: session.activityId,
  sequenceStart: sample.sequence,
  sequenceEnd: sample.sequence,
  idempotencyKey: 'activity-test-1:1:1',
  samples: [sample],
  snapshot,
  createdAt: sample.timestamp,
};

void session.adventureVersion;
void action.type;
void batch.idempotencyKey;
