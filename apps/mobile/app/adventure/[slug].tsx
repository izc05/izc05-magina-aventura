import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../src/activity/activity-runtime';
import { createDevelopmentAdventureDefinition } from '../../src/activity/development-adventure-definition';
import { developmentRouteMapRepository } from '../../src/features/routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { RouteMap } from '../../src/map/RouteMap';
import type { EnhancedRoutePayload } from '../../src/map/map-layers';
import { colors, radius, spacing } from '../../src/theme/tokens';

function formatElapsed(totalSeconds: number): string {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const seconds = safeSeconds % 60;

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes
      .toString()
      .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  return `${minutes.toString().padStart(2, '0')}:${seconds
    .toString()
    .padStart(2, '0')}`;
}

function errorCopy(error: unknown): string {
  if (error instanceof Error) return error.message;
  return 'No se ha podido iniciar el seguimiento GPS.';
}

function distanceBetweenMeters(
  a: { latitude: number; longitude: number },
  b: { latitude: number; longitude: number },
): number {
  const radius = 6_371_008.8;
  const radians = (value: number) => (value * Math.PI) / 180;
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const deltaLat = radians(b.latitude - a.latitude);
  const deltaLon = radians(b.longitude - a.longitude);
  const h =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLon / 2) ** 2;
  return 2 * radius * Math.asin(Math.sqrt(h));
}

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';

  const [mapPayload, setMapPayload] = useState<EnhancedRoutePayload | null>(null);
  const [activityState, setActivityState] = useState<ActivityEngineState | null>(null);
  const [runtimeError, setRuntimeError] = useState<string | null>(null);
  const [starting, setStarting] = useState(true);
  const [busyAction, setBusyAction] = useState(false);

  useEffect(() => {
    if (!route || !routeSlug) return;
    const currentRoute = route;

    let active = true;
    let refreshTimer: ReturnType<typeof setInterval> | null = null;

    async function startOrRecover() {
      setStarting(true);
      setRuntimeError(null);

      try {
        const payload = await developmentRouteMapRepository.getMapPayload(routeSlug);
        if (!payload) {
          throw new Error('La geometría de esta ruta no está disponible.');
        }
        if (!active) return;

        const enhancedPayload = payload as EnhancedRoutePayload;
        setMapPayload(enhancedPayload);

        const definition = createDevelopmentAdventureDefinition(currentRoute, enhancedPayload);
        const line = enhancedPayload.line.geometry.coordinates;

        const recovered = await activityRuntime.recover(definition, currentRoute, line);
        const state = recovered ?? await activityRuntime.start(definition, currentRoute, line);

        if (!active) return;
        setActivityState(state);

        refreshTimer = setInterval(() => {
          void activityRuntime
            .refresh()
            .then((next) => {
              if (active && next) setActivityState(next);
            })
            .catch((error) => {
              if (active) setRuntimeError(errorCopy(error));
            });
        }, 2000);
      } catch (error) {
        if (active) setRuntimeError(errorCopy(error));
      } finally {
        if (active) setStarting(false);
      }
    }

    void startOrRecover();

    return () => {
      active = false;
      if (refreshTimer) clearInterval(refreshTimer);
    };
  }, [route, routeSlug]);

  const livePayload = useMemo(() => {
    if (!mapPayload) return null;

    const lastSample = activityState?.snapshot.lastValidSample;
    if (!lastSample) return mapPayload;

    return {
      ...mapPayload,
      hikerPosition: [lastSample.longitude, lastSample.latitude] as const,
      hikerHeadingDeg: lastSample.headingDegrees ?? 0,
    };
  }, [activityState, mapPayload]);

  if (!route) {
    return null;
  }

  const snapshot = activityState?.snapshot;
  const sessionState = activityState?.session.state ?? 'DRAFT';
  const nextPoi = livePayload?.pois?.[0];
  const lastSample = snapshot?.lastValidSample;

  const objectiveDistance =
    nextPoi && lastSample
      ? Math.round(
          distanceBetweenMeters(
            {
              latitude: lastSample.latitude,
              longitude: lastSample.longitude,
            },
            {
              latitude: nextPoi.position[1],
              longitude: nextPoi.position[0],
            },
          ),
        )
      : null;

  const distanceKm = (snapshot?.validDistanceMeters ?? 0) / 1000;
  const progressPercent = Math.round((snapshot?.maxRouteProgress ?? 0) * 100);
  const sampleCount = activityState?.session.lastProcessedSequence ?? 0;
  const isPaused = sessionState === 'PAUSED';

  async function togglePause() {
    setBusyAction(true);
    setRuntimeError(null);
    try {
      const next = isPaused
        ? await activityRuntime.resume()
        : await activityRuntime.pause();
      setActivityState(next);
    } catch (error) {
      setRuntimeError(errorCopy(error));
    } finally {
      setBusyAction(false);
    }
  }

  async function finishAdventure() {
    setBusyAction(true);
    setRuntimeError(null);
    try {
      const finished = await activityRuntime.finish();
      setActivityState(finished);
      router.replace({
        pathname: '/adventure/[slug]/summary',
        params: { slug: routeSlug },
      });
    } catch (error) {
      setRuntimeError(errorCopy(error));
    } finally {
      setBusyAction(false);
    }
  }

  async function exitAdventure() {
    if (sessionState === 'ACTIVE') {
      try {
        const paused = await activityRuntime.pause();
        setActivityState(paused);
      } catch {
        // Navigation is still allowed; persisted state decides recovery on reopen.
      }
    }
    router.back();
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.mapContainer}>
        <RouteMap
          payload={livePayload}
          developmentMode={false}
          showLayerControls={true}
          height={600}
        />
      </View>

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View style={styles.routeCopy}>
            <Text style={styles.routeName}>{route.title}</Text>
            <Text style={styles.routePlace}>{route.municipalityName}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{progressPercent} %</Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricValue}>{distanceKm.toFixed(2)} km</Text>
            <Text style={styles.metricLabel}>Distancia</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>{formatElapsed(snapshot?.totalElapsedSeconds ?? 0)}</Text>
            <Text style={styles.metricLabel}>Tiempo</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>+{Math.round(snapshot?.elevationGainMeters ?? 0)} m</Text>
            <Text style={styles.metricLabel}>Desnivel</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.exitButton} onPress={() => void exitAdventure()}>
        <Text style={styles.exitButtonText}>✕</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>
          {starting
            ? 'INICIANDO GPS REAL'
            : isPaused
              ? 'AVENTURA PAUSADA'
              : `GPS REAL · ${sampleCount} MUESTRAS`}
        </Text>

        {runtimeError ? (
          <Text style={styles.errorText}>{runtimeError}</Text>
        ) : (
          <>
            <Text style={styles.bottomTitle}>Siguiente objetivo</Text>
            <View style={styles.objectiveRow}>
              <View style={styles.objectiveIcon}>
                <Text style={styles.objectiveIconText}>
                  {nextPoi?.category === 'flora'
                    ? '🌿'
                    : nextPoi?.category === 'olive'
                      ? '🫒'
                      : nextPoi?.category === 'heritage'
                        ? '🏰'
                        : '📍'}
                </Text>
              </View>
              <View style={styles.objectiveCopy}>
                <Text style={styles.objectiveName}>
                  {nextPoi?.name ?? 'Esperando datos de ruta'}
                </Text>
                <Text style={styles.objectiveDistance}>
                  {objectiveDistance === null ? 'Esperando primera posición GPS' : `${objectiveDistance} m`}
                  {nextPoi?.category ? ` · ${nextPoi.category.toUpperCase()}` : ''}
                </Text>
              </View>
            </View>
          </>
        )}

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, busyAction && styles.disabledButton]}
            disabled={starting || busyAction || Boolean(runtimeError)}
            onPress={() => void togglePause()}
          >
            <Text style={styles.actionButtonText}>{isPaused ? '▶ Reanudar' : 'Ⅱ Pausar'}</Text>
          </Pressable>
          <Pressable
            style={[styles.finishButton, busyAction && styles.disabledButton]}
            disabled={starting || busyAction || Boolean(runtimeError)}
            onPress={() => void finishAdventure()}
          >
            <Text style={styles.finishButtonText}>■ Terminar</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>! SOS</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  mapContainer: { flex: 1, marginHorizontal: -spacing[20], marginTop: -spacing[12] },
  topHud: {
    position: 'absolute',
    top: spacing[12],
    left: spacing[16],
    right: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing[16],
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
  },
  topHudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeCopy: { flex: 1, paddingRight: spacing[8] },
  routeName: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  routePlace: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressBadge: { borderRadius: radius.pill, backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  progressText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[12], paddingTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border },
  metricValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  exitButton: {
    position: 'absolute',
    top: 154,
    right: spacing[20],
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  exitButtonText: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  bottomCard: {
    position: 'absolute',
    left: spacing[16],
    right: spacing[16],
    bottom: spacing[32],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing[20],
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
  },
  bottomEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  bottomTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: spacing[8] },
  errorText: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: spacing[12], lineHeight: 18 },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[12] },
  objectiveIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  objectiveIconText: { fontSize: 22 },
  objectiveCopy: { flex: 1 },
  objectiveName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  objectiveDistance: { color: colors.olive700, fontSize: 12, fontWeight: '800', marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[16] },
  actionButton: { flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.warmBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  actionButtonText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  finishButton: { flex: 1.15, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { color: colors.white, fontSize: 11, fontWeight: '900' },
  disabledButton: { opacity: 0.55 },
});
