import { developmentRoutes } from './fixtures';
import { devAdventureEngineTestRoute } from './dev-adventure-engine-test';
import type { AdventureRouteCard } from './route-types';

export function getDevelopmentRouteBySlug(
  slug: string | string[] | undefined,
): AdventureRouteCard | undefined {
  const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
  if (__DEV__ && normalizedSlug === devAdventureEngineTestRoute.slug) {
    return devAdventureEngineTestRoute;
  }
  return developmentRoutes.find((route) => route.slug === normalizedSlug);
}

export function difficultyLabel(difficulty: AdventureRouteCard['difficulty']): string {
  if (difficulty === 'easy') return 'Fácil';
  if (difficulty === 'hard') return 'Difícil';
  return 'Moderada';
}

export function durationLabel(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} h`;
  return `${hours} h ${rest} min`;
}
