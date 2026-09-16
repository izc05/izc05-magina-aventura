import { describe, expect, it } from 'vitest';

import { developmentRoutes } from '../routes/fixtures';
import { presentHome } from './home-presenter';

describe('Mágina Aventura home presenter', () => {
  it('builds the approved Inicio hierarchy from the available route data', () => {
    const presentation = presentHome(developmentRoutes);

    expect(presentation.headline).toBe('¿Qué aventura hacemos hoy?');
    expect(presentation.searchPlaceholder).toBe('Buscar rutas, lugares, experiencias…');
    expect(presentation.quickActions).toEqual(['Rutas', 'Mapa', 'Cerca de ti', 'Favoritos']);
    expect(presentation.featuredRoute).toBe(developmentRoutes[0]);
  });

  it('does not invent a featured route when the catalog is empty', () => {
    const presentation = presentHome([]);

    expect(presentation.featuredRoute).toBeNull();
  });
});
