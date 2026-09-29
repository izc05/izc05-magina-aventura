export const CHECKPOINT_STATES = [
  'LOCKED',
  'NEARBY',
  'AVAILABLE',
  'DISCOVERED',
  'COMPLETED',
] as const;

export type CheckpointState = (typeof CHECKPOINT_STATES)[number];

/** Stable, transport-agnostic messages the Adventure Engine may emit later. */
export type GameEvent =
  | { type: 'ADVENTURE_STARTED' }
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

/** Implement this at an adapter boundary; this package deliberately has no GPS dependency. */
export type GameEventListener = (event: GameEvent) => void;

export const XP_REWARDS = {
  checkpoint: 50,
  discovery: 100,
  secret: 200,
  challenge: 75,
  collectible: 25,
  completedRoute: 500,
} as const;

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
}

export function createInitialGameKitState(
  checkpointIds: readonly string[],
): GameKitState {
  return {
    started: false,
    completed: false,
    progressPercent: 0,
    distanceKm: 0,
    elapsedMinutes: 0,
    xp: 0,
    checkpointStates: Object.fromEntries(
      checkpointIds.map((id, index) => [id, index === 0 ? 'AVAILABLE' : 'LOCKED']),
    ),
    discoveries: [],
    challenges: [],
    badges: [],
    collectibles: [],
    eventHistory: [],
  };
}

export function getExplorerLevel(xp: number) {
  const safeXp = Math.max(0, xp);
  return [...EXPLORER_LEVELS].reverse().find((level) => safeXp >= level.xpRequired) ?? EXPLORER_LEVELS[0];
}

function appendUnique(items: string[], item: string) {
  return items.includes(item) ? items : [...items, item];
}

function boundedNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Number.isFinite(value) ? value : min));
}

export function reduceGameEvent(state: GameKitState, event: GameEvent): GameKitState {
  let next: GameKitState;
  switch (event.type) {
    case 'ADVENTURE_STARTED':
      next = { ...state, started: true };
      break;
    case 'CHECKPOINT_NEARBY':
      next = {
        ...state,
        checkpointStates: { ...state.checkpointStates, [event.checkpointId]: 'NEARBY' },
      };
      break;
    case 'CHECKPOINT_REACHED':
      next = {
        ...state,
        checkpointStates: { ...state.checkpointStates, [event.checkpointId]: 'DISCOVERED' },
      };
      break;
    case 'CHECKPOINT_STATE_SET':
      next = {
        ...state,
        checkpointStates: { ...state.checkpointStates, [event.checkpointId]: event.state },
      };
      break;
    case 'DISCOVERY_UNLOCKED':
      next = { ...state, discoveries: appendUnique(state.discoveries, event.discoveryId) };
      break;
    case 'CHALLENGE_UNLOCKED':
      next = { ...state, challenges: appendUnique(state.challenges, event.challengeId) };
      break;
    case 'XP_GAINED':
      next = { ...state, xp: state.xp + Math.max(0, Math.floor(event.amount)) };
      break;
    case 'BADGE_UNLOCKED':
      next = { ...state, badges: appendUnique(state.badges, event.badgeId) };
      break;
    case 'COLLECTIBLE_FOUND':
      next = { ...state, collectibles: appendUnique(state.collectibles, event.collectibleId) };
      break;
    case 'ROUTE_PROGRESS':
      next = {
        ...state,
        progressPercent: boundedNumber(event.percent, 0, 100),
        ...(event.distanceKm === undefined ? {} : { distanceKm: Math.max(0, event.distanceKm) }),
        ...(event.elapsedMinutes === undefined ? {} : { elapsedMinutes: Math.max(0, event.elapsedMinutes) }),
      };
      break;
    case 'ADVENTURE_COMPLETED':
      next = { ...state, completed: true, progressPercent: 100 };
      break;
  }
  return { ...next, eventHistory: [...state.eventHistory, event].slice(-20) };
}
