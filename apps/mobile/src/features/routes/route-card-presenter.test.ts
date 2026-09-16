import { describe, expect, it } from 'vitest';

import { developmentRoutes } from './fixtures';
import { presentFeaturedRoute } from './route-card-presenter';

describe('featured route card presentation', () => {
  it('formats route metrics and rewards for the approved Spanish UI', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentFeaturedRoute(route)).toEqual({
      distance: '8,7 km',
      elevation: '+412 m',
      duration: '2 h 30 min',
      difficulty: 'Moderada',
      rewards: '7 descubrimientos · +750 XP · +120 aceitunas',
    });
  });
});
