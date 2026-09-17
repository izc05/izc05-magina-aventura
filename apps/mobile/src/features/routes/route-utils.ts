import { developmentRoutes } from './fixtures';
import type { AdventureRouteCard } from './route-types';

export function getDevelopmentRouteBySlug(
  slug: string | string[] | undefined,
): AdventureRouteCard | undefined {
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  return developmentRoutes.find((route) => route.slug === normalizedSlug);
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
