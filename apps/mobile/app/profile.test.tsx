import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
  isLoading: false,
  push: vi.fn(),
  replace: vi.fn(),
  loadPassportGpsData: vi.fn().mockResolvedValue({
    sessions: [],
    metrics: { sessionCount: 0, distanceMeters: 0, elapsedSeconds: 0 },
  }),
}));

vi.mock('react', () => ({
  useCallback: (callback: unknown) => callback,
  useEffect: (effect: () => void | (() => void)) => { effect(); },
  useState: (initialValue: unknown) => [initialValue, vi.fn()],
}));
vi.mock('expo-router', () => ({
  useFocusEffect: (effect: () => void | (() => void)) => { effect(); },
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: mocks.isLoading, signOut: vi.fn() }),
}));
vi.mock('../src/activity/sqlite-activity-store', () => ({
  sqliteActivityStore: { loadPassportGpsData: mocks.loadPassportGpsData },
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));

import ProfileScreen from './profile';
import {
  PassportGpsMetricsPanel,
  scopePassportGpsLoadState,
} from '../src/features/passport/PassportGpsMetricsPanel';

type ElementLike = { type?: unknown; props?: Record<string, unknown> };

function collectElements(node: unknown, elements: ElementLike[] = []): ElementLike[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, elements);
  } else if (node !== null && typeof node === 'object' && 'props' in node) {
    const element = node as ElementLike;
    elements.push(element);
    collectElements(element.props?.children, elements);
  }
  return elements;
}

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

  it('opens the selected capture detail without exposing its internal ID as visible text', () => {
    const onSelectSession = vi.fn();
    const tree = PassportGpsMetricsPanel({
      onSelectSession,
      state: {
        status: 'ready',
        data: {
          metrics: { sessionCount: 1, distanceMeters: 100, elapsedSeconds: 80 },
          sessions: [{
            activityId: 'private-session-id',
            finishedAt: '2026-09-29T08:10:00.000Z',
            distanceMeters: 100,
            elapsedSeconds: 80,
            sampleCount: 2,
          }],
        },
      },
    });
    const sessionButton = collectElements(tree).find(
      (element) => element.props?.accessibilityRole === 'button' &&
        String(element.props.accessibilityLabel).startsWith('Abrir detalle de captura GPS'),
    );
    (sessionButton?.props?.onPress as (() => void) | undefined)?.();
    expect(onSelectSession).toHaveBeenCalledWith('private-session-id');
    expect(collectRenderedText(tree).join(' ')).not.toContain('private-session-id');
  });
});

describe('account-scoped Passport GPS state', () => {
  it('loads the current owner data when the Passport screen is focused', () => {
    mocks.user = { id: 'account-b', email: 'b@example.test' };
    mocks.isLoading = false;
    mocks.loadPassportGpsData.mockClear();

    ProfileScreen();

    expect(mocks.loadPassportGpsData).toHaveBeenCalledWith('account-b');
  });

  it('hides a prior account cache while the newly authenticated owner loads', () => {
    const accountAState = {
      status: 'ready' as const,
      data: {
        sessions: [{
          activityId: 'account-a-private-session',
          finishedAt: '2026-09-29T08:10:00.000Z',
          distanceMeters: 99_000,
          elapsedSeconds: 60_000,
          sampleCount: 100,
        }],
        metrics: { sessionCount: 1, distanceMeters: 99_000, elapsedSeconds: 60_000 },
      },
    };
    expect(scopePassportGpsLoadState('account-b', 'account-a', accountAState))
      .toEqual({ status: 'loading' });
    expect(scopePassportGpsLoadState('account-a', 'account-a', accountAState)).toBe(accountAState);
  });
});

describe('guest access to the personal passport', () => {
  it('asks for sign-in and does not load saved passport data for a guest', () => {
    mocks.user = null;
    mocks.isLoading = false;
    mocks.push.mockReset();
    mocks.replace.mockReset();
    mocks.loadPassportGpsData.mockClear();

    const tree = ProfileScreen();
    const elements = collectElements(tree);
    const login = elements.find((element) => element.props?.accessibilityLabel === 'Iniciar sesión o registrarse para guardar el pasaporte');
    const explore = elements.find((element) => element.props?.accessibilityLabel === 'Explorar sin cuenta');

    expect(login?.props?.accessibilityRole).toBe('button');
    expect(explore?.props?.accessibilityRole).toBe('button');
    (login?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith({ pathname: '/login', params: { returnTo: 'passport' } });
    (explore?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/');
    expect(mocks.loadPassportGpsData).not.toHaveBeenCalled();
  });
});
