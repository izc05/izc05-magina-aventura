import { describe, expect, it } from 'vitest';

import { devAdventureEngineTestDefinition, devAdventureEngineTestMapPayload, devAdventureEngineTestRoute } from './dev-adventure-engine-test';
import { presentRouteExperience } from './route-experience-presenter';

describe('presentRouteExperience', () => {
  it('surfaces checkpoints, discoveries, safety, and integration-ready weather copy', () => {
    const presentation = presentRouteExperience(
      devAdventureEngineTestRoute,
      devAdventureEngineTestMapPayload,
      devAdventureEngineTestDefinition,
    );

    expect(presentation.checkpointCount).toBe(3);
    expect(presentation.discoveryCount).toBe(1);
    expect(presentation.safetyCount).toBe(1);
    expect(presentation.explorationLabel).toBe('3 checkpoints · 1 discovery');
    expect(presentation.weatherStatus).toBe('Meteorología preparada');
  });

  it('uses definition counts when a route has no map payload yet', () => {
    const presentation = presentRouteExperience(
      devAdventureEngineTestRoute,
      null,
      devAdventureEngineTestDefinition,
    );

    expect(presentation.checkpointCount).toBe(3);
    expect(presentation.discoveryCount).toBe(1);
    expect(presentation.targetNames).toEqual([
      'Discovery 1',
    ]);
  });
});
