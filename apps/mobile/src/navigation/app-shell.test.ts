import { describe, expect, it } from 'vitest';

import { destinationForBottomNavigation } from './app-shell';

describe('Mágina Aventura app shell', () => {
  it('maps the five approved primary tabs to real Expo routes', () => {
    expect(destinationForBottomNavigation('Inicio')).toBe('/');
    expect(destinationForBottomNavigation('Explorar')).toBe('/explore');
    expect(destinationForBottomNavigation('Mapa')).toBe('/map');
    expect(destinationForBottomNavigation('Comunidad')).toBe('/community');
    expect(destinationForBottomNavigation('Perfil')).toBe('/profile');
  });
});
