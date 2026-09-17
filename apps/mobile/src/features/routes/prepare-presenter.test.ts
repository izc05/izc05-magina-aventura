import { describe, expect, it } from 'vitest';

import { presentPreparation } from './prepare-presenter';

describe('adventure preparation presentation', () => {
  it('shows Android GPS readiness when foreground and background are granted', () => {
    expect(
      presentPreparation('ready', {
        servicesEnabled: true,
        foregroundGranted: true,
        backgroundGranted: true,
      }),
    ).toEqual({
      routePackage: 'Listo sin conexión',
      routePackageTone: 'ready',
      canStartGps: true,
      checks: [
        { id: 'location', label: 'Ubicación', state: 'Lista', tone: 'ready' },
        { id: 'background', label: 'GPS en segundo plano', state: 'Listo', tone: 'ready' },
        { id: 'offline', label: 'Ruta offline', state: 'Listo', tone: 'ready' },
        { id: 'route-guide', label: 'Guía de ruta', state: 'Sin trazado oficial', tone: 'review' },
        { id: 'safety', label: 'Seguridad', state: 'Revisar', tone: 'review' },
      ],
    });
  });

  it('allows GPS recording while clearly disclosing that route guidance is unavailable', () => {
    const presentation = presentPreparation('unavailable', {
      servicesEnabled: true,
      foregroundGranted: true,
      backgroundGranted: true,
    });

    expect(presentation.canStartGps).toBe(true);
    expect(presentation.checks).toContainEqual({
      id: 'route-guide',
      label: 'Guía de ruta',
      state: 'Sin trazado oficial',
      tone: 'review',
    });
  });

  it('blocks GPS start honestly when system location is disabled', () => {
    const presentation = presentPreparation('unavailable', {
      servicesEnabled: false,
      foregroundGranted: true,
      backgroundGranted: true,
    });

    expect(presentation.canStartGps).toBe(false);
    expect(presentation.checks[0]).toEqual({
      id: 'location',
      label: 'Ubicación',
      state: 'Activa el GPS',
      tone: 'pending',
    });
  });

  it('keeps permissions pending before they have been checked', () => {
    const presentation = presentPreparation('unavailable');
    expect(presentation.canStartGps).toBe(false);
    expect(presentation.checks[0]?.state).toBe('Pendiente');
    expect(presentation.checks[1]?.state).toBe('Pendiente');
  });
});
