import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ push: vi.fn() }));

vi.mock('expo-router', () => ({ router: { push: mocks.push } }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../src/components/ui/HeroTerritory', () => ({ HeroTerritory: 'HeroTerritory' }));
vi.mock('../src/components/ui/RouteCard', () => ({ RouteCard: 'RouteCard' }));
vi.mock('../src/theme/tokens', () => ({
  colors: {
    aoveGold: '#c90', border: '#ddd', earth: '#654', ink: '#123', limestone: '#eee',
    muted: '#777', olive700: '#565', olive900: '#343', warmBackground: '#fafafa', white: '#fff',
  },
  radius: { lg: 16, md: 8, pill: 999, sm: 4 },
  spacing: { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20 },
  typography: { section: 20, title: 24 },
}));

import RoutesHomeScreen from './index';
import { MunicipalRouteInformationCard } from '../src/components/ui/MunicipalRouteInformationCard';
import { municipalRouteInformation } from '../src/features/routes/municipal-route-information';

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

function renderHome(isDev: boolean) {
  vi.stubGlobal('__DEV__', isDev);
  return RoutesHomeScreen();
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('Home inactive controls', () => {
  it('exposes search, difficulty filters and “Ver todas” as unavailable, labelled controls', () => {
    const tree = renderHome(false);
    const elements = collectElements(tree);
    const search = elements.find((element) => element.type === 'TextInput');
    expect(search?.props?.editable).toBe(false);
    expect(search?.props?.accessibilityState).toEqual({ disabled: true });
    expect(search?.props?.accessibilityLabel).toContain('Próximamente');
    expect(visibleText(tree)).toContain('Búsqueda de rutas: próximamente.');

    const filters = elements.filter((element) =>
      element.props?.accessibilityLabel?.toString().startsWith('Filtro '),
    );
    expect(filters).toHaveLength(4);
    for (const filter of filters) {
      expect(filter.props?.disabled).toBe(true);
      expect(filter.props?.accessibilityRole).toBe('button');
      expect(filter.props?.accessibilityState).toEqual({ disabled: true });
      expect(filter.props?.accessibilityLabel).toContain('Próximamente');
    }
    expect(visibleText(tree)).toContain('Filtros de dificultad: próximamente.');

    const seeAll = elements.find(
      (element) => element.props?.accessibilityLabel === 'Ver todas las rutas. Próximamente.',
    );
    expect(seeAll?.props?.disabled).toBe(true);
    expect(seeAll?.props?.accessibilityRole).toBe('button');
    expect(seeAll?.props?.accessibilityState).toEqual({ disabled: true });
    expect(visibleText(seeAll)).toContain('Próximamente');
  });

  it('marks Retos, Colecciones and Ranking as disabled tabs with visible and accessible status', () => {
    const elements = collectElements(renderHome(false));
    const comingSoonTabs = elements.filter(
      (element) => element.props?.accessibilityRole === 'tab'
        && element.props?.accessibilityLabel?.toString().includes('próximamente'),
    );

    expect(comingSoonTabs).toHaveLength(3);
    for (const tab of comingSoonTabs) {
      expect(tab.props?.disabled).toBe(true);
      expect(tab.props?.accessibilityState).toMatchObject({ disabled: true, selected: false });
      expect(visibleText(tab)).toContain('Próximamente');
    }
  });

  it('does not expose the Theme Tester banner in release builds, but keeps it in development', () => {
    const releaseText = visibleText(renderHome(false)).join(' ');
    expect(releaseText).not.toContain('Probador Visual & Capas');

    const developmentText = visibleText(renderHome(true)).join(' ');
    expect(developmentText).toContain('Probador Visual & Capas');
  });
});

describe('Home to Bedmar municipal information navigation', () => {
  it('exposes an accessible, non-GPS Bedmar information card that opens its municipal detail', () => {
    const tree = renderHome(false);
    const homeCard = collectElements(tree).find(
      (element) => element.type === MunicipalRouteInformationCard,
    );

    expect(visibleText(tree)).toContain('Empieza por Bedmar y Garcíez');
    expect(typeof homeCard?.props?.onPress).toBe('function');

    const cardTree = MunicipalRouteInformationCard({
      onPress: homeCard?.props?.onPress as () => void,
    });
    const cardButton = collectElements(cardTree).find((element) => element.type === 'Pressable');
    const cardText = visibleText(cardTree).join(' ');

    expect(cardButton?.props?.accessibilityRole).toBe('button');
    expect(cardButton?.props?.accessibilityLabel).toBe(
      `Abrir ficha QA de ${municipalRouteInformation.title}`,
    );
    expect(cardButton?.props?.accessibilityHint).toContain('ficha informativa');
    expect(cardText).toContain('Abrir ficha completa');
    expect(cardText).toContain('sin navegación GPS');

    (cardButton?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/municipal-routes/[slug]',
      params: { slug: municipalRouteInformation.slug },
    });
  });
});
