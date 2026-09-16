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

  it('uses the approved mobile copy and primary navigation', () => {
    expect(brand.name).toBe('Mágina Aventura');
    expect(brand.location).toBe('Sierra Mágina · Jaén');
    expect(brand.claim).toBe('Camina. Descubre. Conquista Mágina.');
    expect(brand.supportingClaim).toBe('Más que rutas, vivencias que dejan huella.');
    expect(brand.bottomNavigation).toEqual([
      'Inicio',
      'Explorar',
      'Mapa',
      'Comunidad',
      'Perfil',
    ]);
  });

  it('pins the approved mountain-path-sun identity across app surfaces', () => {
    expect(brand.identity).toEqual({
      version: '2026-09-16-approved-logo',
      mark: 'mountain-path-sun',
      descriptor: 'SIERRA MÁGINA · JAÉN',
      fullLogoAsset: './assets/branding/magina-aventura-logo.svg',
      iconSourceAsset: './assets/branding/magina-aventura-icon.svg',
      appIconAsset: './assets/branding/icon.png',
      adaptiveIconAsset: './assets/branding/adaptive-icon.png',
      splashAsset: './assets/branding/splash-logo.png',
    });
  });
});
