import type { AdventureRouteCard } from '../routes/route-types';

export type HomePresentation = Readonly<{
  headline: string;
  searchPlaceholder: string;
  quickActions: readonly string[];
  featuredRoute: AdventureRouteCard | null;
}>;

export function presentHome(routes: readonly AdventureRouteCard[]): HomePresentation {
  return {
    headline: '',
    searchPlaceholder: '',
    quickActions: [],
    featuredRoute: routes[0] ?? null,
  };
}
