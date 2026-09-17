import { describe, expect, it } from 'vitest';

import type { MobileRouteView } from './mobile-route-view';
import { presentRouteDetail } from './route-detail-presenter';

describe('route-detail-presenter', () => {
  it('formats detail metrics with proper localization', () => {
    const route: MobileRouteView = {
      id: '1',
      slug: 'test',
      title: 'Test',
      municipalityNames: ['Test'],
      distanceKm: 4.25,
      elevationGainM: 160,
      durationMinutes: 80,
      difficulty: 1,
      operationalStatus: 'OPEN',
      safetyHeadline: null,
      discoveriesCount: 3,
      rewardsAvailable: true,
      developmentFixture: false,
    };

    const presentation = presentRouteDetail(route);

    expect(presentation.distance).toBe('4,3 km'); // es-ES locale rounds to 1 decimal with comma
    expect(presentation.elevation).toBe('+160 m');
    expect(presentation.rewardHeadline).toBe('Recompensas disponibles');
  });

  it('handles missing metrics', () => {
    const route: MobileRouteView = {
      id: '1',
      slug: 'test',
      title: 'Test',
      municipalityNames: ['Test'],
      distanceKm: null,
      elevationGainM: null,
      durationMinutes: null,
      difficulty: null,
      operationalStatus: 'OPEN',
      safetyHeadline: null,
      discoveriesCount: 0,
      rewardsAvailable: false,
      developmentFixture: false,
    };

    const presentation = presentRouteDetail(route);

    expect(presentation.distance).toBe('Pendiente');
    expect(presentation.elevation).toBe('Pendiente');
  });
});