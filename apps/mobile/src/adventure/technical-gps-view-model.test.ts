import { describe, expect, it } from 'vitest';

import type { ActivitySession } from '@magina-aventura/contracts';
import {
  createInitialEngineState,
  reduceActivity,
} from '@magina-aventura/activity-engine';

import { technicalGpsMetricsViewModel } from './technical-gps-view-model';

const startedAt = '2026-09-30T12:00:00.000Z';
const session: ActivitySession = {
  activityId: '00000000-0000-4000-8000-000000000001',
  adventureSlug: 'gps-technical-test',
  adventureVersion: 1,
  routeId: 'development-only-route',
  routeSlug: 'gps-technical-test',
  geometryVersion: 1,
  state: 'DRAFT',
  startedAt,
  pausedAt: null,
  finishedAt: null,
  lastProcessedSequence: 0,
  syncState: 'local',
};

describe('technicalGpsMetricsViewModel', () => {
  it('does not invent route metrics before a real GPS session exists', () => {
    expect(technicalGpsMetricsViewModel(null, Date.parse(startedAt))).toEqual({
      sessionState: null,
      distanceKm: null,
      elapsedSeconds: null,
      gpsSamples: null,
    });
  });

  it('projects distance, active time and samples from the Activity Engine state', () => {
    let activity = createInitialEngineState(session, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    activity = reduceActivity(activity, {
      type: 'LOCATION',
      sample: {
        sequence: 1,
        timestamp: '2026-09-30T12:00:05.000Z',
        latitude: 37,
        longitude: -3,
        accuracyMeters: 8,
        altitudeMeters: null,
        speedMps: null,
        headingDegrees: null,
        validForMetrics: true,
        rejectionReason: null,
      },
    }, []);
    activity = reduceActivity(activity, {
      type: 'LOCATION',
      sample: {
        sequence: 2,
        timestamp: '2026-09-30T12:00:10.000Z',
        latitude: 37.0001,
        longitude: -3,
        accuracyMeters: 8,
        altitudeMeters: null,
        speedMps: null,
        headingDegrees: null,
        validForMetrics: true,
        rejectionReason: null,
      },
    }, []);

    const viewModel = technicalGpsMetricsViewModel(
      activity,
      Date.parse('2026-09-30T12:00:15.000Z'),
    );

    expect(viewModel.sessionState).toBe('ACTIVE');
    expect(viewModel.distanceKm).toBeGreaterThan(0);
    expect(viewModel.elapsedSeconds).toBe(15);
    expect(viewModel.gpsSamples).toBe(2);
  });
});
