import { describe, expect, it, vi } from 'vitest';

vi.mock('react-native', () => ({
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));

import { PassportGpsMetricsPanel } from '../src/features/passport/PassportGpsMetricsPanel';

function collectRenderedText(node: unknown, text: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    text.push(String(node));
    return text;
  }

  if (Array.isArray(node)) {
    for (const child of node) collectRenderedText(child, text);
    return text;
  }

  if (node !== null && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    collectRenderedText(props?.children, text);
  }

  return text;
}

describe('Passport GPS metrics panel', () => {
  it('shows an explicit empty state when SQLite has no finished GPS captures', () => {
    const visibleText = collectRenderedText(PassportGpsMetricsPanel({
      state: {
        status: 'ready',
        data: {
          sessions: [],
          metrics: { sessionCount: 0, distanceMeters: 0, elapsedSeconds: 0 },
        },
      },
    }));

    expect(visibleText).toContain('Aún no hay capturas GPS guardadas');
    expect(visibleText.join(' ')).toContain('GPS real del dispositivo y datos guardados');
    expect(visibleText.join(' ')).not.toMatch(/rutas completadas|checkpoints|XP|recompensas/i);
  });

  it('shows dated technical captures using only saved distance, active time and sample count', () => {
    const visibleText = collectRenderedText(PassportGpsMetricsPanel({
      state: {
        status: 'ready',
        data: {
          metrics: { sessionCount: 2, distanceMeters: 418, elapsedSeconds: 310 },
          sessions: [
            {
              activityId: 'gps-newer-internal-id',
              finishedAt: '2026-09-29T08:10:00.000Z',
              distanceMeters: 400,
              elapsedSeconds: 300,
              sampleCount: 3,
            },
            {
              activityId: 'gps-older-internal-id',
              finishedAt: '2026-09-28T08:10:00.000Z',
              distanceMeters: 18,
              elapsedSeconds: 10,
              sampleCount: 2,
            },
          ],
        },
      },
    }));

    expect(visibleText).toContain('Capturas GPS');
    expect(visibleText).toContain('Capturas GPS registradas');
    expect(visibleText).toContain('0.42 km');
    expect(visibleText).toContain('Tiempo activo acumulado');
    const renderedText = visibleText.join(' ').replace(/\s+/g, ' ');
    expect(renderedText).toContain('5 min activos');
    expect(renderedText).toContain('3 muestras GPS guardadas');
    expect(renderedText).toContain('2 muestras GPS guardadas');
    const newerDate = `${new Date('2026-09-29T08:10:00.000Z').toLocaleDateString('es-ES')} · ${new Date('2026-09-29T08:10:00.000Z').toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    const olderDate = `${new Date('2026-09-28T08:10:00.000Z').toLocaleDateString('es-ES')} · ${new Date('2026-09-28T08:10:00.000Z').toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
    expect(visibleText.indexOf(newerDate)).toBeGreaterThanOrEqual(0);
    expect(visibleText.indexOf(newerDate)).toBeLessThan(visibleText.indexOf(olderDate));
    expect(renderedText).not.toMatch(/gps-newer-internal-id|gps-older-internal-id|route|geometry|checkpoint|XP|reward|trazado|ruta completada/i);
  });

  it('does not claim an empty result while loading or when persisted data is unavailable', () => {
    expect(collectRenderedText(PassportGpsMetricsPanel({ state: { status: 'loading' } })))
      .toContain('Cargando capturas GPS guardadas…');
    expect(collectRenderedText(PassportGpsMetricsPanel({ state: { status: 'error' } })))
      .toContain('No se pudieron leer las sesiones GPS guardadas en este dispositivo.');
  });
});
