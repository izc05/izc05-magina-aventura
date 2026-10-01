import { afterEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  back: vi.fn(),
  slug: 'sendero-fluvial-cueva-del-agua',
  returnTo: undefined as string | undefined,
}));

vi.mock('react', () => ({
  __esModule: true,
  default: {},
  useState: (initialValue: unknown) => [initialValue, vi.fn()],
}));
vi.mock('expo-router', () => ({
  router: { push: mocks.push, replace: mocks.replace },
  useRouter: () => ({ push: mocks.push, replace: mocks.replace, back: mocks.back }),
  useLocalSearchParams: () => ({ slug: mocks.slug, returnTo: mocks.returnTo }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('react-native', () => ({
  Alert: { alert: vi.fn() },
  Linking: { openURL: vi.fn().mockResolvedValue(true) },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
vi.mock('../src/lib/supabase', () => ({
  supabase: { auth: { signInWithPassword: vi.fn(), signUp: vi.fn() } },
}));
vi.mock('../src/components/ui/HeroTerritory', () => ({ HeroTerritory: 'HeroTerritory' }));
vi.mock('../src/components/ui/RouteCard', () => ({ RouteCard: 'RouteCard' }));
vi.mock('../src/map/RouteMap', () => ({ RouteMap: 'RouteMap' }));
vi.mock('../src/features/routes/PersonalRouteGallery', () => ({ PersonalRouteGallery: 'PersonalRouteGallery' }));
vi.mock('../src/features/routes/CommonsContextGallery', () => ({ CommonsContextGallery: 'CommonsContextGallery' }));
vi.mock('../src/features/routes/GpxLocalPreviewSection', () => ({ GpxLocalPreviewSection: 'GpxLocalPreviewSection' }));

import LoginScreen from './login';
import RoutesHomeScreen from './index';
import MunicipalRouteInformationScreen from './municipal-routes/[slug]';
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

afterEach(() => {
  mocks.returnTo = undefined;
  vi.unstubAllGlobals();
  vi.clearAllMocks();
});

describe('guest read-only navigation', () => {
  it('opens Home from the accessible guest CTA, opens Bedmar, and returns to Home without a session', () => {
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
    expect(visibleText(homeTree).join(' ')).toContain('Empieza por Bedmar y Garcíez');
    const bedmarCard = collectElements(homeTree).find((element) => element.type === MunicipalRouteInformationCard);
    (bedmarCard?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith({
      pathname: '/municipal-routes/[slug]',
      params: { slug: municipalRouteInformation.slug },
    });

    const bedmarTree = MunicipalRouteInformationScreen();
    const bedmarElements = collectElements(bedmarTree);
    expect(visibleText(bedmarTree).join(' ')).toContain(municipalRouteInformation.title);
    expect(bedmarElements.some((element) => element.type === 'CommonsContextGallery')).toBe(true);
    expect(bedmarElements.some((element) => element.type === 'GpxLocalPreviewSection')).toBe(true);
    expect(bedmarElements.some((element) => element.type === 'PersonalRouteGallery')).toBe(true);
    const back = collectElements(bedmarTree).find(
      (element) => element.props?.accessibilityLabel === 'Volver',
    );
    expect(back?.props?.accessibilityRole).toBe('button');
    (back?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.back).toHaveBeenCalledOnce();
  });
});
