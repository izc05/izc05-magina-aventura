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
  it('shows an explicit empty state when SQLite has no finished route GPS sessions', () => {
    const visibleText = collectRenderedText(PassportGpsMetricsPanel({
      state: {
        status: 'ready',
        metrics: { sessionCount: 0, distanceMeters: 0, elapsedSeconds: 0 },
      },
    }));

    expect(visibleText).toContain('Aún no hay sesiones GPS registradas');
    expect(visibleText).toContain(
      'Aquí aparecerán únicamente las métricas guardadas de sesiones GPS finalizadas.',
    );
    expect(visibleText.join(' ')).not.toMatch(/rutas completadas|checkpoints|descubrimientos|XP|insignias|recompensas/i);
  });

  it('shows only stored GPS session count, distance and elapsed time', () => {
    const visibleText = collectRenderedText(PassportGpsMetricsPanel({
      state: {
        status: 'ready',
        metrics: { sessionCount: 2, distanceMeters: 2_530, elapsedSeconds: 5_400 },
      },
    }));

    expect(visibleText).toEqual([
      '2',
      'Sesiones GPS registradas',
      '2.53 km',
      'Distancia GPS acumulada',
      '1 h 30 min',
      'Tiempo GPS acumulado',
      'Son métricas guardadas de GPS; no acreditan rutas completadas ni checkpoints, descubrimientos, XP, insignias o recompensas.',
    ]);
  });

  it('does not claim an empty result while loading or when persisted data is unavailable', () => {
    expect(collectRenderedText(PassportGpsMetricsPanel({ state: { status: 'loading' } })))
      .toContain('Cargando métricas GPS guardadas…');
    expect(collectRenderedText(PassportGpsMetricsPanel({ state: { status: 'error' } })))
      .toContain('No se pudieron leer las sesiones GPS guardadas en este dispositivo.');
  });
});
