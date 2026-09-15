import { describe, expect, it } from 'vitest';

import { durationLabel } from './route-utils';

describe('durationLabel', () => {
  it('shows minutes without a zero-hour prefix for routes under one hour', () => {
    expect(durationLabel(45)).toBe('45 min');
  });

  it('shows full hours without trailing minutes', () => {
    expect(durationLabel(120)).toBe('2 h');
  });

  it('shows hours and remaining minutes for mixed durations', () => {
    expect(durationLabel(150)).toBe('2 h 30 min');
  });
});
