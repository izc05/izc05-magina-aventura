import type { AdventureRouteCard } from './route-types';

/**
 * Development route data used to validate visual verticals, map layers,
 * elevation profiles, and offline package flows.
 */
export const developmentRoutes: (AdventureRouteCard & {
  slug: string;
})[] = [
  {
    id: 'dev-bedmar-cuadros-001',
    slug: 'sendero-de-cuadros-dev',
    title: 'Sendero de Cuadros y Adarves',
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
    description:
      'Recorrido entre adarves históricos, la fuente de Cuadros y el río Cuadros. Paisaje dominado por olivos centenarios y formación kárstica.',
    safetyNotes: [
      'Tramo con piedras sueltas cerca de la garganta.',
      'Llevar agua suficiente en meses estivales.',
    ],
    startLatitude: 37.823,
    startLongitude: -3.413,
    geometryVersion: 1,
    offlineAvailable: true,
    developmentFixture: true,
  },
  {
    id: 'dev-pico-magina-002',
    slug: 'subida-pico-magina-dev',
    title: 'Ascensión al Pico Mágina (2.167m)',
    municipalityId: 'dev-albanchez',
    municipalityName: 'Albanchez de Mágina',
    distanceKm: 14.2,
    elevationGainM: 1150,
    durationMinutes: 330,
    difficulty: 'hard',
    rewardPreview: {
      xp: 1500,
      olives: 300,
      discoveries: 12,
    },
    contentVersion: 1,
    description:
      'El techo de la provincia de Jaén. Vistas espectaculares de Sierra Nevada y el mar de olivos. Vegetación de alta montaña y pozo de nieve.',
    safetyNotes: [
      'Alta montaña: el clima puede cambiar rápidamente.',
      'Requiere calzado técnico de montaña y protección solar.',
    ],
    startLatitude: 37.712,
    startLongitude: -3.456,
    geometryVersion: 1,
    offlineAvailable: true,
    developmentFixture: true,
  },
  {
    id: 'dev-cueva-agua-003',
    slug: 'cueva-del-agua-dev',
    title: 'Ruta Cueva del Agua y Coleto',
    municipalityId: 'dev-cambil',
    municipalityName: 'Cambil',
    distanceKm: 5.4,
    elevationGainM: 220,
    durationMinutes: 90,
    difficulty: 'easy',
    rewardPreview: {
      xp: 450,
      olives: 75,
      discoveries: 4,
    },
    contentVersion: 1,
    description:
      'Paseo familiar por el barranco del río y la impresionante Cueva del Agua. Abundantes surgencias de agua cristalina y sombra natural.',
    safetyNotes: [
      'Suelo resbaladizo en la entrada de la cueva.',
      'Apto para familias y niños.',
    ],
    startLatitude: 37.678,
    startLongitude: -3.564,
    geometryVersion: 1,
    offlineAvailable: true,
    developmentFixture: true,
  },
];
