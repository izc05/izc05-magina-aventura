import type { AdventureRouteCard } from './route-types';

/**
 * Development-only route data used to validate the first visual vertical.
 * These metrics are placeholders and MUST be replaced by verified route data
 * before any production release.
 */
export const developmentRoutes: AdventureRouteCard[] = [
  {
    id: 'dev-bedmar-cuadros-001',
    slug: 'sendero-de-cuadros-dev',
    title: 'Sendero de Cuadros',
    municipality: 'Bedmar y Garcíez',
    distanceKm: 8.7,
    elevationGainM: 412,
    durationMinutes: 150,
    difficulty: 'moderate',
    discoveries: 7,
    rewardXp: 750,
    rewardOlives: 120,
    developmentFixture: true,
  },
];
