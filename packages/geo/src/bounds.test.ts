import { describe, expect, it } from 'vitest';

import { calculateRouteBounds } from './bounds';

describe('calculateRouteBounds', () => {
  it('returns west south east north from lon/lat positions', () => {
    expect(
      calculateRouteBounds([
        [-3.5, 37.72],
        [-3.42, 37.69],
        [-3.46, 37.76],
      ]),
    ).toEqual([-3.5, 37.69, -3.42, 37.76]);
  });

  it('rejects fewer than two coordinates', () => {
    expect(() => calculateRouteBounds([[-3.5, 37.7]])).toThrow(
      'Route requires at least two coordinates',
    );
  });
});
