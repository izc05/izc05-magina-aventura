export const brand = {
  name: 'Mágina Aventura',
  location: 'Sierra Mágina · Jaén',
  claim: 'Camina. Descubre. Conquista Mágina.',
  supportingClaim: 'Más que rutas, historias por vivir.',
  colors: {
    olive: '#2F4A2E',
    gold: '#D4AF37',
    limestone: '#E7E1D6',
    warmWhite: '#FAF9F6',
    sky: '#7FB3D9',
  },
  bottomNavigation: ['Rutas', 'Retos', 'Colecciones', 'Ranking', 'Perfil'] as const,
} as const;

export type BottomNavigationItem = (typeof brand.bottomNavigation)[number];
