import type { AdventureRouteCard } from './route-types';

/**
 * Development-only route data used to validate the first visual vertical.
 * These values are placeholders and MUST be replaced by verified route data
 * before any production release.
 */
export const developmentRoutes: AdventureRouteCard[] = [
  {
    id: 'dev-bedmar-cuadros-001',
    slug: 'sendero-de-cuadros-dev',
    title: 'Sendero de Cuadros',
    municipalityId: 'dev-bedmar-garciez',
    municipalityName: 'Bedmar y Garcíez',
    distanceKm: 8.7,
    elevationGainM: 412,
    durationMinutes: 150,
    difficulty: 'moderate',
    rewardPreview: {
      xp: 750,
      olives: 120,
      discoveries: 7,
    },
    contentVersion: 1,
    description: 'Contenido de desarrollo pendiente de validación editorial.',
    safetyNotes: ['Datos de seguridad pendientes de validación de campo.'],
    startLatitude: 37.823,
    startLongitude: -3.413,
    geometryVersion: 1,
    offlineAvailable: false,
    developmentFixture: true,
  },
];
