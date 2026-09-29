import { describe, expect, it } from 'vitest';
import {
  createInitialGameKitState,
  EXPLORER_LEVELS,
  getExplorerLevel,
  reduceGameEvent,
  XP_REWARDS,
} from './model';
import { MOCK_DISCOVERIES } from './mock-content';

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
  });

  it('tracks the event contract without requiring a GPS source', () => {
    let state = createInitialGameKitState(['one']);
    state = reduceGameEvent(state, { type: 'ADVENTURE_STARTED' });
    state = reduceGameEvent(state, { type: 'CHECKPOINT_NEARBY', checkpointId: 'one' });
    state = reduceGameEvent(state, { type: 'CHECKPOINT_REACHED', checkpointId: 'one' });
    expect(state.started).toBe(true);
    expect(state.checkpointStates.one).toBe('DISCOVERED');
    expect(state.eventHistory.map((event) => event.type)).toEqual([
      'ADVENTURE_STARTED', 'CHECKPOINT_NEARBY', 'CHECKPOINT_REACHED',
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

  it('adds XP safely and resolves the configured explorer levels', () => {
    expect(XP_REWARDS.checkpoint).toBe(50);
    expect(getExplorerLevel(0)).toEqual(EXPLORER_LEVELS[0]);
    expect(getExplorerLevel(200).name).toBe('Explorador II');
    expect(getExplorerLevel(500).name).toBe('Explorador III');
    expect(getExplorerLevel(900).name).toBe('Explorador IV');
    expect(getExplorerLevel(1400).name).toBe('Explorador V');
    const state = reduceGameEvent(createInitialGameKitState([]), {
      type: 'XP_GAINED', amount: 150.8, reason: 'test',
    });
    expect(state.xp).toBe(150);
  });

  it('unlocks badges and other collectibles only once', () => {
    let state = createInitialGameKitState([]);
    state = reduceGameEvent(state, { type: 'BADGE_UNLOCKED', badgeId: 'naturalist' });
    state = reduceGameEvent(state, { type: 'BADGE_UNLOCKED', badgeId: 'naturalist' });
    state = reduceGameEvent(state, { type: 'DISCOVERY_UNLOCKED', discoveryId: 'fern' });
    state = reduceGameEvent(state, { type: 'DISCOVERY_UNLOCKED', discoveryId: 'fern' });
    expect(state.badges).toEqual(['naturalist']);
    expect(state.discoveries).toEqual(['fern']);
  });

  it('bounds route progress and marks the adventure complete', () => {
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
