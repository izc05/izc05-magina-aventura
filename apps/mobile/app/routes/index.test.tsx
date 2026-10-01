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
import { adelfalDeCuadrosInformation } from '../../src/features/routes/adelfal-de-cuadros-information';
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

function normalizedText(node: unknown): string {
  return visibleText(node).join(' ').replace(/\s+/g, ' ').trim();
}

afterEach(() => vi.clearAllMocks());

describe('public route catalog', () => {
  it('keeps Bedmar and adds Adelfal as separate public pilots with attributed facts', () => {
    const tree = PublicRouteCatalogScreen();
    const elements = collectElements(tree);
    const municipalCard = elements.find((element) => element.props?.testID === 'public-route-card');
    const adelfalCard = elements.find((element) => element.props?.testID === 'public-adelfal-route-card');
    const text = visibleText(tree).join(' ');
    const municipalText = normalizedText(municipalCard);
    const adelfalText = normalizedText(adelfalCard);

    expect(municipalCard).toBeDefined();
    expect(adelfalCard).toBeDefined();
    expect(text).toContain('Rutas de Sierra Mágina');
    expect(municipalText).toContain(municipalRouteInformation.title);
    expect(municipalText).toContain(municipalRouteInformation.municipality);
    expect(municipalText).toContain(municipalRouteInformation.statusLabel);
    expect(municipalText).toContain(municipalRouteInformation.traceStatus);
    expect(municipalText).toContain(municipalRouteInformation.gpsNotice);
    expect(municipalText).toContain(municipalRouteInformation.officialDataNotice);
    expect(municipalText).toContain(municipalRouteInformation.statusDetail);
    expect(municipalText).not.toMatch(/\b\d+(?:[,.]\d+)?\s?(?:km|mi|m|ft|min|h|XP)\b/i);
    expect(municipalText).not.toMatch(/checkpoint|desnivel|recompensa|iniciar navegación|próximamente/i);

    expect(adelfalText).toContain('PILOTO OFICIAL');
    expect(adelfalText).toContain(adelfalDeCuadrosInformation.title);
    expect(adelfalText).toContain(adelfalDeCuadrosInformation.municipality);
    expect(adelfalText).toContain('453 m de ida');
    expect(adelfalText).toContain('20 min');
    expect(adelfalText).toContain('Dificultad baja');
    expect(adelfalText).toContain('Senda');
    expect(adelfalText).toContain('sombra abundante');
    expect(adelfalText).toContain(adelfalDeCuadrosInformation.publishedStatus);
    expect(adelfalText).toContain(adelfalDeCuadrosInformation.noticeDate);
    expect(adelfalText).toContain('no una verificación actual de campo');
    expect(adelfalText).toContain('antes del lanzamiento');
    expect(adelfalText).not.toMatch(/abierto actualmente|cerrado actualmente|cerrado hoy/i);
    expect(text).not.toMatch(/iniciar sesión o registrarse|correo electrónico|contraseña/i);
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
    expect(municipalCard?.props?.accessibilityRole).toBe('button');
    expect(adelfalCard?.props?.accessibilityRole).toBe('button');
    expect(adelfalCard?.props?.accessibilityHint).toContain('no es una comprobación actual');
  });

  it('opens the independent Bedmar and Adelfal public details without an authentication step', () => {
    const tree = PublicRouteCatalogScreen();
    const elements = collectElements(tree);
    const municipalCard = elements.find((element) => element.props?.testID === 'public-route-card');
    const adelfalCard = elements.find((element) => element.props?.testID === 'public-adelfal-route-card');

    (municipalCard?.props?.onPress as (() => void) | undefined)?.();
    (adelfalCard?.props?.onPress as (() => void) | undefined)?.();

    expect(mocks.push).toHaveBeenNthCalledWith(1, {
      pathname: '/municipal-routes/[slug]',
      params: { slug: municipalRouteInformation.slug },
    });
    expect(mocks.push).toHaveBeenNthCalledWith(2, '/official-routes/adelfal-de-cuadros');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('returns to Home from the public catalog', () => {
    const tree = PublicRouteCatalogScreen();
    const backButton = collectElements(tree).find((element) => element.props?.accessibilityLabel === 'Volver al inicio');

    (backButton?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
});
