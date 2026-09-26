import type {
  OfflineAdventureManifestV1,
  RouteDetail,
  RouteMapPayload,
} from '@magina-aventura/contracts';
import {
  evaluateOfflinePackage,
  resolvePmtilesUri,
} from '@magina-aventura/offline-sync';
import { useEffect, useMemo, useRef, useState } from 'react';

import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import {
  createExplorationState,
  evaluateExplorationSample,
  type ExplorationState,
} from '@magina-aventura/activity-engine';
import type { LocationSample } from '@magina-aventura/contracts';

import { developmentRouteMapRepository } from '../features/routes/development-route-map-repository';
import { materializeMapStyle } from '../map/map-style';
import { expoRoutePackagePort } from '../offline/expo-route-package-port';
import { activityRuntime } from './activity-runtime';
import { trackToGeoJson } from './track-geojson';

const fallbackMapStyle: Record<string, unknown> = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'background',
      type: 'background',
      paint: { 'background-color': '#E7E1D6' },
    },
  ],
};

async function resolveActiveMapStyle(
  manifest: OfflineAdventureManifestV1 | null,
): Promise<string | Record<string, unknown>> {
  const configuredStyle = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const baseStyle = configuredStyle ?? (__DEV__ ? 'https://demotiles.maplibre.org/style.json' : fallbackMapStyle);

  if (!manifest) return baseStyle;
  if (!configuredStyle) return baseStyle;

  const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);
  const state = evaluateOfflinePackage(installed, manifest);

  try {
    const response = await fetch(configuredStyle);
    if (!response.ok) return baseStyle;
    const styleJson = await response.text();
    return materializeMapStyle(
      styleJson,
      resolvePmtilesUri(
        manifest,
        state === 'ready' ? installed?.localUri : undefined,
      ),
    );
  } catch {
    return baseStyle;
  }
}

export function useActiveAdventure(route: RouteDetail | undefined) {
  const [engineState, setEngineState] = useState<ActivityEngineState | null>(null);
  const [track, setTrack] = useState<LocationSample[]>([]);
  const [mapPayload, setMapPayload] = useState<RouteMapPayload | null>(null);
  const [mapStyle, setMapStyle] = useState<string | Record<string, unknown>>(fallbackMapStyle);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [explorationState, setExplorationState] = useState<ExplorationState>(() => createExplorationState());
  const evaluatedSequence = useRef<number | null>(null);

  useEffect(() => {
    if (!route) return;
    const currentRoute = route;
    let active = true;

    async function refreshTrack() {
      const nextTrack = await activityRuntime.loadTrack();
      if (active) setTrack(nextTrack);
    }

    async function load() {
      try {
        const [payload, manifest] = await Promise.all([
          developmentRouteMapRepository.getMapPayload(currentRoute.slug),
          developmentRouteMapRepository.getOfflineManifest(currentRoute.slug),
        ]);
        if (!active) return;

        setMapPayload(payload);
        setMapStyle(await resolveActiveMapStyle(manifest));

        const line = payload?.line.geometry.coordinates ?? [];
        const recovered =
          activityRuntime.current() ??
          (await activityRuntime.recover(currentRoute, line));
        if (!active) return;

        setEngineState(recovered);
        await refreshTrack();
        if (!recovered) {
          setErrorMessage('No hay una aventura activa. Iníciala desde Preparación.');
        }
      } catch (error) {
        if (active) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : 'No se pudo recuperar la aventura.',
          );
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();

    const timer = setInterval(() => {
      if (!active) return;
      void (async () => {
        try {
          const refreshed = await activityRuntime.refresh();
          if (!active || !refreshed) return;
          setEngineState(refreshed);
          await refreshTrack();
        } catch {
          // Keep the last durable state visible. A later refresh may recover.
        }
      })();
    }, 2000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [route?.id]);

  const trackFeature = useMemo(() => trackToGeoJson(track), [track]);
  const currentPoint = engineState?.snapshot.lastValidSample ?? track.at(-1) ?? null;

  useEffect(() => {
    if (!currentPoint || !mapPayload || currentPoint.sequence === evaluatedSequence.current) return;
    const targets = mapPayload.checkpoints
      .filter((checkpoint): checkpoint is typeof checkpoint & { position: readonly [number, number] } => checkpoint.position !== null)
      .map((checkpoint) => ({
        id: checkpoint.id,
        kind: 'checkpoint' as const,
        longitude: checkpoint.position[0],
        latitude: checkpoint.position[1],
        triggerRadiusMeters: checkpoint.triggerRadiusM,
      }));
    const evaluation = evaluateExplorationSample(
      explorationState,
      currentPoint,
      targets,
      { maxAccuracyMeters: 30, requiredConsecutiveSamples: 2, maxEvidenceGapSeconds: 20 },
    );
    evaluatedSequence.current = currentPoint.sequence;
    setExplorationState(evaluation.state);
  }, [currentPoint, explorationState, mapPayload]);

  return {
    engineState,
    setEngineState,
    track,
    trackFeature,
    currentPoint,
    mapPayload,
    mapStyle,
    loading,
    errorMessage,
    setErrorMessage,
    explorationState,
  };
}
