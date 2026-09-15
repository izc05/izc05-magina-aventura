import { describe, expect, it } from 'vitest';
import { canRouteBeStarted } from './route-status';

describe('canRouteBeStarted', () => {
  it('allows only published routes to start an adventure', () => {
    expect(canRouteBeStarted('draft')).toBe(false);
    expect(canRouteBeStarted('review')).toBe(false);
    expect(canRouteBeStarted('published')).toBe(true);
    expect(canRouteBeStarted('archived')).toBe(false);
  });
});
