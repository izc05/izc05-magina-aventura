import type { BottomNavigationItem } from '../theme/branding';

export type AppShellHref = '/' | '/explore' | '/map' | '/community' | '/profile';

export function destinationForBottomNavigation(_item: BottomNavigationItem): AppShellHref {
  return '/';
}
