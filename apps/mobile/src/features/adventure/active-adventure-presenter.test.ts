import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import { describe, expect, it } from 'vitest';

import { developmentRoutes } from '../routes/fixtures';
import { presentActiveAdventure } from './active-adventure-presenter';

function activeState(routeId: string, routeSlug: string): ActivityEngineState {
  return {
    session: {
      activityId: 'activity-real',
      routeId,
      routeSlug,
      geometryVersion: 1,
      state: 'ACTIVE',
      startedAt: '2026-09-16T10:00:00.000Z',
      pausedAt: null,
      finishedAt: null,
      lastProcessedSequence: 8,
      syncState: 'local',
    },
    snapshot: {
      activityId: 'activity-real',
      state: 'ACTIVE',
      lastProcessedSequence: 8,
      validDistanceMeters: 1234,
      totalElapsedSeconds: 65,
      movingElapsedSeconds: 61,
      currentSpeedMps: 1.4,
      paceSecondsPerKm: 714,
      elevationGainMeters: 87,
      elevationLossMeters: 12,
      routeProgress: 0.4,
      maxRouteProgress: 0.42,
      distanceToRouteMeters: 9,
      offRouteState: 'on_route',
      lastValidSample: {
        sequence: 8,
        timestamp: '2026-09-16T10:01:05.000Z',
        latitude: 37.82,
        longitude: -3.41,
        accuracyMeters: 6,
        altitudeMeters: 918,
        speedMps: 1.4,
        headingDegrees: 85,
        validForMetrics: true,
        rejectionReason: null,
      },
      algorithmVersion: 1,
      createdAt: '2026-09-16T10:01:05.000Z',
    },
    offRouteEvidence: { state: 'on_route', outsideSamples: 0, insideSamples: 0 },
    shouldPersistSnapshot: false,
    acceptedSamplesSinceSnapshot: 2,
    lastSnapshotAt: '2026-09-16T10:01:00.000Z',
    acceptedSample: null,
    rejectedSample: null,
  };
}

describe('active adventure presentation', () => {
  it('keeps an honest fallback when no live activity exists', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    expect(presentActiveAdventure(route)).toEqual({
      routeTitle: 'El Peralejo',
      place: 'Cambil',
      modeLabel: 'GPS PREPARADO · SIN ACTIVIDAD',
      progress: '0 %',
      distance: '0,00 km',
      elapsed: '00:00',
      elevation: '+0 m',
      objectiveTitle: 'Inicia la aventura',
      objectiveMeta: 'El track comenzará al activar el GPS',
      rewardPreview: 'Recompensas pendientes de validación',
    });
  });

  it('formats real activity metrics from the GPS engine', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    const presentation = presentActiveAdventure(route, activeState(route.id, route.slug));

    expect(presentation.modeLabel).toBe('GPS ACTIVO · GUARDADO OFFLINE');
    expect(presentation.progress).toBe('42 %');
    expect(presentation.distance).toBe('1,23 km');
    expect(presentation.elapsed).toBe('01:05');
    expect(presentation.elevation).toBe('+87 m');
    expect(presentation.objectiveTitle).toBe('En ruta');
    expect(presentation.objectiveMeta).toBe('Precisión GPS ±6 m');
  });

  it('does not claim the user is on route when no verified route geometry is available', () => {
    const route = developmentRoutes[0];
    expect(route).toBeDefined();
    if (!route) return;

    const state = activeState(route.id, route.slug);
    state.snapshot.distanceToRouteMeters = null;
    state.snapshot.routeProgress = 0;
    state.snapshot.maxRouteProgress = 0;

    const presentation = presentActiveAdventure(route, state);

    expect(presentation.progress).toBe('—');
    expect(presentation.objectiveTitle).toBe('GPS activo');
    expect(presentation.objectiveMeta).toBe('Track oficial no disponible · precisión ±6 m');
  });
});
