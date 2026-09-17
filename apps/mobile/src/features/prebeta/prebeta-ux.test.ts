import { describe, expect, it } from 'vitest';

import type { AdventureRouteCard } from '../routes/route-types';
import {
  filterHomeRoutes,
  resolveBottomNavSelection,
  type HomeDifficultyFilter,
} from './prebeta-ux';

const routes: AdventureRouteCard[] = [
  {
    id: 'easy-1',
    slug: 'pinar-de-canava',
    title: 'Pinar de Cánava',
    municipalityId: 'jimena',
    municipalityName: 'Jimena',
    distanceKm: 4.2,
    elevationGainM: 160,
    durationMinutes: 80,
    difficulty: 'easy',
    rewardPreview: { xp: 0, olives: 0, discoveries: 0 },
    contentVersion: 1,
    description: '',
    safetyNotes: [],
    startLatitude: 0,
    startLongitude: 0,
    geometryVersion: 1,
    offlineAvailable: false,
    developmentFixture: true,
  },
  {
    id: 'moderate-1',
    slug: 'sendero-de-cuadros',
    title: 'Sendero de Cuadros',
    municipalityId: 'bedmar',
    municipalityName: 'Bedmar y Garcíez',
    distanceKm: 8.7,
    elevationGainM: 412,
    durationMinutes: 150,
    difficulty: 'moderate',
    rewardPreview: { xp: 0, olives: 0, discoveries: 0 },
    contentVersion: 1,
    description: '',
    safetyNotes: [],
    startLatitude: 0,
    startLongitude: 0,
    geometryVersion: 1,
    offlineAvailable: false,
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

  it('turns every bottom-navigation tap into an explicit action', () => {
    expect(resolveBottomNavSelection('Rutas')).toEqual({ kind: 'navigate', href: '/' });
    expect(resolveBottomNavSelection('Retos')).toEqual({ kind: 'coming-soon', label: 'Retos' });
    expect(resolveBottomNavSelection('Colecciones')).toEqual({ kind: 'coming-soon', label: 'Colecciones' });
    expect(resolveBottomNavSelection('Ranking')).toEqual({ kind: 'coming-soon', label: 'Ranking' });
    expect(resolveBottomNavSelection('Perfil')).toEqual({ kind: 'coming-soon', label: 'Perfil' });
  });
});
