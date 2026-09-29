export const CHECKPOINT_STATES = [
  'LOCKED',
  'NEARBY',
  'AVAILABLE',
  'DISCOVERED',
  'COMPLETED',
] as const;

export type CheckpointState = (typeof CHECKPOINT_STATES)[number];

type GameEventPayload =
  | { type: 'ADVENTURE_STARTED' }
  | { type: 'OBJECTIVE_ACTIVATED'; objectiveId: string }
  | { type: 'CHECKPOINT_NEARBY'; checkpointId: string }
  | { type: 'CHECKPOINT_REACHED'; checkpointId: string }
  | { type: 'CHECKPOINT_STATE_SET'; checkpointId: string; state: CheckpointState }
  | { type: 'DISCOVERY_UNLOCKED'; discoveryId: string }
  | { type: 'CHALLENGE_UNLOCKED'; challengeId: string }
  | { type: 'XP_GAINED'; amount: number; reason: string }
  | { type: 'BADGE_UNLOCKED'; badgeId: string }
  | { type: 'COLLECTIBLE_FOUND'; collectibleId: string }
  | { type: 'ROUTE_PROGRESS'; percent: number; distanceKm?: number; elapsedMinutes?: number }
  | { type: 'ADVENTURE_COMPLETED' };

/** Stable, transport-agnostic messages the Adventure Engine may emit later. */
export type GameEvent = GameEventPayload & { eventId?: string };

/** Implement this at an adapter boundary; this package deliberately has no GPS dependency. */
export type GameEventListener = (event: GameEvent) => void;

/** Playground-only command; reset is intentionally not an Adventure Engine event. */
export type GameKitAction =
  | { type: 'GAME_EVENT'; event: GameEvent }
  | { type: 'RESET_PLAYGROUND'; checkpointIds: readonly string[] };

export const XP_REWARDS = {
  checkpoint: 50,
  discovery: 100,
  secret: 200,
  challenge: 75,
  collectible: 25,
  completedRoute: 500,
} as const;

export const MAX_XP = 9_999;
export const MIN_XP = 0;
export const EXPLORER_LEVELS = [
  { level: 1, name: 'Explorador I', xpRequired: 0 },
  { level: 2, name: 'Explorador II', xpRequired: 200 },
  { level: 3, name: 'Explorador III', xpRequired: 500 },
  { level: 4, name: 'Explorador IV', xpRequired: 900 },
  { level: 5, name: 'Explorador V', xpRequired: 1400 },
] as const;

export interface GameKitState {
  started: boolean;
  completed: boolean;
  activeObjectiveId: string | null;
  progressPercent: number;
  distanceKm: number;
  elapsedMinutes: number;
  xp: number;
  checkpointStates: Record<string, CheckpointState>;
  discoveries: string[];
  challenges: string[];
  badges: string[];
  collectibles: string[];
  eventHistory: GameEvent[];
  processedEventIds: string[];
}

export function createInitialGameKitState(
  checkpointIds: readonly string[],
): GameKitState {
  return {
    started: false,
    completed: false,
    activeObjectiveId: null,
    progressPercent: 0,
    distanceKm: 0,
    elapsedMinutes: 0,
    xp: MIN_XP,
    checkpointStates: Object.fromEntries(
      checkpointIds.map((id, index) => [id, index === 0 ? 'AVAILABLE' : 'LOCKED']),
    ),
    discoveries: [],
    challenges: [],
    badges: [],
    collectibles: [],
    eventHistory: [],
    processedEventIds: [],
  };
}

function normalizeXp(xp: number) {
  return Math.min(MAX_XP, Math.max(MIN_XP, Number.isFinite(xp) ? Math.floor(xp) : MIN_XP));
}

export function getExplorerLevel(xp: number) {
  const safeXp = normalizeXp(xp);
  return [...EXPLORER_LEVELS].reverse().find((level) => safeXp >= level.xpRequired) ?? EXPLORER_LEVELS[0];
}

function appendUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}

function boundedNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

function recordEvent(state: GameKitState, next: GameKitState, event: GameEvent): GameKitState {
  if (next === state && !event.eventId) return state;
  return {
    ...next,
    eventHistory: [...state.eventHistory, event].slice(-50),
    processedEventIds: event.eventId
      ? [...state.processedEventIds, event.eventId]
      : state.processedEventIds,
  };
}

