export type AdventureTargetKind = 'checkpoint' | 'discovery';

export interface AdventureTargetDefinition {
  /** Globally unique UUID; persisted as `${kind}:${id}` by the exploration engine. */
  id: string;
  kind: AdventureTargetKind;
  /** Explicit content order; never inferred from array order or geography. */
  sequence: number;
  required: boolean;
  prerequisiteTargetKeys: string[];
  latitude: number;
  longitude: number;
  triggerRadiusMeters: number;
}

export interface AdventureDefinition {
  /** Stable editorial identity, independent from route slug. */
  slug: string;
  /** Immutable editorial version pinned to an activity when it starts. */
  version: number;
  /** Explicit canonical route identity; never inferred from adventure slug. */
  routeId: string;
  /** Explicit route geometry version pinned to an activity when it starts. */
  geometryVersion: number;
  gpx: {
    uri: string;
    sha256: string;
  };
  offlineMap: {
    manifestUri: string;
    styleTemplateUri: string;
    contentHash: string;
  };
  explorationPolicy: {
    maxAccuracyMeters: number;
    requiredConsecutiveSamples: number;
    maxEvidenceGapSeconds: number;
  };
  checkpoints: AdventureTargetDefinition[];
  discoveries: AdventureTargetDefinition[];
  missions: Array<{
    id: string;
    requiredTargetKeys: string[];
  }>;
  assets: Array<{
    id: string;
    uri: string;
    sha256: string;
  }>;
  scenes3d: Array<{
    id: string;
    assetIds: string[];
    sceneUri: string;
  }>;
  progression: {
    xpRulesetVersion: number;
    rewards: Array<{
      id: string;
      kind: string;
      amount: number;
    }>;
  };
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value: string): boolean {
  return UUID_PATTERN.test(value);
}

function targetKey(target: Pick<AdventureTargetDefinition, 'kind' | 'id'>): string {
  return `${target.kind}:${target.id}`;
}

function assertNonEmptyString(value: unknown, field: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} must be a non-empty string`);
  }
}

function assertPositiveInteger(value: unknown, field: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 1) {
    throw new Error(`${field} must be a positive integer`);
  }
}

function assertNonNegativeInteger(value: unknown, field: string): asserts value is number {
  if (!Number.isInteger(value) || (value as number) < 0) {
    throw new Error(`${field} must be a non-negative integer`);
  }
}

function assertFiniteInRange(
  value: unknown,
  field: string,
  min: number,
  max: number,
): asserts value is number {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${field} must be finite and between ${min} and ${max}`);
  }
}

function validateTarget(target: AdventureTargetDefinition, field: string): AdventureTargetDefinition {
  assertNonEmptyString(target.id, `${field}.id`);
  if (!isUuid(target.id)) {
    throw new Error(`${field}.id must be a UUID`);
  }
  if (target.kind !== 'checkpoint' && target.kind !== 'discovery') {
    throw new Error(`${field}.kind must be checkpoint or discovery`);
  }
  assertNonNegativeInteger(target.sequence, `${field}.sequence`);
  if (typeof target.required !== 'boolean') {
    throw new Error(`${field}.required must be boolean`);
  }
  if (!Array.isArray(target.prerequisiteTargetKeys)) {
    throw new Error(`${field}.prerequisiteTargetKeys must be an array`);
  }
  for (const [index, prerequisite] of target.prerequisiteTargetKeys.entries()) {
    assertNonEmptyString(prerequisite, `${field}.prerequisiteTargetKeys[${index}]`);
  }
  assertFiniteInRange(target.latitude, `${field}.latitude`, -90, 90);
  assertFiniteInRange(target.longitude, `${field}.longitude`, -180, 180);
  if (typeof target.triggerRadiusMeters !== 'number' || !Number.isFinite(target.triggerRadiusMeters) || target.triggerRadiusMeters <= 0) {
    throw new Error(`${field}.triggerRadiusMeters must be a positive finite number`);
  }

  return {
    ...target,
    prerequisiteTargetKeys: [...target.prerequisiteTargetKeys],
  };
}

