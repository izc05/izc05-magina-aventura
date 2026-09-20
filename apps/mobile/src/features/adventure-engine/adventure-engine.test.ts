import { describe, expect, it } from 'vitest';

import { testAdventureRoute, testRouteMapPayload, TEST_DATA_LABEL } from './test-data';
import { levelForXp, progressionForXp } from './progression';

describe('offline adventure engine integration', () => {
  it('keeps development route content explicitly marked as test data', () => {
    expect(TEST_DATA_LABEL).toBe('TEST DATA');
    expect(testAdventureRoute.developmentFixture).toBe(true);
    expect(testRouteMapPayload.routeId).toBe(testAdventureRoute.id);
    expect(testRouteMapPayload.checkpoints.every((checkpoint) => checkpoint.id.startsWith('test-'))).toBe(true);
  });

  it('uses data-driven progression thresholds rather than UI constants', () => {
    expect(levelForXp(0).name).toBe('Caminante');
    expect(levelForXp(500).name).toBe('Senderista');
    expect(progressionForXp(320).progress).toBe(64);
  });
});
