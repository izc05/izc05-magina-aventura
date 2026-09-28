import type {
  AdventureDefinition,
  RouteDetail,
} from '@magina-aventura/contracts';

import type { EnhancedRoutePayload } from '../map/map-layers';

function deterministicUuid(value: number): string {
  return `00000000-0000-4000-8000-${value.toString().padStart(12, '0')}`;
}

/**
 * Temporary physical-QA adapter that turns the verified development route
 * payload into the immutable AdventureDefinition required by ActivityRuntime.
 *
 * It deliberately refuses mismatched route identities instead of inventing a
 * fallback. Production will load this definition from published/offline content.
 */
export function createDevelopmentAdventureDefinition(
  route: RouteDetail,
  payload: EnhancedRoutePayload,
): AdventureDefinition {
  if (payload.routeId !== route.id) {
    throw new Error('Development map payload does not match the selected route');
  }
  if (payload.geometryVersion !== route.geometryVersion) {
    throw new Error('Development geometry version does not match the selected route');
  }

  const checkpointIds = payload.checkpoints.map((_, index) =>
    deterministicUuid(index + 1),
  );

  const checkpoints = payload.checkpoints.map((checkpoint, index) => ({
    id: checkpointIds[index]!,
    kind: 'checkpoint' as const,
    sequence: index,
    required: checkpoint.required,
    prerequisiteTargetKeys:
      index === 0 ? [] : [`checkpoint:${checkpointIds[index - 1]!}`],
    latitude: checkpoint.position[1],
    longitude: checkpoint.position[0],
    triggerRadiusMeters: checkpoint.triggerRadiusM,
  }));

  const discoveries = (payload.pois ?? []).map((poi, index) => ({
    id: deterministicUuid(101 + index),
    kind: 'discovery' as const,
    sequence: index,
    required: false,
    prerequisiteTargetKeys: [],
    latitude: poi.position[1],
    longitude: poi.position[0],
    triggerRadiusMeters: 30,
  }));

  return {
    slug: route.slug,
    version: route.contentVersion,
    routeId: route.id,
    geometryVersion: route.geometryVersion,
    gpx: {
      uri: `dev://routes/${route.slug}.gpx`,
      sha256: 'development-physical-qa',
    },
    offlineMap: {
      manifestUri: `dev://routes/${route.slug}/offline-manifest.json`,
      styleTemplateUri: 'dev://styles/magina-olive.json',
      contentHash: `dev-${route.geometryVersion}`,
    },
    explorationPolicy: {
      maxAccuracyMeters: 35,
      requiredConsecutiveSamples: 2,
      maxEvidenceGapSeconds: 20,
    },
    checkpoints,
    discoveries,
    missions: [],
    assets: [],
    scenes3d: [],
    progression: {
      xpRulesetVersion: 1,
      rewards: [
        {
          id: `route-xp-${route.id}`,
          kind: 'xp',
          amount: route.rewardPreview.xp,
        },
        {
          id: `route-olives-${route.id}`,
          kind: 'olives',
          amount: route.rewardPreview.olives,
        },
      ],
    },
  };
}
