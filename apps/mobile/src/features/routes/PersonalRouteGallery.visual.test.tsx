import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  useStateIndex: 0,
  user: { id: 'test-account' } as null | { id: string },
  authLoading: false,
  push: vi.fn(),
}));

vi.mock('react', () => ({
  useEffect: vi.fn(),
  useState: (initialValue: unknown) => {
    const index = mocks.useStateIndex;
    mocks.useStateIndex += 1;
    // Start beyond the initial loading state so this is the genuine empty state.
    return [index === 5 ? false : initialValue, vi.fn()];
  },
}));
vi.mock('expo-image-picker', () => ({ launchImageLibraryAsync: vi.fn() }));
vi.mock('expo-router', () => ({ useRouter: () => ({ push: mocks.push }) }));
vi.mock('../../context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: mocks.authLoading }),
}));
vi.mock('./expo-personal-route-gallery-store', () => ({
  personalRouteGalleryStore: {
    listForRoute: vi.fn().mockResolvedValue([]),
    save: vi.fn(),
    markDeletePending: vi.fn(),
    finishDelete: vi.fn(),
  },
}));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: vi.fn() },
  Image: 'Image',
  KeyboardAvoidingView: 'KeyboardAvoidingView',
  Modal: 'Modal',
  Platform: { OS: 'android' },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  TextInput: 'TextInput',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));

import { PersonalRouteGallery } from './PersonalRouteGallery';
import { colors, radius, spacing } from '../../theme/tokens';
import { personalRouteGalleryStore } from './expo-personal-route-gallery-store';

type ElementLike = { type?: unknown; props?: Record<string, unknown> };

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

beforeEach(() => {
  mocks.useStateIndex = 0;
  mocks.user = { id: 'test-account' };
  mocks.authLoading = false;
  mocks.push.mockReset();
  vi.mocked(personalRouteGalleryStore.listForRoute).mockClear();
});

describe('personal route gallery visual contract', () => {
  it('uses the existing warm/olive card treatment and readable copy for an empty local gallery', () => {
    const tree = PersonalRouteGallery({ routeSlug: 'sendero-fluvial-cueva-del-agua' });
    const elements = collectElements(tree);
    const emptyState = elements.find((element) => element.props?.testID === 'personal-gallery-empty-state');
    const emptyBody = elements.find((element) =>
      element.type === 'Text' && visibleText(element).join('') === 'Elige una foto del dispositivo y añade su pie y autor.',
    );

    expect(emptyState?.props?.style).toMatchObject({
      minHeight: 184,
      borderRadius: radius.md,
      borderStyle: 'dashed',
      borderColor: colors.olive700,
      backgroundColor: colors.white,
      padding: spacing[20],
    });
    expect(emptyBody?.props?.style).toMatchObject({
      color: colors.ink,
      fontSize: 13,
      lineHeight: 19,
    });
  });

  it('keeps the local add action on the existing olive accent with a 48px minimum target', () => {
    const tree = PersonalRouteGallery({ routeSlug: 'sendero-fluvial-cueva-del-agua' });
    const elements = collectElements(tree);
    const addButton = elements.find((element) =>
      element.type === 'Pressable' && element.props?.accessibilityLabel === 'Elegir una foto propia del dispositivo',
    );
    const style = addButton?.props?.style;
    const resolvedStyles = typeof style === 'function'
      ? (style as (state: { pressed: boolean }) => unknown)({ pressed: false })
      : style;
    const addButtonStyle = Array.isArray(resolvedStyles)
      ? resolvedStyles.find((entry) => entry !== null && typeof entry === 'object' && 'backgroundColor' in entry)
      : resolvedStyles;
    const addButtonText = elements.find((element) =>
      element.type === 'Text' && visibleText(element).join('') === 'Añadir foto propia',
    );

    expect(addButtonStyle).toMatchObject({
      minHeight: 48,
      borderRadius: radius.md,
      backgroundColor: colors.olive700,
      paddingHorizontal: spacing[16],
    });
    expect(addButtonText?.props?.style).toMatchObject({ color: colors.white, fontSize: 14 });
    expect(contrastRatio(colors.white, colors.olive700)).toBeGreaterThanOrEqual(4.5);
  });

  it('does not read or show personal photos to a guest and offers an accessible sign-in action', () => {
    mocks.user = null;
    const tree = PersonalRouteGallery({ routeSlug: 'sendero-fluvial-cueva-del-agua' });
    const elements = collectElements(tree);
    const gate = elements.find((element) => element.props?.testID === 'personal-gallery-auth-required');
    const login = elements.find((element) => element.props?.accessibilityLabel === 'Iniciar sesión o registrarse para la galería personal');
    const text = visibleText(tree).join(' ');

    expect(gate).toBeDefined();
    expect(text).toContain('Galería personal protegida');
    expect(text).toContain('Las imágenes Commons y la ficha pública siguen disponibles');
    expect(text).not.toContain('Tu galería personal está vacía');
    expect(text).not.toContain('Foto personal ampliada');
    expect(login?.props?.accessibilityRole).toBe('button');
    expect(login?.props?.accessibilityHint).toContain('volverás a la ficha pública de Bedmar');
    (login?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith({ pathname: '/login', params: { returnTo: 'bedmar-gallery' } });
    expect(personalRouteGalleryStore.listForRoute).not.toHaveBeenCalled();
  });
});
