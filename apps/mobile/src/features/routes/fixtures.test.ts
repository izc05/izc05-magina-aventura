import { describe, expect, it } from 'vitest';

import { developmentRoutes } from './fixtures';

describe('pre-beta route fixture', () => {
  it('uses El Peralejo verified basics instead of the blocked Cuadros development route', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(route).toMatchObject({
      slug: 'el-peralejo-prebeta',
      title: 'El Peralejo',
      municipalityName: 'Cambil',
      distanceKm: 2.268,
      durationMinutes: 60,
      difficulty: 'easy',
      offlineAvailable: false,
      developmentFixture: true,
    });
    expect(route.startLatitude).toBeCloseTo(37.689886, 5);
    expect(route.startLongitude).toBeCloseTo(-3.487147, 5);
    expect(route.description).toContain('trazado GPS oficial pendiente');
    expect(route.safetyNotes.join(' ')).toContain('estado operativo');
  });
});
