import { describe, expect, it } from 'vitest';

import { brand } from './branding';

describe('Mágina Aventura branding contract', () => {
  it('uses the approved palette', () => {
    expect(brand.colors).toEqual({
      olive: '#2F4A2E',
      gold: '#D4AF37',
      limestone: '#E7E1D6',
      warmWhite: '#FAF9F6',
      sky: '#7FB3D9',
    });
  });

  it('uses the approved brand copy and bottom navigation', () => {
    expect(brand.name).toBe('Mágina Aventura');
    expect(brand.location).toBe('Sierra Mágina · Jaén');
    expect(brand.claim).toBe('Camina. Descubre. Conquista Mágina.');
    expect(brand.bottomNavigation).toEqual([
      'Rutas',
      'Retos',
      'Colecciones',
      'Ranking',
      'Perfil',
    ]);
  });
});
