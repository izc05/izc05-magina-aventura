import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  slug: 'sendero-de-cuadros-dev',
  back: vi.fn(),
  push: vi.fn(),
  replace: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: mocks.slug }),
  useRouter: () => ({ back: mocks.back, push: mocks.push, replace: mocks.replace }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react', () => ({
  useEffect: vi.fn(),
  useState: (initialValue: unknown) => [initialValue, vi.fn()],
}));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('@magina-aventura/offline-sync', () => ({
  evaluateOfflinePackage: vi.fn(),
  resolvePmtilesUri: vi.fn(),
}));
vi.mock('../../src/features/routes/development-route-map-repository', () => ({
  developmentRouteMapRepository: {
    getMapPayload: vi.fn(),
    getOfflineManifest: vi.fn(),
  },
}));
vi.mock('../../src/map/RouteMap', () => ({ RouteMap: 'RouteMap' }));
vi.mock('../../src/map/map-style', () => ({ materializeMapStyle: vi.fn() }));
vi.mock('../../src/offline/expo-route-package-port', () => ({
  expoRoutePackagePort: { readMetadata: vi.fn() },
}));
vi.mock('../../src/offline/route-package-store', () => ({ downloadRoutePackage: vi.fn() }));

import RouteDetailScreen from './[slug]';

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

describe('development route detail screen', () => {
  it('does not resolve a fixture slug in production', () => {
    vi.stubGlobal('__DEV__', false);

    const tree = RouteDetailScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);

    expect(text).toContain('Ruta no disponible');
    expect(text).not.toMatch(/8\.7\s?km|412\s?m|750\s?XP|120\s?🫒|7 descubrimientos/i);
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
  });

  it('labels preview data as a demo and withholds fixture metrics and map location', () => {
    vi.stubGlobal('__DEV__', true);

    const tree = RouteDetailScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);

    expect(text).toContain('DEMO · SOLO PREVIEW');
    expect(text).toContain('SIMULACIÓN DE DESARROLLO');
    expect(text).toContain('No se muestra ubicación, trazado ni puntos');
    expect(text).not.toMatch(/8\.7\s?km|412\s?m|750\s?XP|120\s?🫒|7 descubrimientos/i);
    expect(text).not.toContain('Bedmar y Garcíez');
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
  });
});
