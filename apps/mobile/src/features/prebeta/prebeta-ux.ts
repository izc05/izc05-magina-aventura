import type { BottomNavigationItem } from '../../theme/branding';
import type { AdventureRouteCard } from '../routes/route-types';

export type HomeDifficultyFilter = 'Todos' | 'Fácil' | 'Moderada' | 'Difícil';

export type BottomNavSelection =
  | Readonly<{ kind: 'navigate'; href: '/' }>
  | Readonly<{ kind: 'coming-soon'; label: Exclude<BottomNavigationItem, 'Rutas'> }>;

export function filterHomeRoutes(
  routes: readonly AdventureRouteCard[],
  _query: string,
  _filter: HomeDifficultyFilter,
): AdventureRouteCard[] {
  return [...routes];
}

export function resolveBottomNavSelection(item: BottomNavigationItem): BottomNavSelection {
  if (item === 'Rutas') return { kind: 'navigate', href: '/' };
  return { kind: 'coming-soon', label: 'Retos' };
}
