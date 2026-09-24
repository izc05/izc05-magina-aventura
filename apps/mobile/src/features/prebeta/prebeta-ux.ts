import type { BottomNavigationItem } from '../../theme/branding';
import type { MobileRouteView } from '../routes/mobile-route-view';

export const HOME_DIFFICULTY_FILTERS = ['Todos', 'Fácil', 'Moderada', 'Difícil'] as const;

export type HomeDifficultyFilter = (typeof HOME_DIFFICULTY_FILTERS)[number];

export type BottomNavHref = '/' | '/challenges' | '/collections' | '/ranking' | '/profile';

export type BottomNavSelection = Readonly<{ kind: 'navigate'; href: BottomNavHref }>;

const difficultyByFilter: Record<Exclude<HomeDifficultyFilter, 'Todos'>, number> = {
  Fácil: 1,
  Moderada: 2,
  Difícil: 4,
};

function normalizeSearchValue(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLocaleLowerCase('es');
}

export function filterHomeRoutes(
  routes: readonly MobileRouteView[],
  query: string,
  filter: HomeDifficultyFilter,
): MobileRouteView[] {
  const normalizedQuery = normalizeSearchValue(query);
  const difficulty = filter === 'Todos' ? null : difficultyByFilter[filter];

  return routes.filter((route) => {
    if (difficulty !== null && route.difficulty !== difficulty) return false;
    if (!normalizedQuery) return true;

    const searchableText = normalizeSearchValue(
      `${route.title} ${route.municipalityNames.join(" ")} ${route.slug}`,
    );

    return searchableText.includes(normalizedQuery);
  });
}

const NAV_MAP: Record<BottomNavigationItem, BottomNavHref> = {
  Rutas: '/',
  Retos: '/challenges',
  Colecciones: '/collections',
  Ranking: '/ranking',
  Perfil: '/profile',
};

export function resolveBottomNavSelection(item: BottomNavigationItem): BottomNavSelection {
  return { kind: 'navigate', href: NAV_MAP[item] };
}
