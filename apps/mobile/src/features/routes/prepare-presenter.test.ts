import { describe, expect, it } from 'vitest';

import { presentPreparation } from './prepare-presenter';

describe('adventure preparation presentation', () => {
  it('keeps GPS states honest while emphasizing offline readiness', () => {
    expect(presentPreparation('ready')).toEqual({
      routePackage: 'Listo sin conexión',
      routePackageTone: 'ready',
      checks: [
        { id: 'location', label: 'Ubicación', state: 'Pendiente', tone: 'pending' },
        { id: 'background', label: 'GPS en segundo plano', state: 'Pendiente', tone: 'pending' },
        { id: 'offline', label: 'Ruta offline', state: 'Listo', tone: 'ready' },
        { id: 'safety', label: 'Seguridad', state: 'Revisar', tone: 'review' },
      ],
    });
  });

  it('never describes an unavailable offline package as ready', () => {
    const presentation = presentPreparation('unavailable');
    expect(presentation.routePackage).toBe('No disponible');
    expect(presentation.checks[2]).toEqual({
      id: 'offline',
      label: 'Ruta offline',
      state: 'No disponible',
      tone: 'pending',
    });
  });
});
