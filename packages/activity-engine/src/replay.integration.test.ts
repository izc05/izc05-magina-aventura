import { describe, expect, it } from 'vitest';

import {
  syntheticWalkActions,
  syntheticWalkCreatedAt,
  syntheticWalkRouteLine,
  syntheticWalkSession,
} from './fixtures/synthetic-walk';
import { replayActivity } from './replay';

describe('synthetic GPS replay gate', () => {
  it('replays the same walk deterministically through pause, rejection, off-route, recovery and finish', () => {
    const first = replayActivity(
      syntheticWalkSession,
      syntheticWalkActions,
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );
    const second = replayActivity(
      syntheticWalkSession,
      syntheticWalkActions,
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );

    expect(second).toEqual(first);
    expect(first.session.state).toBe('FINISHED');
    expect(first.snapshot.state).toBe('FINISHED');
    expect(first.snapshot.lastProcessedSequence).toBe(11);
    expect(first.snapshot.validDistanceMeters).toBeGreaterThan(0);
    expect(first.snapshot.elevationGainMeters).toBeGreaterThan(0);
    expect(first.snapshot.offRouteState).toBe('on_route');
  });

  it('requires sustained off-route evidence and recovers after sustained in-route samples', () => {
    const throughOffRoute = syntheticWalkActions.slice(0, 11);
    const offRouteState = replayActivity(
      syntheticWalkSession,
      throughOffRoute,
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );
    expect(offRouteState.snapshot.offRouteState).toBe('off_route');

    const throughFirstRecovery = syntheticWalkActions.slice(0, 12);
    const recoveringState = replayActivity(
      syntheticWalkSession,
      throughFirstRecovery,
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );
    expect(recoveringState.snapshot.offRouteState).toBe('recovering');

    const full = replayActivity(
      syntheticWalkSession,
      syntheticWalkActions,
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );
    expect(full.snapshot.offRouteState).toBe('on_route');
  });

  it('does not let poor-accuracy or impossible-jump samples inflate distance', () => {
    const full = replayActivity(
      syntheticWalkSession,
      syntheticWalkActions,
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );
    const withoutRejectedSamples = replayActivity(
      syntheticWalkSession,
      syntheticWalkActions.filter(
        (action) =>
          action.type !== 'LOCATION' || action.sample.validForMetrics,
      ),
      syntheticWalkRouteLine,
      syntheticWalkCreatedAt,
    );

    expect(full.snapshot.validDistanceMeters).toBeCloseTo(
      withoutRejectedSamples.snapshot.validDistanceMeters,
      6,
    );
  });
});
