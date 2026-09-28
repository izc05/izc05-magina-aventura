import { describe, expect, it } from 'vitest';
import {
  type AdventureDefinition,
  type AdventureTargetDefinition,
  validateAdventureDefinition,
} from '@magina-aventura/contracts';

import { explorationConfigFromAdventureDefinition } from './adventure-definition';

const checkpoint: AdventureTargetDefinition = {
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'checkpoint',
  sequence: 1,
  required: true,
  prerequisiteTargetKeys: [],
  latitude: 37,
  longitude: -3,
  triggerRadiusMeters: 30,
};

function definition(
  overrides: Partial<AdventureDefinition> = {},
): AdventureDefinition {
  return {
    slug: 'synthetic-adventure',
    version: 3,
    routeId: 'route-synthetic-1',
    geometryVersion: 7,
    gpx: { uri: 'test://route.gpx', sha256: 'test-gpx' },
    offlineMap: {
      manifestUri: 'test://manifest.json',
      styleTemplateUri: 'test://style.json',
      contentHash: 'test-map',
    },
    explorationPolicy: {
      maxAccuracyMeters: 20,
      requiredConsecutiveSamples: 2,
      maxEvidenceGapSeconds: 15,
    },
    checkpoints: [checkpoint],
    discoveries: [],
    missions: [],
    assets: [],
    scenes3d: [],
    progression: { xpRulesetVersion: 1, rewards: [] },
    ...overrides,
  };
}

describe('AdventureDefinition validation', () => {
  it('produces isolated exploration configuration from validated content', () => {
    const config = explorationConfigFromAdventureDefinition(definition());

    expect(config.targets).toEqual([checkpoint]);
    expect(config.policy).toEqual({
      maxAccuracyMeters: 20,
      requiredConsecutiveSamples: 2,
      maxEvidenceGapSeconds: 15,
    });
  });

  it('rejects invalid spatial values, UUIDs and versions', () => {
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{ ...checkpoint, latitude: 90.1 }],
    }))).toThrow(/latitude/);
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{ ...checkpoint, longitude: -180.1 }],
    }))).toThrow(/longitude/);
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{ ...checkpoint, triggerRadiusMeters: 0 }],
    }))).toThrow(/triggerRadiusMeters/);
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{ ...checkpoint, id: 'not-a-uuid' }],
    }))).toThrow(/UUID/);
    expect(() => validateAdventureDefinition(definition({ version: 0 }))).toThrow(/version/);
    expect(() => validateAdventureDefinition(definition({ geometryVersion: 0 }))).toThrow(/geometryVersion/);
    expect(() => validateAdventureDefinition(definition({
      explorationPolicy: {
        maxAccuracyMeters: 20,
        requiredConsecutiveSamples: 21,
        maxEvidenceGapSeconds: 15,
      },
    }))).toThrow(/requiredConsecutiveSamples/);
  });

  it('rejects duplicated target identities and keys', () => {
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [checkpoint, { ...checkpoint }],
    }))).toThrow(/Duplicate exploration target key/);
    expect(() => validateAdventureDefinition(definition({
      discoveries: [{ ...checkpoint, kind: 'discovery' }],
    }))).toThrow(/Duplicate exploration target UUID/);
  });

  it('rejects unknown and self prerequisites', () => {
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{ ...checkpoint, prerequisiteTargetKeys: ['checkpoint:missing'] }],
    }))).toThrow(/Unknown exploration prerequisite/);
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{
        ...checkpoint,
        prerequisiteTargetKeys: [`checkpoint:${checkpoint.id}`],
      }],
    }))).toThrow(/cannot depend on itself/);
  });

  it('rejects two-target and longer prerequisite cycles', () => {
    const second: AdventureTargetDefinition = {
      ...checkpoint,
      id: '00000000-0000-4000-8000-000000000002',
      sequence: 2,
      prerequisiteTargetKeys: [`checkpoint:${checkpoint.id}`],
    };
    const third: AdventureTargetDefinition = {
      ...checkpoint,
      id: '00000000-0000-4000-8000-000000000003',
      sequence: 3,
      prerequisiteTargetKeys: [`checkpoint:${second.id}`],
    };

    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{
        ...checkpoint,
        prerequisiteTargetKeys: [`checkpoint:${second.id}`],
      }, second],
    }))).toThrow(/cycle/);
    expect(() => validateAdventureDefinition(definition({
      checkpoints: [{
        ...checkpoint,
        prerequisiteTargetKeys: [`checkpoint:${third.id}`],
      }, second, third],
    }))).toThrow(/cycle/);
  });
});
