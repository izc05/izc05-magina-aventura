import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import { describe, expect, it } from 'vitest';

import { belongsToRoute } from './active-adventure-recovery';

const route = {
  id: 'route-1',
  slug: 'sendero-1',
} as Parameters<typeof belongsToRoute>[1];

const state = {
  session: { routeId: 'route-1', routeSlug: 'sendero-1' },
} as ActivityEngineState;

describe('belongsToRoute', () => {
  it('reuses in-memory state only for the displayed route', () => {
    expect(belongsToRoute(state, route)).toBe(true);
    expect(belongsToRoute(state, { ...route, id: 'route-2' })).toBe(false);
    expect(belongsToRoute(state, { ...route, slug: 'sendero-2' })).toBe(false);
    expect(belongsToRoute(null, route)).toBe(false);
  });
});
