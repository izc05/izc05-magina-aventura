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
  it('shows exactly one public pilot: Adelfal, with only the Junta facts and a dated non-current notice', () => {
    const tree = PublicRouteCatalogScreen();
    const elements = collectElements(tree);
    const cards = elements.filter((element) => element.props?.testID === 'public-adelfal-route-card');
    const allPilotBadges = elements.filter((element) =>
      element.type === 'Text' && visibleText(element).join('').includes('PILOTO'),
    );
    const card = cards[0];
    const text = visibleText(tree).join(' ');
    const cardText = normalizedText(card);

    expect(cards).toHaveLength(1);
    expect(allPilotBadges).toHaveLength(1);
    expect(text).toContain('Rutas de Sierra Mágina');
    expect(text).not.toMatch(/\bQA\b/);
    expect(text).not.toContain('Cueva del Agua');
    expect(cardText).toContain('PILOTO OFICIAL');
    expect(cardText).toContain(adelfalDeCuadrosInformation.title);
    expect(cardText).toContain('Bedmar y Garcíez');
    expect(cardText).toContain('Lineal');
    expect(cardText).toContain('453 m de ida');
    expect(cardText).toContain('20 min');
    expect(cardText).toContain('Dificultad baja');
    expect(cardText).toContain('Senda');
    expect(cardText).toContain('sombra abundante');
    expect(cardText).toContain(adelfalDeCuadrosInformation.noticeDate);
    expect(cardText).toContain('pendiente de revisión al final del desarrollo');
    expect(cardText).toContain('no una verificación actual de campo');
    expect(cardText).not.toMatch(/abierto actualmente|cerrado actualmente|cerrado hoy/i);
    expect(text).not.toMatch(/iniciar sesión o registrarse|correo electrónico|contraseña/i);
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
    expect(card?.props?.accessibilityRole).toBe('button');
    expect(card?.props?.accessibilityHint).toContain('no es una comprobación actual');
  });

  it('opens only the official Adelfal detail without an authentication step', () => {
    const tree = PublicRouteCatalogScreen();
    const card = collectElements(tree).find((element) => element.props?.testID === 'public-adelfal-route-card');

    (card?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledOnce();
    expect(mocks.push).toHaveBeenCalledWith('/official-routes/adelfal-de-cuadros');
    expect(mocks.replace).not.toHaveBeenCalled();
  });

  it('returns to Home from the public catalog', () => {
    const tree = PublicRouteCatalogScreen();
    const backButton = collectElements(tree).find((element) => element.props?.accessibilityLabel === 'Volver al inicio');

    (backButton?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/');
  });
});