export function reduceGameEvent(state: GameKitState, event: GameEvent): GameKitState {
  if (event.eventId && state.processedEventIds.includes(event.eventId)) return state;

  let next = state;
  switch (event.type) {
    case 'ADVENTURE_STARTED':
      if (!state.started && !state.completed) next = { ...state, started: true };
      break;
    case 'OBJECTIVE_ACTIVATED':
      if (!state.completed && state.activeObjectiveId !== event.objectiveId) {
        next = { ...state, activeObjectiveId: event.objectiveId };
      }
      break;
    case 'CHECKPOINT_NEARBY': {
      const current = state.checkpointStates[event.checkpointId] ?? 'LOCKED';
      if (current === 'LOCKED' || current === 'AVAILABLE') {
        next = {
          ...state,
          checkpointStates: { ...state.checkpointStates, [event.checkpointId]: 'NEARBY' },
        };
      }
      break;
    }
    case 'CHECKPOINT_REACHED': {
      const current = state.checkpointStates[event.checkpointId] ?? 'LOCKED';
      if (current !== 'DISCOVERED' && current !== 'COMPLETED') {
        next = {
          ...state,
          checkpointStates: { ...state.checkpointStates, [event.checkpointId]: 'DISCOVERED' },
        };
      }
      break;
    }
    case 'CHECKPOINT_STATE_SET':
      if (state.checkpointStates[event.checkpointId] !== event.state) {
        next = {
          ...state,
          checkpointStates: { ...state.checkpointStates, [event.checkpointId]: event.state },
        };
      }
      break;
    case 'DISCOVERY_UNLOCKED':
      if (!state.discoveries.includes(event.discoveryId)) {
        next = { ...state, discoveries: appendUnique(state.discoveries, event.discoveryId) };
      }
      break;
    case 'CHALLENGE_UNLOCKED':
      if (!state.challenges.includes(event.challengeId)) {
        next = { ...state, challenges: appendUnique(state.challenges, event.challengeId) };
      }
      break;
    case 'XP_GAINED': {
      const amount = Number.isFinite(event.amount) ? Math.max(0, Math.floor(event.amount)) : 0;
      const xp = normalizeXp(state.xp + amount);
      if (xp !== state.xp) next = { ...state, xp };
      break;
    }
    case 'BADGE_UNLOCKED':
      if (!state.badges.includes(event.badgeId)) {
        next = { ...state, badges: appendUnique(state.badges, event.badgeId) };
      }
      break;
    case 'COLLECTIBLE_FOUND':
      if (!state.collectibles.includes(event.collectibleId)) {
        next = { ...state, collectibles: appendUnique(state.collectibles, event.collectibleId) };
      }
      break;
    case 'ROUTE_PROGRESS': {
      const progressPercent = Math.max(state.progressPercent, boundedNumber(event.percent, 0, 100));
      const distanceKm = event.distanceKm === undefined
        ? state.distanceKm
        : Math.max(state.distanceKm, boundedNumber(event.distanceKm, 0, Number.MAX_SAFE_INTEGER));
      const elapsedMinutes = event.elapsedMinutes === undefined
        ? state.elapsedMinutes
        : Math.max(state.elapsedMinutes, boundedNumber(event.elapsedMinutes, 0, Number.MAX_SAFE_INTEGER));
      if (progressPercent !== state.progressPercent || distanceKm !== state.distanceKm || elapsedMinutes !== state.elapsedMinutes) {
        next = { ...state, progressPercent, distanceKm, elapsedMinutes };
      }
      break;
    }
    case 'ADVENTURE_COMPLETED':
      if (!state.completed) {
        const checkpointStates = Object.fromEntries(
          Object.entries(state.checkpointStates).map(([checkpointId, checkpointState]) => [
            checkpointId,
            checkpointState === 'DISCOVERED' ? 'COMPLETED' : checkpointState,
          ]),
        ) as Record<string, CheckpointState>;
        next = { ...state, completed: true, activeObjectiveId: null, progressPercent: 100, checkpointStates };
      }
      break;
    default:
      // Runtime boundary: ignore malformed/forward-version events without corrupting state.
      return state;
  }
  return recordEvent(state, next, event);
}

export function reduceGameKitAction(state: GameKitState, action: GameKitAction): GameKitState {
  if (action.type === 'RESET_PLAYGROUND') return createInitialGameKitState(action.checkpointIds);
  return reduceGameEvent(state, action.event);
}
