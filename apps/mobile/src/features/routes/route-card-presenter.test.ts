import { describe, expect, it } from 'vitest';

import { developmentRoutes } from './fixtures';
import { presentFeaturedRoute } from './route-card-presenter';

describe('featured route card presentation', () => {
  it('shows verified basics while marking unvalidated beta data as pending', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentFeaturedRoute(route)).toEqual({
      distance: '2,3 km',
      elevation: 'Pendiente',
      duration: '1 h',
      difficulty: 'Fácil',
      rewards: 'Recompensas pendientes de validación',
    });
  });
});
