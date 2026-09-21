import type {
  ActivityAction,
  ActivitySession,
  GeoJsonPosition,
  LocationRejectionReason,
  LocationSample,
} from '@magina-aventura/contracts';

export const syntheticWalkRouteLine: GeoJsonPosition[] = [
  [-3.4102, 37.82],
  [-3.4092, 37.82],
  [-3.4082, 37.82],
];

export const syntheticWalkSession: ActivitySession = {
  activityId: 'activity-synthetic-walk',
  adventureSlug: 'synthetic-adventure',
  adventureVersion: 1,
  routeId: 'route-synthetic-walk',
  routeSlug: 'synthetic-walk',
  geometryVersion: 1,
  state: 'DRAFT',
  startedAt: '2026-09-16T08:00:00.000Z',
  pausedAt: null,
  finishedAt: null,
  lastProcessedSequence: 0,
  syncState: 'local',
};

function sample(
  sequence: number,
  timestamp: string,
  longitude: number,
  latitude: number,
  options: {
    accuracyMeters?: number;
    altitudeMeters?: number;
    validForMetrics?: boolean;
    rejectionReason?: LocationRejectionReason | null;
  } = {},
): LocationSample {
  return {
    sequence,
    timestamp,
    longitude,
    latitude,
    accuracyMeters: options.accuracyMeters ?? 7,
    altitudeMeters: options.altitudeMeters ?? 900,
    speedMps: 1.2,
    headingDegrees: 90,
    validForMetrics: options.validForMetrics ?? true,
    rejectionReason: options.rejectionReason ?? null,
  };
}

export const syntheticWalkActions: ActivityAction[] = [
  { type: 'START', at: '2026-09-16T08:00:00.000Z' },
  {
    type: 'LOCATION',
    sample: sample(1, '2026-09-16T08:00:10.000Z', -3.4100, 37.82),
  },
  {
    type: 'LOCATION',
    sample: sample(2, '2026-09-16T08:00:20.000Z', -3.4099, 37.82, {
      altitudeMeters: 905,
    }),
  },
  { type: 'PAUSE', at: '2026-09-16T08:00:21.000Z' },
  { type: 'RESUME', at: '2026-09-16T08:00:30.000Z' },
  {
    type: 'LOCATION',
    sample: sample(3, '2026-09-16T08:00:40.000Z', -3.4098, 37.82, {
      accuracyMeters: 90,
      validForMetrics: false,
      rejectionReason: 'poor_accuracy',
    }),
  },
  {
    type: 'LOCATION',
    sample: sample(4, '2026-09-16T08:00:50.000Z', -3.35, 37.86, {
      validForMetrics: false,
      rejectionReason: 'impossible_speed',
    }),
  },
  {
    type: 'LOCATION',
    sample: sample(5, '2026-09-16T08:01:00.000Z', -3.4097, 37.82, {
      altitudeMeters: 910,
    }),
  },
  {
    type: 'LOCATION',
    sample: sample(6, '2026-09-16T08:01:10.000Z', -3.4096, 37.8206),
  },
  {
    type: 'LOCATION',
    sample: sample(7, '2026-09-16T08:01:20.000Z', -3.4095, 37.8206),
  },
  {
    type: 'LOCATION',
    sample: sample(8, '2026-09-16T08:01:30.000Z', -3.4094, 37.8206),
  },
  {
    type: 'LOCATION',
    sample: sample(9, '2026-09-16T08:01:40.000Z', -3.4093, 37.82),
  },
  {
    type: 'LOCATION',
    sample: sample(10, '2026-09-16T08:01:50.000Z', -3.4092, 37.82),
  },
  {
    type: 'LOCATION',
    sample: sample(11, '2026-09-16T08:02:00.000Z', -3.4091, 37.82),
  },
  { type: 'FINISH', at: '2026-09-16T08:02:10.000Z' },
];

export const syntheticWalkCreatedAt = '2026-09-16T08:00:00.000Z';
