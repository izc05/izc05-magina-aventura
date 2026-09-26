import { developmentRoutes } from './fixtures';
import { ma001PilotMapPayload } from './ma001-pilot-route';
import type { AdventureRouteCard } from './route-types';

const ma001PilotRoute: AdventureRouteCard = {
  id: 'MA-001',
  slug: 'las-vinas',
  title: 'Cuadros · Las Viñas',
  municipalityId: 'bedmar-y-garciez',
  municipalityName: 'Bedmar y Garcíez',
  distanceKm: 8.72,
  elevationGainM: 412,
  durationMinutes: 180,
  difficulty: 'moderate',
  rewardPreview: { xp: 0, olives: 0, discoveries: 0 },
  contentVersion: 2,
  description: 'Ruta piloto de contenido: agua, piedra, paisaje y memoria en el valle de Cuadros.',
  safetyNotes: [
    'La ficha oficial de Las Viñas figura temporalmente cerrada; esta versión es sólo una vista previa de desarrollo.',
    'Los checkpoints están pendientes de validación física y no activan recompensas GPS definitivas.',
  ],
  startLatitude: ma001PilotMapPayload.start[1],
  startLongitude: ma001PilotMapPayload.start[0],
  geometryVersion: ma001PilotMapPayload.geometryVersion,
  offlineAvailable: false,
  developmentFixture: true,
};

export function getDevelopmentRouteBySlug(
  slug: string | string[] | undefined,
): AdventureRouteCard | undefined {
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  return normalizedSlug === ma001PilotRoute.slug || normalizedSlug === 'cuadros-las-vinas'
    ? ma001PilotRoute
    : developmentRoutes.find((route) => route.slug === normalizedSlug);
}

export function difficultyLabel(difficulty: string | number | null | undefined): string {
  if (difficulty === 'easy' || difficulty === 1) return 'Fácil';
  if (difficulty === 'hard' || difficulty === 4 || difficulty === 5) return 'Difícil';
  if (difficulty == null) return 'Desconocida';
  return 'Moderada';
}

export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
