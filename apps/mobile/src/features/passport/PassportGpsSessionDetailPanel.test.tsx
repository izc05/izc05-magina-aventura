import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({ routeMap: 'MockPrivateRouteMap' }));
vi.mock('react-native', () => ({
  Pressable: 'Pressable',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));
vi.mock('../../map/RouteMap', () => ({ RouteMap: mocks.routeMap }));

import { PassportGpsSessionDetailPanel } from './PassportGpsSessionDetailPanel';
import type { PassportGpsSessionDetail } from '../../activity/activity-store';
import type { PassportGpsTraceMapData } from '../../activity/passport-gps-trace';

type ElementLike = { type?: unknown; props?: Record<string, unknown> };
function collectElements(node: unknown, output: ElementLike[] = []): ElementLike[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, output);
  } else if (node !== null && typeof node === 'object' && 'props' in node) {
    const element = node as ElementLike;
    output.push(element);
    collectElements(element.props?.children, output);
  }
  return output;
}
function collectText(node: unknown, output: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') output.push(String(node));
  else if (Array.isArray(node)) for (const child of node) collectText(child, output);
  else if (node !== null && typeof node === 'object' && 'props' in node) {
    collectText((node as ElementLike).props?.children, output);
  }
  return output;
}

const data: PassportGpsSessionDetail = {
  activityId: 'synthetic-session',
  finishedAt: '2026-09-28T08:10:00.000Z',
  distanceMeters: 240,
  elapsedSeconds: 180,
  sampleCount: 4,
  samples: [],
};
const trace: PassportGpsTraceMapData = {
  segments: [[[-3.5, 37.5], [-3.501, 37.501]]],
  cameraBounds: [-3.502, 37.499, -3.499, 37.502],
};

function render(overrides: Partial<Parameters<typeof PassportGpsSessionDetailPanel>[0]> = {}) {
  return PassportGpsSessionDetailPanel({
    state: { status: 'ready', data },
    trace,
    isMapVisible: false,
    isDeleting: false,
    onToggleMap: vi.fn(),
    onRequestDelete: vi.fn(),
    ...overrides,
  });
}

describe('PassportGpsSessionDetailPanel', () => {
  it('shows local technical details and discloses the basemap tile-area request', () => {
    const tree = render();
    const text = collectText(tree).join(' ');
    expect(text).toContain('Registro GPS personal');
    expect(text).toContain('0.24 km');
    expect(text).toContain('zona visible');
    expect(text).toContain('no recibe la lista de muestras GPS');
    expect(text).not.toMatch(/checkpoint|XP|ranking/i);
    expect(collectElements(tree).some((element) => element.type === mocks.routeMap)).toBe(false);
  });

  it('only mounts the map after the user chooses to show it and never passes route data', () => {
    const tree = render({ isMapVisible: true });
    const map = collectElements(tree).find((element) => element.type === mocks.routeMap);
    expect(map?.props).toMatchObject({ payload: null, baseMapOnly: true, personalSessionTrace: trace });
  });

  it('provides an accessible delete action delegated to the authenticated screen', () => {
    const onRequestDelete = vi.fn();
    const tree = render({ onRequestDelete });
    const deleteButton = collectElements(tree).find(
      (element) => element.props?.accessibilityLabel === 'Eliminar esta captura GPS personal',
    );
    (deleteButton?.props?.onPress as (() => void) | undefined)?.();
    expect(onRequestDelete).toHaveBeenCalledOnce();
  });
});
