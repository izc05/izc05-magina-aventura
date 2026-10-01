import { describe, expect, it } from 'vitest';

import type { AdventureTargetDefinition, LocationSample } from '@magina-aventura/contracts';
import { createExplorationState } from '@magina-aventura/activity-engine';

import { checkpointViewModel } from './checkpoint-view-model';

const target: AdventureTargetDefinition = {
  id: '00000000-0000-4000-8000-000000000001',
  kind: 'checkpoint',
  sequence: 0,
  required: true,
  prerequisiteTargetKeys: [],
  latitude: 37,
  longitude: -3,
  triggerRadiusMeters: 30,
};

const sample: LocationSample = {
  sequence: 4,
  timestamp: '2026-09-30T14:00:00.000Z',
  latitude: 37,
  longitude: -3,
  accuracyMeters: 8,
  altitudeMeters: null,
  speedMps: null,
  headingDegrees: null,
  validForMetrics: true,
  rejectionReason: null,
};

describe('checkpointViewModel', () => {
  it('does not project simulated or unverified targets into the route UI', () => {
    const state = createExplorationState([`checkpoint:${target.id}`]);

    expect(checkpointViewModel(target, state, sample, 'development-simulation')).toBeNull();
    expect(checkpointViewModel(target, state, sample, 'unverified')).toBeNull();
  });

  it('is nearby and has no invented distance before a valid sample exists', () => {
    expect(checkpointViewModel(target, createExplorationState(), null, 'verified')).toEqual({
      key: `checkpoint:${target.id}`,
      status: 'nearby',
      distanceMeters: null,
      required: true,
      sequence: 0,
    });
  });

  it('derives verifying from existing exploration evidence', () => {
    const state = createExplorationState();
    state.progressByTargetKey[`checkpoint:${target.id}`] = {
      consecutiveSamples: 1,
      lastEvidenceAt: sample.timestamp,
    };

    expect(checkpointViewModel(target, state, sample, 'verified')).toMatchObject({
      status: 'verifying',
      distanceMeters: 0,
    });
  });

  it('derives discovered from the engine unlock and keeps real distance', () => {
    const state = createExplorationState([`checkpoint:${target.id}`]);

    expect(checkpointViewModel(target, state, {
      ...sample,
      latitude: 37.0001,
    }, 'verified')).toMatchObject({
      status: 'discovered',
      required: true,
      sequence: 0,
    });
    expect(checkpointViewModel(target, state, {
      ...sample,
      latitude: 37.0001,
    }, 'verified')?.distanceMeters).toBeGreaterThan(0);
  });

  it('gives discovered precedence over stale evidence', () => {
    const key = `checkpoint:${target.id}`;
    const state = createExplorationState([key]);
    state.progressByTargetKey[key] = {
      consecutiveSamples: 1,
      lastEvidenceAt: sample.timestamp,
    };

    expect(checkpointViewModel(target, state, sample, 'verified')?.status).toBe('discovered');
  });
});
