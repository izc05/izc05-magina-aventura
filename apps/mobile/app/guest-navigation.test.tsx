import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  openURL: vi.fn().mockResolvedValue(true),
  localSearchParams: vi.fn().mockReturnValue({}),
  signInWithPassword: vi.fn(),
}));

vi.mock('react', () => ({
  __esModule: true,
  default: {},
  useState: (initialValue: unknown) => [initialValue, vi.fn()],
}));
vi.mock('expo-router', () => ({
  router: { push: mocks.push, replace: mocks.replace },
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, back: mocks.back }),
  useLocalSearchParams: mocks.localSearchParams,
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Image: 'Image',
  Linking: { openURL: mocks.openURL },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
vi.mock('../src/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: mocks.signInWithPassword, signUp: vi.fn() } },
}));
vi.mock('../src/components/ui/HeroTerritory', () => ({ HeroTerritory: 'HeroTerritory' }));
vi.mock('../src/components/ui/RouteCard', () => ({ RouteCard: 'RouteCard' }));
vi.mock('../src/features/routes/adelfal-cuadros-photo', () => ({ adelfalCuadrosPhotoSource: 1 }));
vi.mock('../src/features/routes/PersonalRouteGallery', () => ({ PersonalRouteGallery: 'PersonalRouteGallery' }));

import LoginScreen from './login';
import RoutesHomeScreen from './index';
import PublicRouteCatalogScreen from './routes/index';
import AdelfalDeCuadrosOfficialRouteScreen from './official-routes/adelfal-de-cuadros';

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
  mocks.localSearchParams.mockReturnValue({});
});

describe('guest read-only navigation', () => {
  it('returns to the Adelfal pilot after sign-in from its private gallery', async () => {
    mocks.localSearchParams.mockReturnValue({ returnTo: 'route-gallery', slug: 'adelfal-de-cuadros' });
    mocks.signInWithPassword.mockResolvedValue({ error: null });
    const tree = LoginScreen();
    const signIn = collectElements(tree).find(
      (element) => element.type === 'Pressable' && visibleText(element).join('').includes('Iniciar Sesión'),
    );

    expect(signIn).toBeDefined();
    (signIn?.props?.onPress as (() => void) | undefined)?.();
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/official-routes/adelfal-de-cuadros'));
  });

  it('opens Home from the guest CTA and routes Home and catalog to the sole Adelfal pilot', () => {
    const loginTree = LoginScreen();
    const loginText = visibleText(loginTree).join(' ');
    const guestCta = collectElements(loginTree).find(
      (element) => element.props?.accessibilityLabel === 'Explorar sin cuenta',
    );

    expect(loginText).toContain('Iniciar Sesión');
    expect(loginText).toContain('Registrarse');
    expect(guestCta?.props?.accessibilityRole).toBe('button');
    expect(guestCta?.props?.accessibilityHint).toContain('sin iniciar sesión ni crear una cuenta');
    (guestCta?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/');

    vi.stubGlobal('__DEV__', false);
    const homeTree = RoutesHomeScreen();
    const homeText = visibleText(homeTree).join(' ');
    expect(homeText).toContain('Adelfal de Cuadros');
    expect(homeText).not.toContain('Cueva del Agua');
    const homeCard = collectElements(homeTree).find((element) => element.props?.testID === 'home-adelfal-route-card');
    (homeCard?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith('/official-routes/adelfal-de-cuadros');

    const catalogLink = collectElements(homeTree).find(
      (element) => element.props?.accessibilityLabel === 'Abrir catálogo público de rutas',
    );
    (catalogLink?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith('/routes');

    const catalogTree = PublicRouteCatalogScreen();
    const catalogText = visibleText(catalogTree).join(' ');
    expect(catalogText).toContain('Adelfal de Cuadros');
    expect(catalogText).not.toContain('Cueva del Agua');
    const card = collectElements(catalogTree).find(
      (element) => element.props?.testID === 'public-adelfal-route-card',
    );
    expect(card).toBeDefined();
    (card?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith('/official-routes/adelfal-de-cuadros');

    const officialTree = AdelfalDeCuadrosOfficialRouteScreen();
    const officialText = visibleText(officialTree).join(' ').replace(/\s+/g, ' ').trim();
    const elements = collectElements(officialTree);
    const privateGallery = elements.find((element) => element.type === 'PersonalRouteGallery');
    expect(officialText).toContain('453 m');
    expect(officialText).toContain('20 min');
    expect(officialText).not.toContain('Iniciar navegación');
    expect(officialText).not.toContain('Cueva del Agua');
    expect(privateGallery?.props?.routeSlug).toBe('adelfal-de-cuadros');
    expect(elements.some((element) => element.type === 'RouteMap')).toBe(false);
    const back = elements.find(
      (element) => element.props?.accessibilityLabel === 'Volver al catálogo público de rutas',
    );
    (back?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.replace).toHaveBeenCalledWith('/routes');
  });
});
