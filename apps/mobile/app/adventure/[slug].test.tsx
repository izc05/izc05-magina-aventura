import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  slug: 'sendero-de-cuadros-dev',
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
  start: vi.fn(),
  recover: vi.fn(),
}));

vi.mock('react', () => ({
  default: { useMemo: (factory: () => unknown) => factory() },
  useEffect: vi.fn(),
  useMemo: (factory: () => unknown) => factory(),
  useState: (initialValue: unknown) => [
    typeof initialValue === 'function' ? (initialValue as () => unknown)() : initialValue,
    vi.fn(),
  ],
}));
vi.mock('expo-router', () => ({
  Redirect: 'Redirect',
  useLocalSearchParams: () => ({ slug: mocks.slug }),
  useRouter: () => ({ back: mocks.back, push: mocks.push, replace: mocks.replace }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Pressable: 'Pressable',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../../src/activity/activity-runtime', () => ({
  activityRuntime: {
    recover: mocks.recover,
    start: mocks.start,
    current: vi.fn(),
    refresh: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
    finish: vi.fn(),
  },
}));
vi.mock('../../src/features/routes/development-route-map-repository', () => ({
  developmentRouteMapRepository: { getMapPayload: vi.fn() },
}));
vi.mock('../../src/map/RouteMap', () => ({ RouteMap: 'RouteMap' }));
vi.mock('../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: null, isLoading: false }),
}));
vi.mock('../../src/adventure/checkpoint-view-model', () => ({ checkpointViewModel: vi.fn() }));
vi.mock('../../src/adventure/technical-gps-view-model', () => ({ technicalGpsMetricsViewModel: vi.fn() }));

import ActiveAdventureScreen from './[slug]';

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

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('active adventure production route guard', () => {
  it('redirects development fixture slugs before showing a map or starting personal GPS', () => {
    vi.stubGlobal('__DEV__', false);

    const tree = ActiveAdventureScreen();
    const elements = collectElements(tree);
    const redirect = elements.find((element) => element.type === 'Redirect');

    expect(redirect?.props?.href).toBe('/');
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
    expect(mocks.recover).not.toHaveBeenCalled();
    expect(mocks.start).not.toHaveBeenCalled();
  });
});
