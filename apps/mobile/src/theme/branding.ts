export const brand = {
  name: 'Mágina Aventura',
  location: 'Sierra Mágina · Jaén',
  claim: 'Camina. Descubre. Conquista Mágina.',
  supportingClaim: 'Más que rutas, vivencias que dejan huella.',
  identity: {
    version: '2026-09-16-approved-logo',
    mark: 'mountain-path-sun',
    descriptor: 'SIERRA MÁGINA · JAÉN',
    fullLogoAsset: './assets/branding/magina-aventura-logo.svg',
    iconSourceAsset: './assets/branding/magina-aventura-icon.svg',
    appIconAsset: './assets/branding/icon.png',
    adaptiveIconAsset: './assets/branding/adaptive-icon.png',
    splashAsset: './assets/branding/splash-logo.png',
  },
  colors: {
    olive: '#2F4A2E',
    gold: '#D4AF37',
    limestone: '#E7E1D6',
    warmWhite: '#FAF9F6',
    sky: '#7FB3D9',
  },
  bottomNavigation: ['Inicio', 'Explorar', 'Mapa', 'Comunidad', 'Perfil'] as const,
} as const;

export type BottomNavigationItem = (typeof brand.bottomNavigation)[number];
