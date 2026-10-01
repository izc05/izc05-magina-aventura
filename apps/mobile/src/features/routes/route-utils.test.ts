import { afterEach, describe, expect, it, vi } from 'vitest';

import { durationLabel, getDevelopmentRouteBySlug } from './route-utils';

afterEach(() => vi.unstubAllGlobals());

describe('development route lookup', () => {
  it('keeps fixture routes available in the development preview', () => {
    vi.stubGlobal('__DEV__', true);

    expect(getDevelopmentRouteBySlug('sendero-de-cuadros-dev')?.developmentFixture).toBe(true);
  });

  it('withholds every development fixture from production builds', () => {
    vi.stubGlobal('__DEV__', false);

    for (const slug of [
      'sendero-de-cuadros-dev',
      'subida-pico-magina-dev',
      'cueva-del-agua-dev',
    ]) {
      expect(getDevelopmentRouteBySlug(slug)).toBeUndefined();
    }
  });
});

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
