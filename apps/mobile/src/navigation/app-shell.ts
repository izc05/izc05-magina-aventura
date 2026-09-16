import type { BottomNavigationItem } from '../theme/branding';

export type AppShellHref = '/' | '/explore' | '/map' | '/community' | '/profile';

const destinations: Record<BottomNavigationItem, AppShellHref> = {
  Inicio: '/',
  Explorar: '/explore',
  Mapa: '/map',
  Comunidad: '/community',
  Perfil: '/profile',
};

export function destinationForBottomNavigation(item: BottomNavigationItem): AppShellHref {
  return destinations[item];
}
