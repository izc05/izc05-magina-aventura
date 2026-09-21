import { describe, expect, it } from 'vitest';

import { devAdventureEngineTestDefinition, devAdventureEngineTestMapPayload, DEV_TEST_TARGET_KEYS } from '../routes/dev-adventure-engine-test';
import { presentExploration } from './exploration-presenter';

describe('exploration presentation', () => {
  it('shows the first checkpoint before any evidence', () => {
    const presentation = presentExploration(devAdventureEngineTestDefinition, null, devAdventureEngineTestMapPayload);
    expect(presentation.nextKind).toBe('checkpoint');
    expect(presentation.nextTitle).toBe('TEST CHECKPOINT 1');
    expect(presentation.progressLabel).toBe('0/4 objetivos');
  });

  it('shows discovery after its checkpoint prerequisite', () => {
    const state = {
      exploration: {
        progressByTargetKey: {},
        unlockedTargetKeys: [DEV_TEST_TARGET_KEYS.checkpoint1, DEV_TEST_TARGET_KEYS.checkpoint2],
        lastEvaluatedSequence: 2,
      },
      explorationObservations: [],
    } as never;
    const presentation = presentExploration(devAdventureEngineTestDefinition, state, devAdventureEngineTestMapPayload);
    expect(presentation.nextKind).toBe('discovery');
    expect(presentation.nextTitle).toBe('Discovery 1');
    expect(presentation.progressLabel).toBe('2/4 objetivos');
  });
});
