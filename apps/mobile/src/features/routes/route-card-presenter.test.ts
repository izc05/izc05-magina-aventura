import { describe, expect, it } from 'vitest';

import type { MobileRouteView } from './mobile-route-view';
import { presentFeaturedRoute } from './route-card-presenter';

describe('route-card-presenter', () => {
  it('formats verified data for standard display', () => {
    const route: MobileRouteView = {
      id: '1',
      slug: 'test',
      title: 'Test',
      municipalityNames: ['Test'],
      distanceKm: 4.2,
      elevationGainM: 160,
      durationMinutes: 80,
      difficulty: 1,
      operationalStatus: 'OPEN',
      safetyHeadline: null,
      discoveriesCount: 3,
      rewardsAvailable: true,
      developmentFixture: false,
    };

    const presentation = presentFeaturedRoute(route);

    expect(presentation.distance).toBe('4,2 km');
    expect(presentation.elevation).toBe('+160 m');
    expect(presentation.duration).toBe('1 h 20 min');
    expect(presentation.difficulty).toBe('Fácil');
    expect(presentation.rewards).toBe('3 descubrimientos disponibles');
  });

  it('masks missing data when beta feature flag is on', () => {
    const route: MobileRouteView = {
      id: '1',
      slug: 'test',
      title: 'Test',
      municipalityNames: ['Test'],
      distanceKm: 4.2,
      elevationGainM: 160,
      durationMinutes: 80,
      difficulty: 1,
      operationalStatus: 'OPEN',
      safetyHeadline: null,
      discoveriesCount: 3,
      rewardsAvailable: true,
      developmentFixture: true,
    };

    const presentation = presentFeaturedRoute(route);

    expect(presentation.elevation).toBe('Pendiente');
    expect(presentation.rewards).toBe('Recompensas pendientes de validacion');
  });
});
