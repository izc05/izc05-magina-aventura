import { describe, expect, it } from 'vitest';

import { colors } from './tokens';

describe('visual tokens', () => {
  it('matches the approved Mágina Aventura palette', () => {
    expect(colors.olive900).toBe('#2F4A2E');
    expect(colors.aoveGold).toBe('#D4AF37');
    expect(colors.limestone).toBe('#E7E1D6');
    expect(colors.warmBackground).toBe('#FAF9F6');
    expect(colors.sky).toBe('#7FB3D9');
  });
});
