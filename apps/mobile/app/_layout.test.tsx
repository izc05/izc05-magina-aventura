import { describe, expect, it, vi } from 'vitest';

vi.mock('../src/activity/background-location-task', () => ({}));
vi.mock('expo-router', () => ({ Stack: 'Stack' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaProvider: 'SafeAreaProvider' }));
vi.mock('../src/context/AuthContext', () => ({ AuthProvider: 'AuthProvider' }));

import RootLayout from './_layout';

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

describe('public route layout', () => {
  it('keeps the session provider but renders Expo Router Stack without a global auth guard', () => {
    const tree = RootLayout();
    const elements = collectElements(tree);
    const authProvider = elements.find((element) => element.type === 'AuthProvider');
    const stack = elements.find((element) => element.type === 'Stack');

    expect(tree.type).toBe('SafeAreaProvider');
    expect(authProvider).toBeDefined();
    expect(stack?.props?.screenOptions).toEqual({ headerShown: false, animation: 'fade' });
    expect(elements.some((element) => String(element.type).includes('AuthGuard'))).toBe(false);
  });
});
