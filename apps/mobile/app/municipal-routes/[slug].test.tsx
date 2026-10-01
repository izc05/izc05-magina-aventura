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
  mocks.slug = 'sendero-fluvial-cueva-del-agua';
  vi.clearAllMocks();
});

describe('Bedmar municipal route QA detail UI and accessibility', () => {
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
    expect(text).toContain('NO OFICIAL');
    expect(text).toContain('One Way');
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

  it('presents municipal extremes before clearly non-official community records and the personal gallery', () => {
    const tree = MunicipalRouteInformationScreen();
    const text = visibleText(tree).join(' ');
    const municipalHeading = text.indexOf('Extremos municipales');
    const communityHeading = text.indexOf('Referencia comunitaria · Wikiloc');
    const galleryHeading = text.indexOf('Galería personal');

    expect(text).toContain('ESTADO · FUENTE MUNICIPAL');
    expect(text).toContain('EXTREMO MUNICIPAL A');
    expect(text).toContain('EXTREMO MUNICIPAL B');
    expect(text).toContain('AMBOS SENTIDOS');
    expect(text).toContain('Registro de usuario · no es una medición municipal');
    expect(text).toContain('Distancia comunitaria · no oficial');
    expect(text).toContain('Desnivel positivo comunitario · no oficial');
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
    const officialLabel = `Abrir fuente: ${municipalRouteInformation.sourceLinks[0].label}`;
    const officialLink = elements.find((element) =>
      element.type === 'Pressable' && element.props?.accessibilityLabel === officialLabel,
    );
    const wikilocLink = elements.find((element) =>
      element.type === 'Pressable'
        && element.props?.accessibilityLabel === municipalRouteInformation.communityReference.sourceLabel,
    );

    expect(officialLink?.props?.accessibilityRole).toBe('link');
    expect(typeof officialLink?.props?.onPress).toBe('function');
    expect(wikilocLink?.props?.accessibilityRole).toBe('link');
    expect(typeof wikilocLink?.props?.onPress).toBe('function');

    (officialLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.openURL).toHaveBeenCalledWith(municipalRouteInformation.sourceLinks[0].url);
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
