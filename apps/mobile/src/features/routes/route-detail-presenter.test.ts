import { describe, expect, it } from 'vitest';

import { developmentRoutes } from './fixtures';
import { presentRouteDetail } from './route-detail-presenter';

describe('route detail presentation', () => {
  it('formats current route data without inventing content', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentRouteDetail(route)).toEqual({
      distance: '8,7 km',
      elevation: '+412 m',
      duration: '2 h 30 min',
      difficulty: 'Moderada',
      rewardHeadline: '+750 XP · +120 aceitunas',
      discoveries: '7 descubrimientos en la ruta',
    });
  });
});
