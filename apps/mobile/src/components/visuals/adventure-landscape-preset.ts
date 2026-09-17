export type AdventureLandscapeVariant = 'home' | 'card' | 'detail' | 'prepare';

export type AdventureLandscapePreset = Readonly<{
  minHeight: number;
  sunSize: number;
  pathWidth: number;
  layers: readonly ['glow', 'sun', 'back', 'mid', 'front', 'path'];
}>;

const layers = ['glow', 'sun', 'back', 'mid', 'front', 'path'] as const;

const presets: Record<AdventureLandscapeVariant, AdventureLandscapePreset> = {
  home: {
    minHeight: 330,
    sunSize: 82,
    pathWidth: 54,
    layers,
  },
  card: {
    minHeight: 204,
    sunSize: 82,
    pathWidth: 48,
    layers,
  },
  detail: {
    minHeight: 330,
    sunSize: 104,
    pathWidth: 58,
    layers,
  },
  prepare: {
    minHeight: 290,
    sunSize: 82,
    pathWidth: 50,
    layers,
  },
};

export function getAdventureLandscapePreset(
  variant: AdventureLandscapeVariant,
): AdventureLandscapePreset {
  return presets[variant];
}
