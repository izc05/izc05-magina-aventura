import { describe, expect, it } from 'vitest';

import { developmentRoutes } from '../routes/fixtures';
import { presentActiveAdventure } from './active-adventure-presenter';

describe('active adventure presentation', () => {
  it('shows an honest zero-state while GPS tracking is not integrated', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentActiveAdventure(route)).toEqual({
      routeTitle: 'Sendero de Cuadros',
      place: 'Bedmar y Garcíez',
      modeLabel: 'MODO DEMO · GPS AÚN NO ACTIVO',
      progress: '0 %',
      distance: '0,0 km',
      elapsed: '00:00',
      elevation: '+0 m',
      objectiveTitle: 'Explora el entorno',
      objectiveMeta: 'Los descubrimientos aparecerán con el GPS real',
      rewardPreview: '+750 XP · +120 aceitunas',
    });
  });
});
