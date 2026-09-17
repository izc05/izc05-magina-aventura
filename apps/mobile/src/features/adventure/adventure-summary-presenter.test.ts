import { describe, expect, it } from 'vitest';

import { developmentRoutes } from '../routes/fixtures';
import { presentAdventureSummary } from './adventure-summary-presenter';

describe('adventure summary presentation', () => {
  it('keeps demo completion separate from recorded activity and rewards', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentAdventureSummary(route)).toEqual({
      title: 'Resumen de aventura',
      routeTitle: 'El Peralejo',
      place: 'Cambil',
      distance: '0,0 km',
      elapsed: '00:00',
      elevation: '+0 m',
      xpRecorded: '0 XP registrados',
      olivesRecorded: '0 aceitunas registradas',
      targetReward: 'Recompensas pendientes de validación',
      note: 'Vista demo: no se guarda actividad ni se conceden recompensas.',
    });
  });
});
