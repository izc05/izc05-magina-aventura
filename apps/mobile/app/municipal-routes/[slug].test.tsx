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

describe('Bedmar municipal route QA detail UI and accessibility', () => {
  it('keeps source panels and personal-gallery guidance on the existing warm/olive visual tokens', () => {
    const tree = MunicipalRouteInformationScreen();
    const officialCard = findByTestId(tree, 'official-source-card');
    const communityCard = findByTestId(tree, 'community-source-card');
    const privacyNotice = findByTestId(tree, 'gallery-privacy-notice');
    const communityNote = collectElements(tree).find((element) =>
      element.type === 'Text'
        && visibleText(element).join('') === municipalRouteInformation.communityReference.note,
    );
    const privacyBody = collectElements(tree).find((element) =>
      element.type === 'Text'
        && visibleText(element).join('').startsWith('Tus fotos se guardan en el almacenamiento privado'),
    );

    expect(officialCard?.props?.style).toMatchObject({
      borderRadius: radius.md,
      borderLeftColor: colors.olive700,
      backgroundColor: colors.white,
      padding: spacing[16],
    });
    expect(communityCard?.props?.style).toMatchObject({
      borderRadius: radius.md,
      borderLeftColor: colors.aoveGold,
      backgroundColor: colors.warmBackground,
    });
    expect(communityNote?.props?.style).toMatchObject({ color: colors.ink, fontSize: 13, lineHeight: 19 });
    expect(privacyNotice?.props?.style).toMatchObject({
      borderRadius: radius.md,
      borderColor: colors.olive700,
      backgroundColor: colors.white,
    });
    expect(privacyBody?.props?.style).toMatchObject({ fontSize: 13, lineHeight: 19, color: colors.ink });
    expect(contrastRatio(colors.earth, colors.warmBackground)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.olive700, colors.white)).toBeGreaterThanOrEqual(4.5);
    expect(contrastRatio(colors.ink, colors.warmBackground)).toBeGreaterThanOrEqual(4.5);
  });

  it('shows the official endpoints and two-way note without presenting the context map as route geometry', () => {
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    const map = elements.find((element) => element.type === 'RouteMap');

    expect(text).toContain('FICHA PILOTO · QA');
    expect(text).toContain('Sendero Fluvial de la Cueva del Agua');
    expect(text).toContain('Puente Blanco de Las Tinajas');
    expect(text).toContain('Entrada de la Cueva del Agua');
    expect(text).toContain('puede recorrerse en ambos sentidos');
    expect(text).toContain('Trazado en preparación');
    expect(text).toContain('DATOS OFICIALES');
    expect(text).toContain('NO OFICIAL');
    expect(text).toContain('no reproduce métricas, texto, fotos ni geometría de Wikiloc.');
    expect(text).not.toContain('One Way');
    expect(text).not.toContain('0,34 mi');
    expect(text).not.toContain('39 ft');
    expect(map?.props).toMatchObject({
      payload: null,
      mapStyle: OPENFREEMAP_LIBERTY_STYLE_URL,
      baseMapOnly: true,
      attribution: true,
      showLayerControls: false,
      height: 228,
    });
    expect(map?.props).not.toHaveProperty('deviceLocation');
  });

  it('separates official source facts from the non-official Wikiloc link before the personal gallery', () => {
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const municipalHeading = text.indexOf('DATOS OFICIALES');
    const communityHeading = text.indexOf('Referencia comunitaria · Wikiloc');
    const galleryHeading = text.indexOf('Galería personal');

    expect(text).toContain('ESTADO · FUENTE MUNICIPAL');
    expect(text).toContain('NOMBRE PUBLICADO');
    expect(text).toContain('EXTREMOS INDICADOS');
    expect(text).toContain('EXTREMO MUNICIPAL A');
    expect(text).toContain('EXTREMO MUNICIPAL B');
    expect(text).toContain('AMBOS SENTIDOS');
    expect(text).toContain('Abrir aviso municipal original');
    expect(text).toContain('REFERENCIA COMUNITARIA');
    expect(text).toContain('Abrir ficha de Wikiloc · referencia no oficial');
    expect(text).not.toContain('Distancia comunitaria');
    expect(text).not.toContain('Desnivel positivo comunitario');
    expect(text).not.toContain('One Way');
    expect(municipalHeading).toBeGreaterThan(-1);
    expect(communityHeading).toBeGreaterThan(municipalHeading);
    expect(galleryHeading).toBeGreaterThan(communityHeading);
    expect(text).not.toContain('Duración');
  });

  it('labels the device-only personal gallery and context map without adding online photos or false route actions', () => {
    const tree = MunicipalRouteInformationScreen();
    const elements = collectElements(tree);
    const gallery = elements.find((element) => element.type === 'PersonalRouteGallery');
    const contextMap = elements.find((element) =>
      element.props?.accessibilityLabel === municipalRouteInformation.contextMap.accessibilityLabel,
    );
    const allText = visibleText(tree).join(' ');

    expect(gallery?.props).toEqual({ routeSlug: municipalRouteInformation.slug });
    expect(allText).toContain('Galería personal');
    expect(allText).toContain('Solo en este dispositivo');
    expect(allText).toContain('No se publican ni se sincronizan');
    expect(allText).toContain('no mostramos fotos comunitarias ni contenido online');
    expect(allText).toContain('no pide acceso general a toda tu fototeca');
    expect(contextMap?.props?.accessible).toBe(true);
    expect(contextMap?.props?.accessibilityRole).toBe('image');
    expect(elements.some((element) => element.type === 'Image')).toBe(false);
    expect(allText.toLowerCase()).toContain('licencia compatible');
    expect(allText).toContain(municipalRouteInformation.gallery.body);
    expect(allText).not.toContain('Iniciar ruta');
    expect(allText).not.toContain('Comenzar navegación');
    expect(allText).not.toContain('Descargar ruta');
    expect(allText).not.toContain('Desbloqueaste');
  });

  it('provides accessible, functional links for official/community information and source citations', () => {
    const tree = MunicipalRouteInformationScreen();
    const elements = collectElements(tree);
    const officialLabel = `Abrir aviso municipal original: ${municipalRouteInformation.sourceLinks[0].label}`;
    const officialLink = elements.find((element) =>
      element.type === 'Pressable' && element.props?.accessibilityLabel === officialLabel,
    );
    const wikilocLink = elements.find((element) =>
      element.type === 'Pressable'
        && element.props?.accessibilityLabel === municipalRouteInformation.communityReference.sourceLabel,
    );

    expect(officialLink?.props?.accessibilityRole).toBe('link');
    expect(officialLink?.props?.accessibilityHint).toContain('publicación original del Ayuntamiento');
    expect(typeof officialLink?.props?.onPress).toBe('function');
    expect(wikilocLink?.props?.accessibilityRole).toBe('link');
    expect(wikilocLink?.props?.accessibilityLabel).toContain('no oficial');
    expect(wikilocLink?.props?.accessibilityHint).toContain('no oficial');
    expect(typeof wikilocLink?.props?.onPress).toBe('function');

    (officialLink?.props?.onPress as (() => void) | undefined)?.();
    (wikilocLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(municipalRouteInformation.sourceLinks[0].url);
    expect(mocks.openURL).toHaveBeenCalledWith(municipalRouteInformation.communityReference.sourceUrl);
  });

  it('renders an accessible recovery action for an unknown route slug', () => {
    mocks.slug = 'unknown-route';
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const elements = collectElements(tree);
    const recovery = elements.find((element) => element.props?.accessibilityLabel === 'Volver a rutas');

    expect(text).toContain('Información no disponible');
    expect(recovery?.props?.accessibilityRole).toBe('button');
    expect(typeof recovery?.props?.onPress).toBe('function');
  });
});
