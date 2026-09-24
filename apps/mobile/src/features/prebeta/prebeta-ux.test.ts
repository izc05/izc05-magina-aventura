import { describe, expect, it } from 'vitest';

import type { MobileRouteView } from '../routes/mobile-route-view';
import {
  filterHomeRoutes,
  resolveBottomNavSelection,
  type HomeDifficultyFilter,
} from './prebeta-ux';

const routes: MobileRouteView[] = [
  {
    id: 'easy-1',
    slug: 'pinar-de-canava',
    title: 'Pinar de Cnava',
    municipalityNames: ['Jimena'],
    distanceKm: 4.2,
    elevationGainM: 160,
    durationMinutes: 80,
    difficulty: 1,
    operationalStatus: 'OPEN',
    safetyHeadline: null,
    discoveriesCount: 0,
    rewardsAvailable: false,
    developmentFixture: true,
  },
  {
    id: 'moderate-1',
    slug: 'sendero-de-cuadros',
    title: 'Sendero de Cuadros',
    municipalityNames: ['Bedmar y Garcez'],
    distanceKm: 8.7,
    elevationGainM: 412,
    durationMinutes: 150,
    difficulty: 2,
    operationalStatus: 'OPEN',
    safetyHeadline: null,
    discoveriesCount: 0,
    rewardsAvailable: false,
    developmentFixture: true,
  },
];

describe('pre-beta home UX', () => {
  it('filters routes by municipality or title without requiring accents', () => {
    expect(filterHomeRoutes(routes, 'canava', 'Todos').map((route) => route.slug)).toEqual([
      'pinar-de-canava',
    ]);
    expect(filterHomeRoutes(routes, 'bedmar', 'Todos').map((route) => route.slug)).toEqual([
      'sendero-de-cuadros',
    ]);
  });

  it.each<[HomeDifficultyFilter, string[]]>([
    ['Todos', ['pinar-de-canava', 'sendero-de-cuadros']],
    ['Fácil', ['pinar-de-canava']],
    ['Moderada', ['sendero-de-cuadros']],
    ['Difícil', []],
  ])('applies the %s difficulty filter', (filter, expected) => {
    expect(filterHomeRoutes(routes, '', filter).map((route) => route.slug)).toEqual(expected);
  });

  it('navigates every bottom tab to a concrete route', () => {
    expect(resolveBottomNavSelection('Rutas')).toEqual({ kind: 'navigate', href: '/' });
    expect(resolveBottomNavSelection('Retos')).toEqual({ kind: 'navigate', href: '/challenges' });
    expect(resolveBottomNavSelection('Colecciones')).toEqual({ kind: 'navigate', href: '/collections' });
    expect(resolveBottomNavSelection('Ranking')).toEqual({ kind: 'navigate', href: '/ranking' });
    expect(resolveBottomNavSelection('Perfil')).toEqual({ kind: 'navigate', href: '/profile' });
  });
});
