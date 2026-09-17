import { describe, expect, it } from 'vitest';

import { developmentRoutes } from './fixtures';
import { presentRouteDetail } from './route-detail-presenter';

describe('route detail presentation', () => {
  it('shows verified route data without inventing elevation or rewards', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentRouteDetail(route)).toEqual({
      distance: '2,3 km',
      elevation: 'Pendiente',
      duration: '1 h',
      difficulty: 'Fácil',
      rewardHeadline: 'Recompensas en validación',
      discoveries: 'Descubrimientos en preparación',
    });
  });
});
