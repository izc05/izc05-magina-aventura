import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-router', () => ({ useRouter: () => ({ push: vi.fn() }) }));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../src/context/AuthContext', () => ({
  useAuth: () => ({ user: { email: 'isi@example.com' }, signOut: vi.fn() }),
}));

import ProfileScreen from './profile';

function collectRenderedText(node: unknown, text: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') {
    text.push(String(node));
    return text;
  }

  if (Array.isArray(node)) {
    for (const child of node) collectRenderedText(child, text);
    return text;
  }

  if (node !== null && typeof node === 'object' && 'props' in node) {
    const props = (node as { props?: { children?: unknown } }).props;
    collectRenderedText(props?.children, text);
  }

  return text;
}

describe('Passport screen progress', () => {
  it('shows an unmistakable empty state instead of fabricated user achievements', () => {
    const visibleText = collectRenderedText(ProfileScreen());

    expect(visibleText).toEqual([
      '← Inicio',
      'Pasaporte',
      'I',
      'isi',
      'Salir',
      'Aún no hay progreso registrado',
      'Aquí aparecerán tus rutas completadas, descubrimientos e insignias cuando se registren.',
    ]);
  });
});
