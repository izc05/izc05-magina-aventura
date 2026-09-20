import type {
  OfflineRoutePackageManifest,
  RouteDetail,
  RouteMapPayload,
} from '@magina-aventura/contracts';
import {
  evaluateOfflinePackage,
  resolvePmtilesUri,
} from '@magina-aventura/offline-sync';
import { useEffect, useMemo, useState } from 'react';

import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import type { LocationSample } from '@magina-aventura/contracts';

import { getRuntimeRouteMapRepository } from '../features/routes/runtime-route-map-repository';
import { materializeMapStyle } from '../map/map-style';
import { expoRoutePackagePort } from '../offline/expo-route-package-port';
import { getActivityRuntime } from './activity-runtime';
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
  manifest: OfflineRoutePackageManifest | null,
): Promise<string | Record<string, unknown>> {
  const configuredStyle = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const baseStyle = configuredStyle ?? (__DEV__ ? 'https://demotiles.maplibre.org/style.json' : fallbackMapStyle);

  if (!manifest) return baseStyle;

  const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);
  const state = evaluateOfflinePackage(installed, manifest);

  try {
    const response = await fetch(manifest.map.styleTemplateUrl);
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
  const runtime = getActivityRuntime(route?.slug);
  const [engineState, setEngineState] = useState<ActivityEngineState | null>(null);
  const [track, setTrack] = useState<LocationSample[]>([]);
  const [mapPayload, setMapPayload] = useState<RouteMapPayload | null>(null);
  const [mapStyle, setMapStyle] = useState<string | Record<string, unknown> | null>(null);
  const routeMapRepository = getRuntimeRouteMapRepository();
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!route) return;
    const currentRoute = route;
    let active = true;

    async function refreshTrack() {
      const nextTrack = await runtime.loadTrack();
      if (active) setTrack(nextTrack);
    }

    async function load() {
      try {
        const [definition, payload, manifest] = await Promise.all([
          routeMapRepository.getAdventureDefinition(currentRoute.slug),
          routeMapRepository.getMapPayload(currentRoute.slug),
          routeMapRepository.getOfflineManifest(currentRoute.slug),
        ]);
        if (!active) return;

        setMapPayload(payload);
        setMapStyle(await resolveActiveMapStyle(manifest));

        const line = payload?.line.geometry.coordinates ?? [];
        const current = runtime.current();
        if (!current && !definition) {
          throw new Error('La versión exacta de esta aventura no está disponible sin conexión.');
        }
        const recovered = current ?? (await runtime.recover(definition!, currentRoute, line));
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
          const refreshed = await runtime.refresh();
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
  };
}
