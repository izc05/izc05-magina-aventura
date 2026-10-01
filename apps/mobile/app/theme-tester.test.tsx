import { describe, expect, it, vi } from 'vitest';

vi.mock('react', () => ({
  __esModule: true,
  default: {},
  useState: (initialValue: unknown) => [initialValue, vi.fn()],
}));
vi.mock('expo-router', () => ({
  Redirect: 'Redirect',
  useRouter: () => ({ back: vi.fn() }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../src/features/routes/development-route-map-repository', () => ({
  mockRoutePayload: {
    line: { geometry: { coordinates: [] } },
    checkpoints: [],
    pois: [],
    elevationProfile: [],
  },
}));
vi.mock('../src/map/RouteMap', () => ({ RouteMap: 'RouteMap' }));
vi.mock('../src/components/ui/ElevationProfile', () => ({ ElevationProfile: 'ElevationProfile' }));
vi.mock('../src/components/ui/RouteCard', () => ({ RouteCard: 'RouteCard' }));
vi.mock('../src/components/ui/HeroTerritory', () => ({ HeroTerritory: 'HeroTerritory' }));
vi.mock('../src/components/ui/DifficultyChip', () => ({ DifficultyChip: 'DifficultyChip' }));
vi.mock('../src/components/progression/CollectionCard', () => ({ CollectionCard: 'CollectionCard' }));
vi.mock('../src/components/progression/XPRewardCard', () => ({ XPRewardCard: 'XPRewardCard' }));

import ThemeTesterScreen from './theme-tester';

describe('Theme Tester release guard', () => {
  it('redirects direct route access to Home outside development builds', () => {
    vi.stubGlobal('__DEV__', false);

    const element = ThemeTesterScreen() as unknown as {
      type: unknown;
      props?: Record<string, unknown>;
    };

    expect(element.type).toBe('Redirect');
    expect(element.props?.href).toBe('/');
  });
});
