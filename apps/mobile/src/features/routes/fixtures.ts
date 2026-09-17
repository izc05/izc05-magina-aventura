import type { AdventureRouteCard } from './route-types';

/**
 * Development-only route data used to validate the first visual vertical.
 * Only the explicitly verified basics below are exposed in the pre-beta.
 * Geometry, elevation, rewards and route guidance remain pending until their
 * authoritative sources are integrated.
 */
export const developmentRoutes: AdventureRouteCard[] = [
  {
    id: 'prebeta-cambil-el-peralejo-001',
    slug: 'el-peralejo-prebeta',
    title: 'El Peralejo',
    municipalityId: 'cambil',
    municipalityName: 'Cambil',
    distanceKm: 2.268,
    elevationGainM: 0,
    durationMinutes: 60,
    difficulty: 'easy',
    rewardPreview: {
      xp: 0,
      olives: 0,
      discoveries: 0,
    },
    contentVersion: 1,
    description:
      'Datos básicos verificados para la prueba pre-beta; el trazado GPS oficial pendiente de incorporación.',
    safetyNotes: [
      'Comprueba el estado operativo y las condiciones de seguridad de la ruta antes de iniciar la actividad.',
    ],
    startLatitude: 37.689886,
    startLongitude: -3.487147,
    geometryVersion: 1,
    offlineAvailable: false,
    developmentFixture: true,
  },
];
