import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  user: null as null | { id: string; email: string },
  isLoading: false,
  activityId: 'synthetic-session-id',
  ownedState: undefined as unknown,
  stateCall: 0,
  push: vi.fn(),
  replace: vi.fn(),
  alert: vi.fn(),
  loadPassportGpsSessionDetail: vi.fn().mockResolvedValue(null),
  deletePassportGpsSession: vi.fn().mockResolvedValue(true),
}));

vi.mock('react', () => ({
  useEffect: (effect: () => void | (() => void)) => { effect(); },
  useMemo: (factory: () => unknown) => factory(),
  useRef: (initialValue: unknown) => ({ current: initialValue }),
  useState: (initialValue: unknown) => {
    const call = mocks.stateCall++;
    return [call === 0 && mocks.ownedState !== undefined ? mocks.ownedState : initialValue, vi.fn()];
  },
}));
vi.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ activityId: mocks.activityId }),
  useRouter: () => ({ push: mocks.push, replace: mocks.replace }),
}));
vi.mock('expo-status-bar', () => ({ StatusBar: 'StatusBar' }));
vi.mock('react-native-safe-area-context', () => ({ SafeAreaView: 'SafeAreaView' }));
vi.mock('../../../src/context/AuthContext', () => ({
  useAuth: () => ({ user: mocks.user, isLoading: mocks.isLoading }),
}));
vi.mock('../../../src/activity/sqlite-activity-store', () => ({
  sqliteActivityStore: {
    loadPassportGpsSessionDetail: mocks.loadPassportGpsSessionDetail,
    deletePassportGpsSession: mocks.deletePassportGpsSession,
  },
}));
vi.mock('../../../src/map/RouteMap', () => ({ RouteMap: 'MockPersonalSessionMap' }));
vi.mock('react-native', () => ({
  ActivityIndicator: 'ActivityIndicator',
  Alert: { alert: mocks.alert },
  Pressable: 'Pressable',
  ScrollView: 'ScrollView',
  StyleSheet: { create: (styles: unknown) => styles },
  Text: 'Text',
  View: 'View',
}));

import PassportGpsSessionScreen from './[activityId]';
import { PassportGpsSessionDetailPanel } from '../../../src/features/passport/PassportGpsSessionDetailPanel';
import type { PassportGpsSessionDetail } from '../../../src/activity/activity-store';

type ElementLike = { type?: unknown; props?: Record<string, unknown> };
type AlertButtonLike = { text?: string; style?: string; onPress?: () => void };
function collectElements(node: unknown, elements: ElementLike[] = []): ElementLike[] {
  if (Array.isArray(node)) {
    for (const child of node) collectElements(child, elements);
  } else if (node !== null && typeof node === 'object' && 'props' in node) {
    const element = node as ElementLike;
    elements.push(element);
    collectElements(element.props?.children, elements);
  }
  return elements;
}
function collectText(node: unknown, text: string[] = []): string[] {
  if (typeof node === 'string' || typeof node === 'number') text.push(String(node));
  else if (Array.isArray(node)) for (const child of node) collectText(child, text);
  else if (node !== null && typeof node === 'object' && 'props' in node) {
    collectText((node as ElementLike).props?.children, text);
  }
  return text;
}

// Synthetic test-only values; no real user coordinates or account data are used.
const detail: PassportGpsSessionDetail = {
  activityId: 'synthetic-session-id',
  finishedAt: '2026-09-28T08:10:00.000Z',
  distanceMeters: 240,
  elapsedSeconds: 180,
  sampleCount: 2,
  samples: [
    { sequence: 1, timestamp: '2026-09-28T08:00:00.000Z', latitude: 37.5, longitude: -3.5, accuracyMeters: 6, validForMetrics: true, rejectionReason: null, activeIntervalStartedAt: '2026-09-28T08:00:00.000Z' },
    { sequence: 2, timestamp: '2026-09-28T08:00:05.000Z', latitude: 37.501, longitude: -3.501, accuracyMeters: 6, validForMetrics: true, rejectionReason: null, activeIntervalStartedAt: '2026-09-28T08:00:00.000Z' },
  ],
};

function renderScreen() {
  mocks.stateCall = 0;
  return PassportGpsSessionScreen();
}
function renderReady(ownerId = 'account-a') {
  mocks.user = { id: ownerId, email: `${ownerId}@example.test` };
  mocks.activityId = detail.activityId;
  mocks.ownedState = {
    ownerId,
    activityId: detail.activityId,
    state: { status: 'ready', data: detail },
  };
  const tree = renderScreen();
  const panel = collectElements(tree).find((element) => element.type === PassportGpsSessionDetailPanel);
  if (!panel) throw new Error('Expected the session detail panel');
  return panel;
}
function latestAlertButtons(): { message: string; buttons: AlertButtonLike[] } {
  const call = mocks.alert.mock.calls.at(-1) as unknown[] | undefined;
  if (!call) throw new Error('Expected a confirmation dialog');
  return { message: String(call[1]), buttons: call[2] as AlertButtonLike[] };
}