function assertAcyclicPrerequisites(targets: readonly AdventureTargetDefinition[]): void {
  const byKey = new Map(targets.map((target) => [targetKey(target), target]));
  const visiting = new Set<string>();
  const visited = new Set<string>();

  function visit(key: string): void {
    if (visited.has(key)) return;
    if (visiting.has(key)) {
      throw new Error(`Exploration prerequisite cycle detected at ${key}`);
    }

    visiting.add(key);
    const target = byKey.get(key);
    if (!target) throw new Error(`Unknown exploration prerequisite: ${key}`);
    for (const prerequisite of target.prerequisiteTargetKeys) {
      visit(prerequisite);
    }
    visiting.delete(key);
    visited.add(key);
  }

  for (const key of byKey.keys()) visit(key);
}

/**
 * Validates editorial adventure content before it becomes runtime configuration.
 * It deliberately validates identity and spatial data without manufacturing any
 * route, target, GPX or coordinate fallback.
 */
export function validateAdventureDefinition(
  definition: AdventureDefinition,
): AdventureDefinition {
  assertNonEmptyString(definition.slug, 'slug');
  assertPositiveInteger(definition.version, 'version');
  assertNonEmptyString(definition.routeId, 'routeId');
  assertPositiveInteger(definition.geometryVersion, 'geometryVersion');

  if (!Array.isArray(definition.checkpoints) || !Array.isArray(definition.discoveries)) {
    throw new Error('checkpoints and discoveries must be arrays');
  }

  const checkpoints = definition.checkpoints.map((target, index) =>
    validateTarget(target, `checkpoints[${index}]`),
  );
  const discoveries = definition.discoveries.map((target, index) =>
    validateTarget(target, `discoveries[${index}]`),
  );
  const targets = [...checkpoints, ...discoveries];
  const ids = new Set<string>();
  const keys = new Set<string>();

  for (const target of targets) {
    const key = targetKey(target);
    if (keys.has(key)) {
      throw new Error(`Duplicate exploration target key: ${key}`);
    }
    if (ids.has(target.id)) {
      throw new Error(`Duplicate exploration target UUID: ${target.id}`);
    }
    ids.add(target.id);
    keys.add(key);
  }

  for (const target of targets) {
    const key = targetKey(target);
    for (const prerequisite of target.prerequisiteTargetKeys) {
      if (prerequisite === key) {
        throw new Error(`Target cannot depend on itself: ${key}`);
      }
      if (!keys.has(prerequisite)) {
        throw new Error(`Unknown exploration prerequisite: ${prerequisite}`);
      }
    }
  }
  assertAcyclicPrerequisites(targets);

  if (!Array.isArray(definition.missions)) {
    throw new Error('missions must be an array');
  }
  const missionIds = new Set<string>();
  const missions = definition.missions.map((mission, index) => {
    assertNonEmptyString(mission.id, `missions[${index}].id`);
    if (missionIds.has(mission.id)) {
      throw new Error(`Duplicate mission id: ${mission.id}`);
    }
    missionIds.add(mission.id);
    if (!Array.isArray(mission.requiredTargetKeys)) {
      throw new Error(`missions[${index}].requiredTargetKeys must be an array`);
    }
    for (const prerequisite of mission.requiredTargetKeys) {
      assertNonEmptyString(prerequisite, `missions[${index}].requiredTargetKeys`);
      if (!keys.has(prerequisite)) {
        throw new Error(`Unknown mission target key: ${prerequisite}`);
      }
    }
    return { ...mission, requiredTargetKeys: [...mission.requiredTargetKeys] };
  });

  const policy = definition.explorationPolicy;
  assertFiniteInRange(policy.maxAccuracyMeters, 'explorationPolicy.maxAccuracyMeters', 1, 100);
  assertFiniteInRange(
    policy.requiredConsecutiveSamples,
    'explorationPolicy.requiredConsecutiveSamples',
    1,
    20,
  );
  if (!Number.isInteger(policy.requiredConsecutiveSamples)) {
    throw new Error('explorationPolicy.requiredConsecutiveSamples must be an integer');
  }
  assertFiniteInRange(
    policy.maxEvidenceGapSeconds,
    'explorationPolicy.maxEvidenceGapSeconds',
    1,
    300,
  );

  return {
    ...definition,
    checkpoints,
    discoveries,
    missions,
    explorationPolicy: { ...policy },
  };
}
