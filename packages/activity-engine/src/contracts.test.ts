import { describe, expect, it } from 'vitest';
import type { ActivitySession, LocationSample } from '@magina-aventura/contracts';

describe('activity contracts', () => {
  it('pins a session to a route geometry version', () => {
    const session: ActivitySession = {
      activityId: 'activity-test-1',
      adventureSlug: 'synthetic-adventure',
      adventureVersion: 1,
      routeId: 'route-test-1',
      routeSlug: 'synthetic-route',
      geometryVersion: 3,
      state: 'ACTIVE',
      startedAt: '2026-09-15T10:00:00.000Z',
      pausedAt: null,
      finishedAt: null,
      lastProcessedSequence: 0,
      syncState: 'local',
    };

    const sample: LocationSample = {
      sequence: 1,
      timestamp: '2026-09-15T10:00:05.000Z',
      latitude: 37,
      longitude: -3,
      accuracyMeters: 8,
      altitudeMeters: 900,
      speedMps: 1.2,
      headingDegrees: 90,
      validForMetrics: true,
      rejectionReason: null,
    };

    expect(session.geometryVersion).toBe(3);
    expect(sample.sequence).toBe(1);
  });
});
