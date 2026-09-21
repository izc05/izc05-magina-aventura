import type {
  AdventureDefinition,
  AdventureTargetDefinition,
  GeoJsonPosition,
  OfflineRoutePackageManifest,
  RouteDetail,
  RouteMapPayload,
} from '@magina-aventura/contracts';

/**
 * Explicitly synthetic TEST DATA. This module must never be imported by a
 * production content repository or used as a fallback for an unknown slug.
 */
export const DEV_ADVENTURE_ENGINE_TEST_SLUG = 'dev-adventure-engine-test';
export const DEV_TEST_ROUTE_ID = 'dev-route-engine-test-001';
export const DEV_TEST_GEOMETRY_VERSION = 1;

const TEST_DATA_COORDINATES = {
  start: [-105.0000, 40.0000] as GeoJsonPosition,
  checkpoint1: [-104.9990, 40.0000] as GeoJsonPosition,
  checkpoint2: [-104.9980, 40.0000] as GeoJsonPosition,
  discovery: [-104.9970, 40.0000] as GeoJsonPosition,
  checkpoint3: [-104.9960, 40.0000] as GeoJsonPosition,
};

const checkpoint1Id = '00000000-0000-4000-8000-000000000101';
const checkpoint2Id = '00000000-0000-4000-8000-000000000102';
const discoveryId = '00000000-0000-4000-8000-000000000201';
const checkpoint3Id = '00000000-0000-4000-8000-000000000103';

export const DEV_TEST_TARGET_KEYS = {
  checkpoint1: `checkpoint:${checkpoint1Id}`,
  checkpoint2: `checkpoint:${checkpoint2Id}`,
  discovery: `discovery:${discoveryId}`,
  checkpoint3: `checkpoint:${checkpoint3Id}`,
} as const;

function target(
  id: string,
  kind: AdventureTargetDefinition['kind'],
  sequence: number,
  position: GeoJsonPosition,
  prerequisiteTargetKeys: string[] = [],
): AdventureTargetDefinition {
  return {
    id,
    kind,
    sequence,
    required: kind === 'checkpoint',
    prerequisiteTargetKeys,
    longitude: position[0],
    latitude: position[1],
    triggerRadiusMeters: 45,
  };
}

export const devAdventureEngineTestDefinition: AdventureDefinition = {
  slug: DEV_ADVENTURE_ENGINE_TEST_SLUG,
  version: 1,
  routeId: DEV_TEST_ROUTE_ID,
  geometryVersion: DEV_TEST_GEOMETRY_VERSION,
  gpx: {
    uri: 'test-data://dev-adventure-engine-test/route.gpx',
    sha256: 'test-data-route-sha256',
  },
  offlineMap: {
    manifestUri: 'test-data://dev-adventure-engine-test/manifest.json',
    styleTemplateUri: 'test-data://dev-adventure-engine-test/style.json',
    contentHash: 'test-data-map-content-hash',
  },
  explorationPolicy: {
    maxAccuracyMeters: 20,
    requiredConsecutiveSamples: 1,
    maxEvidenceGapSeconds: 30,
  },
  checkpoints: [
    target(checkpoint1Id, 'checkpoint', 1, TEST_DATA_COORDINATES.checkpoint1),
    target(checkpoint2Id, 'checkpoint', 2, TEST_DATA_COORDINATES.checkpoint2, [DEV_TEST_TARGET_KEYS.checkpoint1]),
    target(checkpoint3Id, 'checkpoint', 4, TEST_DATA_COORDINATES.checkpoint3, [DEV_TEST_TARGET_KEYS.discovery]),
  ],
  discoveries: [
    target(discoveryId, 'discovery', 3, TEST_DATA_COORDINATES.discovery, [DEV_TEST_TARGET_KEYS.checkpoint2]),
  ],
  missions: [
    {
      id: 'test-mission-complete-sequence',
      requiredTargetKeys: [
        DEV_TEST_TARGET_KEYS.checkpoint1,
        DEV_TEST_TARGET_KEYS.checkpoint2,
        DEV_TEST_TARGET_KEYS.discovery,
        DEV_TEST_TARGET_KEYS.checkpoint3,
      ],
    },
  ],
  assets: [],
  scenes3d: [],
  progression: {
    xpRulesetVersion: 1,
    rewards: [],
  },
};

export const devAdventureEngineTestRoute: RouteDetail = {
  id: DEV_TEST_ROUTE_ID,
  slug: DEV_ADVENTURE_ENGINE_TEST_SLUG,
  title: 'Adventure Engine v2 · TEST DATA',
  municipalityId: 'test-data-only',
  municipalityName: 'TEST DATA ONLY',
  distanceKm: 0.35,
  elevationGainM: 0,
  durationMinutes: 5,
  difficulty: 'easy',
  rewardPreview: { xp: 0, olives: 0, discoveries: 1 },
  contentVersion: 1,
  description: 'Ruta sintética aislada para probar el Adventure Engine v2.',
  safetyNotes: ['TEST DATA. No representa una ruta real.'],
  startLatitude: TEST_DATA_COORDINATES.start[1],
  startLongitude: TEST_DATA_COORDINATES.start[0],
  geometryVersion: DEV_TEST_GEOMETRY_VERSION,
  offlineAvailable: false,
  developmentFixture: true,
};

export const devAdventureEngineTestMapPayload: RouteMapPayload = {
  routeId: DEV_TEST_ROUTE_ID,
  slug: DEV_ADVENTURE_ENGINE_TEST_SLUG,
  geometryVersion: DEV_TEST_GEOMETRY_VERSION,
  line: {
    type: 'Feature',
    properties: {
      routeId: DEV_TEST_ROUTE_ID,
      geometryVersion: DEV_TEST_GEOMETRY_VERSION,
    },
    geometry: {
      type: 'LineString',
      coordinates: Object.values(TEST_DATA_COORDINATES),
    },
  },
  start: TEST_DATA_COORDINATES.start,
  bounds: [-105.001, 39.999, -104.995, 40.001],
  checkpoints: [
    { id: checkpoint1Id, name: 'TEST CHECKPOINT 1', position: TEST_DATA_COORDINATES.checkpoint1, triggerRadiusM: 45, required: true },
    { id: checkpoint2Id, name: 'TEST CHECKPOINT 2', position: TEST_DATA_COORDINATES.checkpoint2, triggerRadiusM: 45, required: true },
    { id: checkpoint3Id, name: 'TEST CHECKPOINT 3', position: TEST_DATA_COORDINATES.checkpoint3, triggerRadiusM: 45, required: true },
  ],
  discoveryHints: [{ id: discoveryId, category: 'landscape' }],
  mapAsset: null,
};

export const devAdventureEngineTestManifest: OfflineRoutePackageManifest | null = null;

export const devAdventureEngineTestPositions = {
  checkpoint1: TEST_DATA_COORDINATES.checkpoint1,
  checkpoint2: TEST_DATA_COORDINATES.checkpoint2,
  discovery: TEST_DATA_COORDINATES.discovery,
  checkpoint3: TEST_DATA_COORDINATES.checkpoint3,
} as const;
