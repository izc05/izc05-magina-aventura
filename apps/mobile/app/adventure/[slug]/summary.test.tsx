import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  current: vi.fn(),
  state: 'ACTIVE' as 'ACTIVE' | 'PAUSED' | 'FINISHED',
}));

vi.mock('expo-router', () => ({
  Redirect: 'Redirect',
  useLocalSearchParams: () => ({ slug: 'sendero-de-cuadros-dev' }),
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../../../src/activity/activity-runtime', () => ({
  activityRuntime: { current: mocks.current },
}));
vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { id: 'synthetic-owner', email: 'test@example.test' }, isLoading: false }),
}));

import ActivitySummaryScreen from './summary';

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

function visibleText(node: unknown): string[] {
  if (typeof node === 'string' || typeof node === 'number') return [String(node)];
  if (Array.isArray(node)) return node.flatMap(visibleText);
  if (node !== null && typeof node === 'object' && 'props' in node) {
    return visibleText((node as ElementLike).props?.children);
  }
  return [];
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('GPS activity summary screen', () => {
  it('does not claim completion or display active metrics when the session is still active', () => {
    vi.stubGlobal('__DEV__', true);
    mocks.current.mockReturnValue({
      session: { state: 'ACTIVE', lastProcessedSequence: 4 },
      snapshot: { state: 'ACTIVE', validDistanceMeters: 1_234, totalElapsedSeconds: 600 },
    });

    const text = visibleText(ActivitySummaryScreen()).join(' ');

    expect(text).toContain('NO HAY ACTIVIDAD FINALIZADA');
    expect(text).toContain('No hay una captura GPS finalizada para mostrar.');
    expect(text).not.toContain('SESIÓN TÉCNICA GPS FINALIZADA');
    expect(text).not.toContain('1.23');
    expect(text).not.toMatch(/XP|aceitunas|recompensas/i);
  });

  it('shows saved GPS metrics only after the activity reaches FINISHED and never implies game rewards', () => {
    vi.stubGlobal('__DEV__', true);
    mocks.current.mockReturnValue({
      session: { state: 'FINISHED', lastProcessedSequence: 2 },
      snapshot: { state: 'FINISHED', validDistanceMeters: 1_234, totalElapsedSeconds: 600 },
    });

    const tree = ActivitySummaryScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);

    expect(text).toContain('SESIÓN TÉCNICA GPS FINALIZADA');
    expect(text).toContain('1.23');
    expect(text).toContain('Métricas reales de GPS');
    expect(text).toContain('ni generan recompensas');
    expect(text).not.toMatch(/\b\d+\s?(?:XP|aceitunas)\b|ruta completada/i);
    expect(elements.some((element) => element.type === 'Redirect')).toBe(false);
  });
});
