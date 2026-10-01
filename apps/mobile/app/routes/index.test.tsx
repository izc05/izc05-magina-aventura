import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ push: vi.fn(), replace: vi.fn() }));

vi.mock('expo-router', () => ({ router: { push: mocks.push, replace: mocks.replace } }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

import PublicRouteCatalogScreen from './index';
import { municipalRouteInformation } from '../../src/features/routes/municipal-route-information';

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

afterEach(() => vi.clearAllMocks());

describe('public route catalog', () => {
  it('shows only the documented Bedmar pilot and its verification and non-navigation notices', () => {
    const tree = PublicRouteCatalogScreen();
    const elements = collectElements(tree);
    const cards = elements.filter((element) => element.props?.testID === 'public-route-card');
    const text = visibleText(tree).join(' ');
    const card = cards[0];

    expect(cards).toHaveLength(1);
    expect(text).toContain('Rutas de Sierra Mágina');
    expect(text).toContain(municipalRouteInformation.title);
    expect(text).toContain(municipalRouteInformation.municipality);
    expect(text).toContain(municipalRouteInformation.statusLabel);
    expect(text).toContain(municipalRouteInformation.traceStatus);
    expect(text).toContain(municipalRouteInformation.gpsNotice);
    expect(text).toContain(municipalRouteInformation.officialDataNotice);
    expect(text).toContain(municipalRouteInformation.statusDetail);
    expect(text).not.toMatch(/\b\d+(?:[,.]\d+)?\s?(?:km|mi|m|ft|min|h|XP)\b/i);
    expect(text).not.toMatch(/checkpoint|desnivel|recompensa|iniciar navegación|próximamente/i);
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
    expect(text).not.toMatch(/iniciar sesión o registrarse|correo electrónico|contraseña/i);
    expect(card?.props?.accessibilityRole).toBe('button');
    expect(card?.props?.accessibilityLabel).toBe(
      `Abrir ficha informativa de ${municipalRouteInformation.title}`,
    );
    expect(card?.props?.accessibilityHint).toContain('No requiere iniciar sesión');
  });

  it('opens the public municipal detail and returns Home without an authentication step', () => {
    const tree = PublicRouteCatalogScreen();
    const elements = collectElements(tree);
    const routeCard = elements.find((element) => element.props?.testID === 'public-route-card');
    const backButton = elements.find((element) => element.props?.accessibilityLabel === 'Volver al inicio');

    (routeCard?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/municipal-routes/[slug]',
      params: { slug: municipalRouteInformation.slug },
    });
    expect(mocks.replace).not.toHaveBeenCalled();

    (backButton?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
});
