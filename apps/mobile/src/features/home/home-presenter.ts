import type { AdventureRouteCard } from '../routes/route-types';

export type HomeQuickAction = 'Rutas' | 'Mapa' | 'Cerca de ti' | 'Favoritos';

export type HomePresentation = Readonly<{
  headline: string;
  searchPlaceholder: string;
  quickActions: readonly HomeQuickAction[];
  featuredRoute: AdventureRouteCard | null;
}>;

const quickActions: readonly HomeQuickAction[] = ['Rutas', 'Mapa', 'Cerca de ti', 'Favoritos'];

export function presentHome(routes: readonly AdventureRouteCard[]): HomePresentation {
  return {
    headline: '¿Qué aventura hacemos hoy?',
    searchPlaceholder: 'Buscar rutas, lugares, experiencias…',
    quickActions,
    featuredRoute: routes[0] ?? null,
  };
}
