import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ replace: vi.fn(), openURL: vi.fn().mockResolvedValue(true), alert: vi.fn() }));

vi.mock('expo-router', () => ({ useRouter: () => ({ replace: mocks.replace }) }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Image: 'Image',
  Linking: { openURL: mocks.openURL },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../../src/features/routes/adelfal-cuadros-photo', () => ({ adelfalCuadrosPhotoSource: 1 }));

import AdelfalDeCuadrosOfficialRouteScreen from './adelfal-de-cuadros';
import { adelfalDeCuadrosInformation as route } from '../../src/features/routes/adelfal-de-cuadros-information';

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

describe('Adelfal de Cuadros official pilot', () => {
  it('shows only the official route facts and keeps the closure status dated and attributed', () => {
    const tree = AdelfalDeCuadrosOfficialRouteScreen();
    const elements = collectElements(tree);
    const text = visibleText(tree).join(' ');
    const facts = elements.find((element) => element.props?.testID === 'adelfal-official-facts');
    const datedStatus = elements.find((element) => element.props?.testID === 'adelfal-dated-status');
    const sourceCard = elements.find((element) => element.props?.testID === 'adelfal-source-card');
    const photoCard = elements.find((element) => element.props?.testID === 'adelfal-contextual-photo-card');
    const photo = elements.find((element) => element.props?.testID === 'adelfal-contextual-photo');

    expect(text).toContain('PILOTO OFICIAL · JUNTA DE ANDALUCÍA');
    expect(text).toContain('Adelfal de Cuadros');
    expect(text).toContain('Bedmar y Garcíez, Jaén');
    expect(normalizedText(facts)).toContain('Lineal');
    expect(normalizedText(facts)).toContain('Distancia de ida 453 m');
    expect(normalizedText(facts)).toContain('Duración 20 min');
    expect(normalizedText(facts)).toContain('Dificultad Baja');
    expect(normalizedText(facts)).toContain('Tipo de camino Senda');
    expect(normalizedText(facts)).toContain('Sombra Abundante');
    const botanicalNotice = elements.find((element) => element.props?.testID === 'adelfal-botanical-notice');
    expect(normalizedText(botanicalNotice)).toContain('La adelfa es venenosa');
    expect(normalizedText(botanicalNotice)).toContain('con precaución');
    expect(normalizedText(botanicalNotice)).toContain('Consultados el 01/10/2026');
    expect(normalizedText(datedStatus)).toContain(route.publishedStatus);
    expect(normalizedText(datedStatus)).toContain('24/02/2026');
    expect(normalizedText(datedStatus)).toContain('no una verificación actual de campo');
    expect(normalizedText(datedStatus)).toContain('antes del lanzamiento');
    expect(normalizedText(datedStatus)).toContain('condiciones operativas antes de salir');
    expect(normalizedText(sourceCard)).toContain(route.officialSource.label);
    expect(photo?.type).toBe('Image');
    expect(photo?.props?.source).toBe(1);
    expect(photo?.props?.accessibilityRole).toBe('image');
    expect(photo?.props?.accessibilityLabel).toBe(route.contextualPhoto.altText);
    expect(normalizedText(photoCard)).toContain('José Sánchez Rodríguez y Rafael Palomo López');
    expect(normalizedText(photoCard)).toContain('Wikimedia Commons · ADELFALRIOCUADROS.JPG');
    expect(normalizedText(photoCard)).toContain('foto contextual del adelfal del río Cuadros (2006)');
    expect(normalizedText(photoCard)).toContain('no acredita el recorrido ni su estado actual');
    expect(normalizedText(photoCard)).toContain('sin recortes ni modificaciones');
    expect(normalizedText(photoCard)).toContain('CC BY-SA 3.0');
    expect(normalizedText(photoCard)).toContain('GFDL 1.2+');
    expect(text).not.toMatch(/abierto actualmente|cerrado actualmente|cerrado hoy|iniciar navegación|checkpoint|recompensa|XP|ranking|progreso/i);
    expect(text).not.toContain('Cueva del Agua');
    expect(route.slug).toBe('adelfal-de-cuadros');
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
  });

  it('shows visible links to both official brochures beside the botanical precaution', () => {
    const tree = AdelfalDeCuadrosOfficialRouteScreen();
    const elements = collectElements(tree);
    const englishBrochure = elements.find((element) => element.props?.testID === 'adelfal-brochure-source-en');
    const spanishBrochure = elements.find((element) => element.props?.testID === 'adelfal-brochure-source-es');

    expect(normalizedText(englishBrochure)).toContain('Adelfal de Cuadros Trail');
    expect(normalizedText(spanishBrochure)).toContain('Sendero Adelfal de Cuadros');
    expect(englishBrochure?.props?.accessibilityRole).toBe('link');
    expect(spanishBrochure?.props?.accessibilityRole).toBe('link');

    (englishBrochure?.props?.onPress as (() => void) | undefined)?.();
    (spanishBrochure?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(route.botanicalNotice.sources[0].url);
    expect(mocks.openURL).toHaveBeenCalledWith(route.botanicalNotice.sources[1].url);
  });

  it('keeps source, photo attribution and license links plus catalog return accessible', () => {
    const tree = AdelfalDeCuadrosOfficialRouteScreen();
    const elements = collectElements(tree);
    const sourceLink = elements.find((element) => element.props?.testID === 'adelfal-source-link');
    const photoSourceLink = elements.find((element) => element.props?.testID === 'adelfal-photo-source-link');
    const ccLicenseLink = elements.find((element) => element.props?.testID === 'adelfal-photo-cc-license-link');
    const gfdlLicenseLink = elements.find((element) => element.props?.testID === 'adelfal-photo-gfdl-license-link');
    const backButton = elements.find((element) => element.props?.accessibilityLabel === 'Volver al catálogo público de rutas');

    expect(sourceLink?.props?.accessibilityRole).toBe('link');
    expect(typeof sourceLink?.props?.onPress).toBe('function');
    (sourceLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(route.officialSource.url);

    expect(photoSourceLink?.props?.accessibilityRole).toBe('link');
    expect(ccLicenseLink?.props?.accessibilityRole).toBe('link');
    expect(gfdlLicenseLink?.props?.accessibilityRole).toBe('link');
    (photoSourceLink?.props?.onPress as (() => void) | undefined)?.();
    (ccLicenseLink?.props?.onPress as (() => void) | undefined)?.();
    (gfdlLicenseLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(route.contextualPhoto.sourceUrl);
    expect(mocks.openURL).toHaveBeenCalledWith(route.contextualPhoto.ccBySaUrl);
    expect(mocks.openURL).toHaveBeenCalledWith(route.contextualPhoto.gfdlUrl);

    expect(backButton?.props?.accessibilityRole).toBe('button');
    (backButton?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/routes');
  });
});
