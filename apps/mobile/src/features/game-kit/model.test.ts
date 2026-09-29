import { describe, expect, it } from 'vitest';
import {
  createInitialGameKitState,
  EXPLORER_LEVELS,
  getExplorerLevel,
  MAX_XP,
  MIN_XP,
  reduceGameEvent,
  reduceGameKitAction,
  XP_REWARDS,
  type GameEvent,
} from './model';
import { createMockFullAdventureSequence, MOCK_DISCOVERIES, MOCK_ROUTE } from './mock-content';

const checkpointIds = MOCK_ROUTE.checkpoints.map((checkpoint) => checkpoint.id);

describe('Game Kit event reducer', () => {
  it('provides mock cards for all requested discovery categories', () => {
    expect(new Set(MOCK_DISCOVERIES.map((discovery) => discovery.category))).toEqual(new Set([
      'Historia', 'Naturaleza', 'Fauna', 'Flora', 'Geología', 'Patrimonio', 'Secreto', 'Mirador',
    ]));
  });

  it('starts with the first checkpoint available and later checkpoints locked', () => {
    const state = createInitialGameKitState(['one', 'two']);
    expect(state.checkpointStates).toEqual({ one: 'AVAILABLE', two: 'LOCKED' });
    expect(state.started).toBe(false);
    expect(state.activeObjectiveId).toBeNull();
  });

  it('tracks start, objective, approach, and checkpoint events without GPS', () => {
    let state = createInitialGameKitState(['one']);
    state = reduceGameEvent(state, { type: 'ADVENTURE_STARTED' });
    state = reduceGameEvent(state, { type: 'OBJECTIVE_ACTIVATED', objectiveId: 'demo-objective' });
    state = reduceGameEvent(state, { type: 'CHECKPOINT_NEARBY', checkpointId: 'one' });
    state = reduceGameEvent(state, { type: 'CHECKPOINT_REACHED', checkpointId: 'one' });
    expect(state.started).toBe(true);
    expect(state.activeObjectiveId).toBe('demo-objective');
    expect(state.checkpointStates.one).toBe('DISCOVERED');
    expect(state.eventHistory.map((event) => event.type)).toEqual([
      'ADVENTURE_STARTED', 'OBJECTIVE_ACTIVATED', 'CHECKPOINT_NEARBY', 'CHECKPOINT_REACHED',
    ]);
  });

  it('allows the playground to set every checkpoint state manually', () => {
    let state = createInitialGameKitState(['one']);
    for (const checkpointState of ['LOCKED', 'NEARBY', 'AVAILABLE', 'DISCOVERED', 'COMPLETED'] as const) {
      state = reduceGameEvent(state, {
        type: 'CHECKPOINT_STATE_SET', checkpointId: 'one', state: checkpointState,
      });
      expect(state.checkpointStates.one).toBe(checkpointState);
    }
  });

  it('deduplicates retried events by stable event ID', () => {
    const initial = createInitialGameKitState([]);
    const xpEvent: GameEvent = {
      type: 'XP_GAINED', amount: 50, reason: 'checkpoint', eventId: 'checkpoint-1-xp',
    };
    const afterFirst = reduceGameEvent(initial, xpEvent);
    const afterRetry = reduceGameEvent(afterFirst, xpEvent);
    expect(afterFirst.xp).toBe(50);
    expect(afterRetry).toBe(afterFirst);
    expect(afterRetry.eventHistory).toHaveLength(1);
  });

  it('clamps XP to minimum/maximum and resolves each explorer-level transition', () => {
    expect(XP_REWARDS.checkpoint).toBe(50);
    expect(MIN_XP).toBe(0);
    expect(MAX_XP).toBe(9_999);
    expect(getExplorerLevel(-50)).toEqual(EXPLORER_LEVELS[0]);
    expect(getExplorerLevel(0).name).toBe('Explorador I');
    expect(getExplorerLevel(199).name).toBe('Explorador I');
    expect(getExplorerLevel(200).name).toBe('Explorador II');
    expect(getExplorerLevel(500).name).toBe('Explorador III');
    expect(getExplorerLevel(900).name).toBe('Explorador IV');
    expect(getExplorerLevel(1400).name).toBe('Explorador V');

    let state = reduceGameEvent(createInitialGameKitState([]), {
      type: 'XP_GAINED', amount: -20, reason: 'negative test',
    });
    expect(state.xp).toBe(MIN_XP);
    state = reduceGameEvent(state, { type: 'XP_GAINED', amount: 150.8, reason: 'fractional test' });
    expect(state.xp).toBe(150);
    state = reduceGameEvent(state, { type: 'XP_GAINED', amount: Number.POSITIVE_INFINITY, reason: 'invalid test' });
    expect(state.xp).toBe(150);
    state = reduceGameEvent(state, { type: 'XP_GAINED', amount: 1_000_000, reason: 'cap test' });
    expect(state.xp).toBe(MAX_XP);
    expect(getExplorerLevel(state.xp).name).toBe('Explorador V');
  });

  it('does not duplicate discoveries, badges, challenges, or collectibles', () => {
    let state = createInitialGameKitState([]);
    state = reduceGameEvent(state, { type: 'BADGE_UNLOCKED', badgeId: 'naturalist' });
    const withBadge = state;
    expect(reduceGameEvent(state, { type: 'BADGE_UNLOCKED', badgeId: 'naturalist' })).toBe(withBadge);
    state = reduceGameEvent(state, { type: 'DISCOVERY_UNLOCKED', discoveryId: 'fern' });
    const withDiscovery = state;
    expect(reduceGameEvent(state, { type: 'DISCOVERY_UNLOCKED', discoveryId: 'fern' })).toBe(withDiscovery);
    state = reduceGameEvent(state, { type: 'CHALLENGE_UNLOCKED', challengeId: 'trail' });
    state = reduceGameEvent(state, { type: 'CHALLENGE_UNLOCKED', challengeId: 'trail' });
    state = reduceGameEvent(state, { type: 'COLLECTIBLE_FOUND', collectibleId: 'leaf' });
    state = reduceGameEvent(state, { type: 'COLLECTIBLE_FOUND', collectibleId: 'leaf' });
    expect(state.badges).toEqual(['naturalist']);
    expect(state.discoveries).toEqual(['fern']);
    expect(state.challenges).toEqual(['trail']);
    expect(state.collectibles).toEqual(['leaf']);
  });

  it('keeps checkpoint and route state monotonic when duplicate or late events arrive', () => {
    let state = createInitialGameKitState(['one']);
    state = reduceGameEvent(state, { type: 'CHECKPOINT_REACHED', checkpointId: 'one' });
    const reached = state;
    expect(reduceGameEvent(reached, { type: 'CHECKPOINT_REACHED', checkpointId: 'one' })).toBe(reached);
    expect(reduceGameEvent(reached, { type: 'CHECKPOINT_NEARBY', checkpointId: 'one' })).toBe(reached);

    state = reduceGameEvent(state, { type: 'ROUTE_PROGRESS', percent: 80, distanceKm: 4.2, elapsedMinutes: 82 });
    state = reduceGameEvent(state, { type: 'ROUTE_PROGRESS', percent: 25, distanceKm: 1.1, elapsedMinutes: 20 });
    expect(state.progressPercent).toBe(80);
    expect(state.distanceKm).toBe(4.2);
    expect(state.elapsedMinutes).toBe(82);
    state = reduceGameEvent(state, { type: 'ADVENTURE_COMPLETED' });
    const completed = state;
    expect(reduceGameEvent(completed, { type: 'ROUTE_PROGRESS', percent: 10 })).toBe(completed);
    expect(completed.completed).toBe(true);
    expect(completed.progressPercent).toBe(100);
  });

  it('ignores an unknown runtime event without corrupting state', () => {
    const state = createInitialGameKitState(['one']);
    const unknown = { type: 'FUTURE_UNSUPPORTED_EVENT', value: true } as unknown as GameEvent;
    expect(reduceGameEvent(state, unknown)).toBe(state);
  });

  it('resets all progress and the event idempotency ledger', () => {
    let state = createInitialGameKitState(checkpointIds);
    for (const event of createMockFullAdventureSequence()) state = reduceGameEvent(state, event);
    expect(state.xp).toBe(650);
    expect(state.completed).toBe(true);
    expect(state.processedEventIds.length).toBeGreaterThan(0);

    const reset = reduceGameKitAction(state, { type: 'RESET_PLAYGROUND', checkpointIds });
    expect(reset).toEqual(createInitialGameKitState(checkpointIds));
    expect(reset.processedEventIds).toEqual([]);
    expect(reset.eventHistory).toEqual([]);
  });

  it('replays the full fictional adventure deterministically and ignores a duplicate replay', () => {
    const initial = createInitialGameKitState(checkpointIds);
    const sequence = createMockFullAdventureSequence();
    let state = initial;
    for (const event of sequence) state = reduceGameEvent(state, event);
    expect(state.started).toBe(true);
    expect(state.completed).toBe(true);
    expect(state.activeObjectiveId).toBeNull();
    expect(state.progressPercent).toBe(100);
    expect(state.distanceKm).toBe(4.2);
    expect(state.elapsedMinutes).toBe(82);
    expect(state.checkpointStates.gate).toBe('COMPLETED');
    expect(state.discoveries).toEqual(['fern']);
    expect(state.badges).toEqual(['first-discovery', 'magina-explorer']);
    expect(state.xp).toBe(650);
    const completed = state;
    for (const event of sequence) state = reduceGameEvent(state, event);
    expect(state).toBe(completed);
  });

  it('bounds progress and records completion', () => {
    let state = createInitialGameKitState([]);
    state = reduceGameEvent(state, {
      type: 'ROUTE_PROGRESS', percent: 115, distanceKm: 3.2, elapsedMinutes: 48,
    });
    expect(state.progressPercent).toBe(100);
    expect(state.distanceKm).toBe(3.2);
    expect(state.elapsedMinutes).toBe(48);
    state = reduceGameEvent(state, { type: 'ADVENTURE_COMPLETED' });
    expect(state.completed).toBe(true);
    expect(state.progressPercent).toBe(100);
  });
});
