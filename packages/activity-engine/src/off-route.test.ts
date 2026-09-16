import { describe, expect, it } from 'vitest';

import { defaultActivityEngineConfig } from './config';
import { createInitialOffRouteEvidence, updateOffRouteState } from './off-route';

describe('updateOffRouteState', () => {
  it('requires sustained evidence before declaring off-route', () => {
    let evidence = createInitialOffRouteEvidence();

    evidence = updateOffRouteState(evidence, 60, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('uncertain');

    evidence = updateOffRouteState(evidence, 60, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('uncertain');

    evidence = updateOffRouteState(evidence, 60, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('off_route');
  });

  it('requires sustained in-corridor samples to recover', () => {
    let evidence = createInitialOffRouteEvidence();
    evidence = updateOffRouteState(evidence, 60, 8, defaultActivityEngineConfig);
    evidence = updateOffRouteState(evidence, 60, 8, defaultActivityEngineConfig);
    evidence = updateOffRouteState(evidence, 60, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('off_route');

    evidence = updateOffRouteState(evidence, 10, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('recovering');

    evidence = updateOffRouteState(evidence, 10, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('recovering');

    evidence = updateOffRouteState(evidence, 10, 8, defaultActivityEngineConfig);
    expect(evidence.state).toBe('on_route');
  });

  it('expands the corridor when GPS accuracy is poor enough to avoid a false alarm', () => {
    let evidence = createInitialOffRouteEvidence();

    evidence = updateOffRouteState(evidence, 40, 45, defaultActivityEngineConfig);

    expect(evidence.state).toBe('on_route');
    expect(evidence.outsideSamples).toBe(0);
  });
});
