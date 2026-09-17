import { describe, expect, it } from 'vitest';

import { getAdventureLandscapePreset } from './adventure-landscape-preset';

describe('coded adventure landscape presets', () => {
  it('keeps one coherent landscape language across home, cards and route flow', () => {
    expect(getAdventureLandscapePreset('home')).toMatchObject({
      minHeight: 330,
      sunSize: 82,
      pathWidth: 54,
    });

    expect(getAdventureLandscapePreset('card')).toMatchObject({
      minHeight: 204,
      sunSize: 82,
      pathWidth: 48,
    });

    expect(getAdventureLandscapePreset('detail')).toMatchObject({
      minHeight: 330,
      sunSize: 104,
      pathWidth: 58,
    });

    expect(getAdventureLandscapePreset('prepare')).toMatchObject({
      minHeight: 290,
      sunSize: 82,
      pathWidth: 50,
    });
  });

  it('uses the same ordered depth model for every variant', () => {
    for (const variant of ['home', 'card', 'detail', 'prepare'] as const) {
      const preset = getAdventureLandscapePreset(variant);
      expect(preset.layers).toEqual(['glow', 'sun', 'back', 'mid', 'front', 'path']);
    }
  });
});