beforeEach(() => {
  mocks.user = null;
  mocks.isLoading = false;
  mocks.activityId = detail.activityId;
  mocks.ownedState = undefined;
  mocks.stateCall = 0;
  mocks.push.mockReset();
  mocks.replace.mockReset();
  mocks.alert.mockReset();
  mocks.loadPassportGpsSessionDetail.mockReset().mockResolvedValue(null);
  mocks.deletePassportGpsSession.mockReset().mockResolvedValue(true);
});

describe('personal GPS session route access and ownership', () => {
  it('protects direct guest access and never reads or deletes personal data', () => {
    const tree = renderScreen();
    const text = collectText(tree).join(' ');
    const elements = collectElements(tree);
    const login = elements.find((element) => element.props?.accessibilityLabel === 'Iniciar sesión para consultar el Pasaporte personal');
    expect(text).toContain('Detalle personal protegido');
    expect(text).toContain('no se muestran a visitantes');
    expect(elements.some((element) => element.type === PassportGpsSessionDetailPanel)).toBe(false);
    expect(login?.props?.accessibilityRole).toBe('button');
    (login?.props?.onPress as (() => void) | undefined)?.();
    expect(mocks.push).toHaveBeenCalledWith({ pathname: '/login', params: { returnTo: 'passport' } });
    expect(mocks.loadPassportGpsSessionDetail).not.toHaveBeenCalled();
    expect(mocks.deletePassportGpsSession).not.toHaveBeenCalled();
  });

  it('queries the requested session with the authenticated owner ID', () => {
    mocks.user = { id: 'account-a', email: 'a@example.test' };
    mocks.activityId = detail.activityId;
    renderScreen();
    expect(mocks.loadPassportGpsSessionDetail).toHaveBeenCalledOnce();
    expect(mocks.loadPassportGpsSessionDetail).toHaveBeenCalledWith('account-a', detail.activityId);
  });

  it('does not render a cached account-A detail for account B while B is loading', () => {
    mocks.user = { id: 'account-b', email: 'b@example.test' };
    mocks.ownedState = {
      ownerId: 'account-a',
      activityId: detail.activityId,
      state: { status: 'ready', data: detail },
    };
    const tree = renderScreen();
    const panel = collectElements(tree).find((element) => element.type === PassportGpsSessionDetailPanel);
    expect(panel?.props?.state).toEqual({ status: 'loading' });
    expect(mocks.loadPassportGpsSessionDetail).toHaveBeenCalledWith('account-b', detail.activityId);
  });

  it('requires confirmation and Cancelar never calls the owner-scoped delete', () => {
    const panel = renderReady('account-a');
    (panel.props?.onRequestDelete as (() => void) | undefined)?.();
    const { message, buttons } = latestAlertButtons();
    expect(message).toContain('solo las muestras');
    expect(message).toContain('cola local');
    expect(message).toContain('No se tocarán fotos, rutas ni otras sesiones');
    expect(buttons[0]?.text).toBe('Cancelar');
    expect(buttons[1]?.style).toBe('destructive');
    buttons[0]?.onPress?.();
    expect(mocks.deletePassportGpsSession).not.toHaveBeenCalled();
  });

  it('deletes only after confirmation with both owner and activity IDs', async () => {
    const panel = renderReady('account-a');
    (panel.props?.onRequestDelete as (() => void) | undefined)?.();
    latestAlertButtons().buttons[1]?.onPress?.();
    latestAlertButtons().buttons[1]?.onPress?.();
    expect(mocks.deletePassportGpsSession).toHaveBeenCalledOnce();
    expect(mocks.deletePassportGpsSession).toHaveBeenCalledWith('account-a', detail.activityId);
    await vi.waitFor(() => expect(mocks.replace).toHaveBeenCalledWith('/profile'));
  });

  it('keeps the session and stays on detail if owner-scoped local deletion fails', async () => {
    const panel = renderReady('account-a');
    mocks.deletePassportGpsSession.mockRejectedValue(new Error('local SQLite failure'));
    (panel.props?.onRequestDelete as (() => void) | undefined)?.();
    latestAlertButtons().buttons[1]?.onPress?.();
    await vi.waitFor(() => expect(mocks.deletePassportGpsSession).toHaveBeenCalledOnce());
    await vi.waitFor(() => expect(mocks.replace).not.toHaveBeenCalled());
    expect(mocks.alert).toHaveBeenCalledTimes(2);
  });
});
