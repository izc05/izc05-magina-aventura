import type { RouteMapPayload } from '@magina-aventura/contracts';

import { developmentRoutes } from '../routes/fixtures';

/**
 * TEST DATA ONLY. These coordinates and checkpoints are illustrative fixtures
 * inherited from the existing development route. They are not verified Cuadros
 * / Bedmar geometry and must never be treated as production route content.
 */
export const TEST_ADVENTURE_SLUG = 'sendero-de-cuadros-dev';
export const TEST_DATA_LABEL = 'TEST DATA';

const route = developmentRoutes.find(({ slug }) => slug === TEST_ADVENTURE_SLUG);

if (!route) {
  throw new Error(`Missing development route fixture: ${TEST_ADVENTURE_SLUG}`);
}

export const testAdventureRoute = route;

/** TEST DATA ONLY: fictional route geometry for the visual prototype. */
export const testRouteMapPayload: RouteMapPayload = {
  routeId: route.id,
  slug: route.slug,
  geometryVersion: route.geometryVersion,
  line: {
    type: 'Feature',
    properties: { routeId: route.id, geometryVersion: route.geometryVersion },
    geometry: {
      type: 'LineString',
      coordinates: [
        [-3.431, 37.812],
        [-3.419, 37.819],
        [-3.408, 37.824],
        [-3.397, 37.831],
        [-3.388, 37.837],
      ],
    },
  },
  start: [-3.431, 37.812],
  bounds: [-3.44, 37.805, -3.38, 37.844],
  checkpoints: [
    {
      id: 'test-cuadros-checkpoint-01',
      name: 'Mirador de la Cruz',
      position: [-3.408, 37.824],
      triggerRadiusM: 35,
      required: true,
    },
    {
      id: 'test-cuadros-checkpoint-02',
      name: 'Olivo centenario',
      position: [-3.388, 37.837],
      triggerRadiusM: 30,
      required: false,
    },
  ],
  discoveryHints: [
    { id: 'test-discovery-flora-01', category: 'flora' },
    { id: 'test-discovery-olive-01', category: 'olive' },
  ],
  mapAsset: null,
};
