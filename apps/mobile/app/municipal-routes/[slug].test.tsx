import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  slug: 'sendero-fluvial-cueva-del-agua',
  back: vi.fn(),
  replace: vi.fn(),
  openURL: vi.fn().mockResolvedValue(true),
  alert: vi.fn(),
}));

vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ slug: mocks.slug }),
  useRouter: () => ({ back: mocks.back, replace: mocks.replace }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Alert: { alert: mocks.alert },
  Linking: { openURL: mocks.openURL },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../../src/map/RouteMap', () => ({ RouteMap: 'RouteMap' }));
vi.mock('../../src/features/routes/PersonalRouteGallery', () => ({
  PersonalRouteGallery: 'PersonalRouteGallery',
}));
vi.mock('../../src/features/routes/CommonsContextGallery', () => ({
  CommonsContextGallery: 'CommonsContextGallery',
}));
vi.mock('../../src/features/routes/GpxLocalPreviewSection', () => ({
  GpxLocalPreviewSection: 'GpxLocalPreviewSection',
}));

import MunicipalRouteInformationScreen from './[slug]';
import { municipalRouteInformation } from '../../src/features/routes/municipal-route-information';
import { OPENFREEMAP_LIBERTY_STYLE_URL } from '../../src/map/map-reference';
import { colors, radius, spacing } from '../../src/theme/tokens';

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

function findByTestId(node: unknown, testId: string): ElementLike | undefined {
  return collectElements(node).find((element) => element.props?.testID === testId);
}

function contrastRatio(foreground: string, background: string): number {
  const luminance = (hex: string) => {
    const channel = (index: number) => {
      const value = Number.parseInt(hex.slice(index, index + 2), 16) / 255;
      return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
    };
    return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
  };
  const sorted = [luminance(foreground), luminance(background)].sort((a, b) => b - a);
  const lighter = sorted[0] ?? 0;
  const darker = sorted[1] ?? 0;
  return (lighter + 0.05) / (darker + 0.05);
}

afterEach(() => {
  mocks.slug = 'sendero-fluvial-cueva-del-agua';
  vi.clearAllMocks();
});

describe('Bedmar municipal route detail visual, accessibility and provenance', () => {
  it('establishes a distinct editorial hero and labels the abstract image placeholder honestly', () => {
    const tree = MunicipalRouteInformationScreen();
    const hero = findByTestId(tree, 'municipal-route-hero');
    const elements = collectElements(tree);
    const statusBar = elements.find((element) => element.type === 'StatusBar');
    const title = elements.find((element) =>
      element.type === 'Text' && visibleText(element).join('') === municipalRouteInformation.title,
    );
    const pendingPhoto = findByTestId(tree, 'hero-photo-pending');
    const text = visibleText(tree).join(' ');

    expect(hero?.props?.style).toMatchObject({
      backgroundColor: colors.olive900,
      paddingHorizontal: spacing[20],
      borderBottomLeftRadius: radius.lg,
      borderBottomRightRadius: radius.lg,
    });
    expect(title?.props?.accessibilityRole).toBe('header');
    expect(title?.props?.style).toMatchObject({ color: colors.white, fontSize: 32, lineHeight: 38, fontWeight: '900' });
    expect(statusBar?.props?.style).toBe('dark');
    expect(text).toContain('Cuadros · Bedmar y Garcíez, Jaén');
    expect(pendingPhoto?.props?.accessible).toBe(true);
    expect(pendingPhoto?.props?.accessibilityRole).toBe('image');
    expect(pendingPhoto?.props?.accessibilityLabel).toContain('no es fotografía ni mapa');
    expect(pendingPhoto?.props?.accessibilityLabel).toContain('pendiente de permiso o licencia compatible');
    expect(text).toContain('Motivo abstracto · no es una foto');
    expect(contrastRatio(colors.white, colors.olive900)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.ink, colors.warmBackground)).toBeGreaterThanOrEqual(4.5);
  });

  it('puts only the municipal endpoints and two-way statement near the top without fabricated route metrics', () => {
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const facts = findByTestId(tree, 'route-facts-card');
    const factsStyle = facts?.props?.style;

    expect(text).toContain('Extremos indicados');
    expect(text).toContain('Puente Blanco de Las Tinajas');
    expect(text).toContain('Entrada de la Cueva del Agua');
    expect(text).toContain('AMBOS SENTIDOS');
    expect(text).toContain('El Ayuntamiento indica que puede recorrerse en ambos sentidos.');
    expect(factsStyle).toMatchObject({
      backgroundColor: colors.white,
      borderRadius: radius.lg,
      marginHorizontal: spacing[16],
    });
    expect(text).not.toMatch(/\b\d+(?:[,.]\d+)?\s?(?:km|mi|m|ft|min|h)\b/i);
    expect(text).not.toContain('Desnivel');
    expect(text).not.toContain('Puntuación');
    expect(text).not.toContain('Checkpoint 1');
    expect(text).not.toContain('Iniciar ruta');
  });

  it('shows the context map before source cards, with no route geometry or device location and a non-navigation warning', () => {
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    const map = elements.find((element) => element.type === 'RouteMap');
    const mapFrame = findByTestId(tree, 'context-map-accessible-frame');
    const mapIndex = text.indexOf('Contexto de Bedmar');
    const sourcesIndex = text.indexOf('Fuentes separadas');

    expect(text).toContain('SOLO CONTEXTO');
    expect(text).toContain('El mapa es solo contexto urbano aproximado');
    expect(text).toContain('No lo uses para llegar ni para orientarte por la ruta.');
    expect(mapFrame?.props?.accessible).toBe(true);
    expect(mapFrame?.props?.accessibilityRole).toBe('image');
    expect(mapFrame?.props?.accessibilityLabel).toBe(municipalRouteInformation.contextMap.accessibilityLabel);
    expect(map?.props).toMatchObject({
      payload: null,
      mapStyle: OPENFREEMAP_LIBERTY_STYLE_URL,
      baseMapOnly: true,
      attribution: true,
      showLayerControls: false,
      height: 228,
    });
    expect(map?.props).not.toHaveProperty('deviceLocation');
    expect(mapIndex).toBeGreaterThan(-1);
    expect(sourcesIndex).toBeGreaterThan(mapIndex);
  });

  it('presents linked Junta guidance as general senderismo recommendations, not a route-specific safety assessment', () => {
    const tree = MunicipalRouteInformationScreen();
    const elements = collectElements(tree);
    const text = visibleText(tree).join(' ');
    const recommendations = municipalRouteInformation.generalHikingRecommendations;
    const section = findByTestId(tree, 'official-general-hiking-recommendations');
    const heading = elements.find((element) =>
      element.type === 'Text' && visibleText(element).join('') === recommendations.title,
    );
    const sourceLink = findByTestId(tree, 'official-general-hiking-recommendations-source-link');
    const statusIndex = elements.findIndex((element) => element.props?.testID === 'municipal-status-card');
    const recommendationsIndex = elements.findIndex(
      (element) => element.props?.testID === 'official-general-hiking-recommendations',
    );
    const contextMapIndex = elements.findIndex((element) => element.props?.testID === 'context-map-section');

    expect(section).toBeDefined();
    expect(heading?.props?.accessibilityRole).toBe('header');
    expect(text).toContain(recommendations.attribution);
    expect(text).toContain(recommendations.scopeNote);
    for (const recommendation of recommendations.items) {
      expect(text).toContain(recommendation);
    }
    expect(recommendations.scopeNote).toContain('no constituyen una evaluación de seguridad específica');
    expect(sourceLink?.props?.accessibilityRole).toBe('link');
    expect(sourceLink?.props?.accessibilityLabel).toBe(recommendations.sourceLabel);
    expect(sourceLink?.props?.accessibilityHint).toContain('recomendaciones generales');
    expect(elements.filter((element) =>
      element.props?.testID === 'official-general-hiking-recommendations-source-link',
    )).toHaveLength(1);
    expect(statusIndex).toBeGreaterThan(-1);
    expect(recommendationsIndex).toBeGreaterThan(statusIndex);
    expect(contextMapIndex).toBeGreaterThan(recommendationsIndex);

    (sourceLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(recommendations.sourceUrl);
  });

  it('visually separates official municipal provenance from community reference and keeps original links accessible', () => {
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    const officialCard = findByTestId(tree, 'official-source-card');
    const communityCard = findByTestId(tree, 'community-source-card');
    const officialLabel = `Abrir aviso municipal original: ${municipalRouteInformation.sourceLinks[0].label}`;
    const officialLink = elements.find((element) =>
      element.type === 'Pressable' && element.props?.accessibilityLabel === officialLabel,
    );
    const communityLink = elements.find((element) =>
      element.type === 'Pressable'
        && element.props?.accessibilityLabel === municipalRouteInformation.communityReference.sourceLabel,
    );
    const officialIndex = text.indexOf('FUENTE MUNICIPAL');
    const communityIndex = text.indexOf('Referencia comunitaria · Wikiloc');
    const galleryIndex = text.indexOf('Galería personal');

    expect(text).toContain('Los datos del Ayuntamiento y la referencia comunitaria se identifican por separado');
    expect(text).toContain('OFICIAL');
    expect(text).toContain('COMUNITARIA');
    expect(text).toContain('PUBLICACIÓN CONSULTADA');
    expect(text).toContain('no reproduce métricas, texto, fotos ni geometría de Wikiloc.');
    expect(officialCard?.props?.style).toMatchObject({
      backgroundColor: colors.white,
      borderLeftColor: colors.olive700,
      borderRadius: radius.lg,
    });
    expect(communityCard?.props?.style).toMatchObject({
      backgroundColor: colors.limestone,
      borderLeftColor: colors.earth,
      borderRadius: radius.lg,
    });
    expect(officialLink?.props?.accessibilityRole).toBe('link');
    expect(officialLink?.props?.accessibilityHint).toContain('publicación original del Ayuntamiento');
    expect(communityLink?.props?.accessibilityRole).toBe('link');
    expect(communityLink?.props?.accessibilityHint).toContain('no oficial');
    expect(typeof officialLink?.props?.onPress).toBe('function');
    expect(typeof communityLink?.props?.onPress).toBe('function');
    expect(officialIndex).toBeGreaterThan(-1);
    expect(communityIndex).toBeGreaterThan(officialIndex);
    expect(galleryIndex).toBeGreaterThan(communityIndex);

    (officialLink?.props?.onPress as (() => void) | undefined)?.();
    (communityLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(municipalRouteInformation.sourceLinks[0].url);
    expect(mocks.openURL).toHaveBeenCalledWith(municipalRouteInformation.communityReference.sourceUrl);
  });

  it('keeps the personal gallery device-only, with no online or invented route photos', () => {
    const tree = MunicipalRouteInformationScreen();
    const elements = collectElements(tree);
    const gallery = elements.find((element) => element.type === 'PersonalRouteGallery');
    const privacyNotice = findByTestId(tree, 'gallery-privacy-notice');
    const text = visibleText(tree).join(' ');

    expect(gallery?.props).toEqual({ routeSlug: municipalRouteInformation.slug });
    expect(privacyNotice?.props?.style).toMatchObject({
      backgroundColor: colors.white,
      borderColor: colors.olive700,
      borderRadius: radius.md,
    });
    expect(text).toContain('Aquí solo aparecen imágenes que tú eliges.');
    expect(text).toContain('no se publican, no se sincronizan');
    expect(text).toContain('no mostramos fotos comunitarias ni contenido online');
    expect(text).toContain('IMAGEN CON LICENCIA COMPATIBLE PENDIENTE');
    expect(text).toContain(municipalRouteInformation.gallery.body);
    expect(elements.some((element) => element.type === 'Image')).toBe(false);
    expect(text).not.toContain('Iniciar navegación');
    expect(text).not.toContain('Descargar ruta');
  });

  it('places the historical Commons context gallery on Bedmar before personal photos and the local GPX preview', () => {
    const tree = MunicipalRouteInformationScreen();
    const elements = collectElements(tree);
    const sourceIndex = elements.findIndex((element) => element.props?.testID === 'municipal-sources-card');
    const contextIndex = elements.findIndex((element) => element.type === 'CommonsContextGallery');
    const personalIndex = elements.findIndex((element) => element.props?.testID === 'personal-gallery-section');
    const gpxIndex = elements.findIndex((element) => element.type === 'GpxLocalPreviewSection');

    expect(contextIndex).toBeGreaterThan(sourceIndex);
    expect(contextIndex).toBeLessThan(personalIndex);
    expect(contextIndex).toBeLessThan(gpxIndex);

    mocks.slug = 'unknown-route';
    const missing = MunicipalRouteInformationScreen();
    expect(collectElements(missing).some((element) => element.type === 'CommonsContextGallery')).toBe(false);
  });

  it('places the local GPX preview only on Bedmar after personal content and before the route status footer', () => {
    const tree = MunicipalRouteInformationScreen();
    const elements = collectElements(tree);
    const galleryIndex = elements.findIndex((element) => element.props?.testID === 'personal-gallery-section');
    const gpxIndex = elements.findIndex((element) => element.type === 'GpxLocalPreviewSection');
    const footerIndex = elements.findIndex((element) => element.props?.testID === 'route-status-footer');
    expect(gpxIndex).toBeGreaterThan(galleryIndex);
    expect(gpxIndex).toBeLessThan(footerIndex);

    mocks.slug = 'unknown-route';
    const missing = MunicipalRouteInformationScreen();
    expect(collectElements(missing).some((element) => element.type === 'GpxLocalPreviewSection')).toBe(false);
  });

  it('preserves the existing back-to-home action and unknown-slug recovery', () => {
    const tree = MunicipalRouteInformationScreen();
    const backButton = collectElements(tree).find(
      (element) => element.type === 'Pressable' && element.props?.accessibilityLabel === 'Volver',
    );
    expect(backButton?.props?.accessibilityRole).toBe('button');
    expect(backButton?.props?.accessibilityHint).toContain('lista de rutas');
    expect(backButton?.props?.style).toMatchObject({ width: 48, height: 48 });
    expect(typeof backButton?.props?.onPress).toBe('function');
    (backButton?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.back).toHaveBeenCalledOnce();

    mocks.slug = 'unknown-route';
    const missing = MunicipalRouteInformationScreen();
    const recovery = collectElements(missing).find((element) => element.props?.accessibilityLabel === 'Volver a rutas');
    expect(visibleText(missing).join(' ')).toContain('Información no disponible');
    expect(recovery?.props?.accessibilityRole).toBe('button');
    expect(typeof recovery?.props?.onPress).toBe('function');
  });
});
