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
import { adelfalDeCuadrosInformation } from '../src/features/routes/adelfal-de-cuadros-information';

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

describe('Home controls', () => {
  it('keeps search and difficulty filters unavailable with accessible status', () => {
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
  });

  it('opens the public catalog and does not show development fixtures or Cueva del Agua', () => {
    const tree = renderHome(false);
    const elements = collectElements(tree);
    const catalog = elements.find(
      (element) => element.props?.accessibilityLabel === 'Abrir catálogo público de rutas',
    );
    const text = visibleText(tree).join(' ');

    expect(catalog?.props?.accessibilityRole).toBe('button');
    expect(catalog?.props?.accessibilityHint).toContain('sin iniciar sesión');
    expect(catalog?.props?.disabled).not.toBe(true);
    expect(text).toContain(adelfalDeCuadrosInformation.title);
    expect(text).not.toContain('Sendero de Cuadros y Adarves');
    expect(text).not.toContain('Ascensión al Pico Mágina');
    expect(text).not.toContain('Ruta Cueva del Agua y Coleto');
    expect(text).not.toContain('Cueva del Agua');

    (catalog?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith('/routes');
  });

  it('shows exactly one pilot card on Home with Junta facts, dated notice and no map or navigation', () => {
    const tree = renderHome(false);
    const elements = collectElements(tree);
    const card = elements.find((element) => element.props?.testID === 'home-adelfal-route-card');
    const pilotBadges = elements.filter((element) =>
      element.type === 'Text' && visibleText(element).join('').includes('PILOTO'),
    );
    const text = visibleText(tree).join(' ').replace(/\s+/g, ' ').trim();

    expect(card).toBeDefined();
    expect(pilotBadges).toHaveLength(1);
    expect(text).toContain('Adelfal de Cuadros · Bedmar y Garcíez');
    expect(text).toContain('Ficha de la Junta de Andalucía');
    expect(text).toContain('Lineal');
    expect(text).toContain('453 m de ida');
    expect(text).toContain('20 min');
    expect(text).toContain('Dificultad baja');
    expect(text).toContain('Senda');
    expect(text).toContain('sombra abundante');
    expect(text).toContain(adelfalDeCuadrosInformation.noticeDate);
    expect(text).toContain(adelfalDeCuadrosInformation.publishedStatus);
    expect(text).toContain('pendiente de revisión al final del desarrollo');
    expect(text).not.toContain('Cueva del Agua');
    expect(text).not.toMatch(/Iniciar navegación|navegación GPS|checkpoint/i);
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);

    expect(card?.props?.accessibilityRole).toBe('button');
    (card?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith('/official-routes/adelfal-de-cuadros');
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

  it('keeps the passport entry distinct from public route browsing', () => {
    const tree = renderHome(false);
    const passportTab = collectElements(tree).find(
      (element) => element.props?.accessibilityRole === 'tab' && element.props?.accessibilityLabel === 'Pasaporte',
    );

    expect(passportTab?.props?.accessibilityState).toEqual({ disabled: false, selected: false });
    expect(typeof passportTab?.props?.onPress).toBe('function');
    (passportTab?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith('/profile');
  });

  it('does not expose the Theme Tester banner in release builds, but keeps it in development', () => {
    const releaseText = visibleText(renderHome(false)).join(' ');
    expect(releaseText).not.toContain('Probador Visual & Capas');

    const developmentText = visibleText(renderHome(true)).join(' ');
    expect(developmentText).toContain('Probador Visual & Capas');
  });
});
