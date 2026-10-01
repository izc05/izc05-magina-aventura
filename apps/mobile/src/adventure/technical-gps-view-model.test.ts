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
  recordingSource: 'device-gps',
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
      deviceLocationSample: null,
      devicePosition: null,
      deviceLocationState: 'waiting',
    });
  });

  it('waits clearly for a physical fix instead of reusing a persisted snapshot sample', () => {
    let activity = createInitialEngineState(session, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    activity.snapshot.lastValidSample = {
      sequence: 99,
      timestamp: startedAt,
      latitude: 37.9,
      longitude: -3.9,
      accuracyMeters: 8,
      altitudeMeters: null,
      speedMps: null,
      headingDegrees: null,
      validForMetrics: true,
      rejectionReason: null,
    };

    const viewModel = technicalGpsMetricsViewModel(activity, Date.parse(startedAt));

    expect(viewModel.devicePosition).toBeNull();
    expect(viewModel.deviceLocationSample).toBeNull();
    expect(viewModel.deviceLocationState).toBe('waiting');
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
    const latestEngineSample = activity.acceptedSample;

    expect(viewModel.sessionState).toBe('ACTIVE');
    expect(viewModel.distanceKm).toBeGreaterThan(0);
    expect(viewModel.elapsedSeconds).toBe(15);
    expect(viewModel.gpsSamples).toBe(2);
    expect(latestEngineSample).not.toBeNull();
    expect(viewModel.deviceLocationSample).toBe(latestEngineSample);
    expect(viewModel.devicePosition).toEqual([
      latestEngineSample!.longitude,
      latestEngineSample!.latitude,
    ]);
    expect(viewModel.deviceLocationState).toBe('available');
  });

  it('does not reuse snapshot coordinates when deriving the device pin', () => {
    let activity = createInitialEngineState(session, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    const sample = {
      sequence: 1,
      timestamp: '2026-09-30T12:00:05.000Z',
      latitude: 37.01,
      longitude: -3.01,
      accuracyMeters: 8,
      altitudeMeters: null,
      speedMps: null,
      headingDegrees: null,
      validForMetrics: true,
      rejectionReason: null,
    } as const;
    activity = reduceActivity(activity, { type: 'LOCATION', sample }, []);
    activity = {
      ...activity,
      snapshot: {
        ...activity.snapshot,
        lastValidSample: {
          ...sample,
          latitude: 37.99,
          longitude: -3.99,
        },
      },
    };

    const viewModel = technicalGpsMetricsViewModel(activity, Date.parse(sample.timestamp));

    expect(activity.acceptedSample).toBe(sample);
    expect(viewModel.deviceLocationSample).toBe(sample);
    expect(viewModel.devicePosition).toEqual([-3.01, 37.01]);
  });

  it('can show the latest physical sample while labelling rejected-quality data as degraded', () => {
    let activity = createInitialEngineState(session, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    const sample = {
      sequence: 1,
      timestamp: '2026-09-30T12:00:05.000Z',
      latitude: 37.02,
      longitude: -3.02,
      accuracyMeters: 80,
      altitudeMeters: null,
      speedMps: null,
      headingDegrees: null,
      validForMetrics: false,
      rejectionReason: 'poor_accuracy' as const,
    };
    activity = reduceActivity(activity, { type: 'LOCATION', sample }, []);

    const viewModel = technicalGpsMetricsViewModel(activity, Date.parse(sample.timestamp));

    expect(viewModel.deviceLocationSample).toBe(activity.rejectedSample);
    expect(viewModel.devicePosition).toEqual([-3.02, 37.02]);
    expect(viewModel.deviceLocationState).toBe('degraded');
  });

  it('returns to waiting and removes a pin after the latest fix becomes stale', () => {
    let activity = createInitialEngineState(session, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    activity = reduceActivity(activity, {
      type: 'LOCATION',
      sample: {
        sequence: 1,
        timestamp: '2026-09-30T12:00:05.000Z',
        latitude: 37.04,
        longitude: -3.04,
        accuracyMeters: 8,
        altitudeMeters: null,
        speedMps: null,
        headingDegrees: null,
        validForMetrics: true,
        rejectionReason: null,
      },
    }, []);

    expect(technicalGpsMetricsViewModel(activity, Date.parse('2026-09-30T12:00:19.999Z')))
      .toMatchObject({ devicePosition: [-3.04, 37.04], deviceLocationState: 'available' });
    expect(technicalGpsMetricsViewModel(activity, Date.parse('2026-09-30T12:00:20.000Z')))
      .toMatchObject({ deviceLocationSample: null, devicePosition: null, deviceLocationState: 'waiting' });
  });

  it('never treats mock-source samples as the physical device position', () => {
    const mockGpsSession = { ...session, recordingSource: 'mock' as const };
    let activity = createInitialEngineState(mockGpsSession, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    activity = reduceActivity(activity, {
      type: 'LOCATION',
      sample: {
        sequence: 1,
        timestamp: '2026-09-30T12:00:05.000Z',
        latitude: 37.05,
        longitude: -3.05,
        accuracyMeters: 8,
        altitudeMeters: null,
        speedMps: null,
        headingDegrees: null,
        validForMetrics: true,
        rejectionReason: null,
      },
    }, []);

    expect(technicalGpsMetricsViewModel(activity, Date.parse('2026-09-30T12:00:10.000Z')))
      .toMatchObject({ deviceLocationSample: null, devicePosition: null, deviceLocationState: 'unavailable' });
  });

  it('hides the pin and reports stopped updates while paused and after finalization', () => {
    let activity = createInitialEngineState(session, startedAt);
    activity = reduceActivity(activity, { type: 'START', at: startedAt }, []);
    activity = reduceActivity(activity, {
      type: 'LOCATION',
      sample: {
        sequence: 1,
        timestamp: '2026-09-30T12:00:05.000Z',
        latitude: 37.03,
        longitude: -3.03,
        accuracyMeters: 8,
        altitudeMeters: null,
        speedMps: null,
        headingDegrees: null,
        validForMetrics: true,
        rejectionReason: null,
      },
    }, []);

    const paused = reduceActivity(activity, {
      type: 'PAUSE',
      at: '2026-09-30T12:01:00.000Z',
    }, []);
    expect(technicalGpsMetricsViewModel(paused, Date.parse('2026-09-30T12:01:10.000Z')))
      .toMatchObject({ deviceLocationSample: null, devicePosition: null, deviceLocationState: 'paused' });

    const finished = reduceActivity(paused, {
      type: 'FINISH',
      at: '2026-09-30T12:02:00.000Z',
    }, []);
    expect(technicalGpsMetricsViewModel(finished, Date.parse('2026-09-30T12:02:10.000Z')))
      .toMatchObject({ deviceLocationSample: null, devicePosition: null, deviceLocationState: 'finished' });
  });
});
