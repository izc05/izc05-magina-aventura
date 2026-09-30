import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AdventureDefinition } from '@magina-aventura/contracts';
import { elapsedSecondsAt, type ActivityEngineState } from '@magina-aventura/activity-engine';
import { activityRuntime } from '../../src/activity/activity-runtime';
import { developmentRouteMapRepository } from '../../src/features/routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { RouteMap } from '../../src/map/RouteMap';
import type { EnhancedRoutePayload } from '../../src/map/map-layers';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { checkpointViewModel } from '../../src/adventure/checkpoint-view-model';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';

  const [mapPayload, setMapPayload] = useState<EnhancedRoutePayload | null>(null);
  const [activityState, setActivityState] = useState<ActivityEngineState | null>(null);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [activityError, setActivityError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!routeSlug) return;
    let active = true;

    async function loadMapData() {
      try {
        const payload = await developmentRouteMapRepository.getMapPayload(routeSlug);
        if (active && payload) {
          setMapPayload(payload as EnhancedRoutePayload);
        }
      } catch {
        if (active) setMapPayload(null);
      }
    }

    void loadMapData();
    return () => {
      active = false;
    };
  }, [routeSlug]);

  const definition = useMemo<AdventureDefinition | null>(() => {
    if (!route) return null;
    return {
      slug: route.slug,
      version: route.contentVersion,
      routeId: route.id,
      geometryVersion: route.geometryVersion,
      gpx: { uri: 'qa://route.gpx', sha256: 'qa' },
      offlineMap: { manifestUri: 'qa://manifest', styleTemplateUri: 'qa://style', contentHash: 'qa' },
      explorationPolicy: {
        maxAccuracyMeters: 50,
        requiredConsecutiveSamples: 2,
        maxEvidenceGapSeconds: 30,
      },
      checkpoints: [],
      discoveries: [],
      missions: [],
      assets: [],
      scenes3d: [],
      progression: { xpRulesetVersion: 1, rewards: [] },
    };
  }, [route]);

  useEffect(() => {
    if (!route || !definition || !mapPayload) return;
    let active = true;
    setStarting(true);
    setActivityError(null);

    async function startOrRecover() {
      try {
        const line = mapPayload?.line.geometry.coordinates ?? [];
        const recovered = await activityRuntime.recover(definition!, route!, line);
        const next = recovered ?? await activityRuntime.start(definition!, route!, line);
        if (active) setActivityState(next);
      } catch (error) {
        if (active) {
          setActivityError(error instanceof Error ? error.message : 'No se pudo iniciar el GPS');
        }
      } finally {
        if (active) setStarting(false);
      }
    }

    void startOrRecover();
    return () => { active = false; };
  }, [route, definition, mapPayload]);

  useEffect(() => {
    if (!activityState) return;
    const timer = setInterval(() => {
      setClockNowMs(Date.now());
      void activityRuntime.refresh().then((next) => {
        if (next) setActivityState(next);
      }).catch((error) => {
        setActivityError(error instanceof Error ? error.message : 'Error actualizando GPS');
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [activityState?.session.activityId]);

  if (!route) {
    return null;
  }

  const nextPoi = mapPayload?.pois?.[0];
  const snapshot = activityState?.snapshot;
  const nextCheckpoint = definition?.checkpoints?.[0] ?? null;
  const checkpoint = nextCheckpoint && activityState?.exploration
    ? checkpointViewModel(nextCheckpoint, activityState.exploration, snapshot?.lastValidSample ?? null)
    : null;
  const checkpointStatusLabel = checkpoint?.status === 'discovered'
    ? 'DESCUBIERTO'
    : checkpoint?.status === 'verifying'
      ? 'EN ZONA'
      : 'PRÓXIMO';
  const objectiveDistanceLabel = checkpoint
    ? checkpoint.distanceMeters == null
      ? 'Esperando GPS'
      : `${Math.round(checkpoint.distanceMeters)} m`
    : snapshot?.lastValidSample
      ? 'Sin checkpoint activo'
      : 'Esperando GPS';
  const distanceKm = (snapshot?.validDistanceMeters ?? 0) / 1000;
  const elapsedSeconds = snapshot && activityState
    ? elapsedSecondsAt(
        snapshot,
        activityState.session.state,
        new Date(clockNowMs).toISOString(),
      )
    : 0;
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);
  const elapsedRemainder = Math.floor(elapsedSeconds % 60);
  const progressPercent = Math.round((snapshot?.routeProgress ?? 0) * 100);
  const gpsSamples = activityState?.session.lastProcessedSequence ?? 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.mapContainer}>
        <RouteMap
          payload={mapPayload}
          developmentMode={route.developmentFixture}
          showLayerControls={true}
          height={600}
        />
      </View>

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View>
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
            <Text style={styles.metricValue}>{String(elapsedMinutes).padStart(2, '0')}:{String(elapsedRemainder).padStart(2, '0')}</Text>
            <Text style={styles.metricLabel}>Tiempo activo</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>{gpsSamples}</Text>
            <Text style={styles.metricLabel}>Muestras GPS</Text>
          </View>
        </View>
      </View>

      <Pressable
        style={styles.exitButton}
        onPress={() => {
          if (finishing) return;
          if (!activityRuntime.current()) {
            router.back();
            return;
          }
          Alert.alert(
            'Salir de la aventura',
            'La ruta seguirá guardada para que puedas continuarla después.',
            [
              { text: 'Seguir en ruta', style: 'cancel' },
              { text: 'Salir', onPress: () => router.back() },
            ],
          );
        }}
      >
        <Text style={styles.exitButtonText}>✕</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>
          {activityError ? 'GPS · ERROR' : starting ? 'GPS · INICIANDO' : activityState ? `GPS REAL · ${activityState.session.state}` : 'GPS · PREPARANDO'}
        </Text>
        {activityError ? (
          <Pressable onPress={() => Alert.alert('GPS', activityError)}>
            <Text style={styles.errorText}>Toca para ver el error · {activityError}</Text>
          </Pressable>
        ) : null}
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
              {nextPoi?.name ?? 'Descubrimiento de prueba'}
            </Text>
            <Text style={styles.objectiveDistance}>
              {objectiveDistanceLabel} · {checkpoint ? checkpointStatusLabel : nextPoi?.category ? nextPoi.category.toUpperCase() : 'POIs'}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>⚑ Ruta</Text>
          </Pressable>
          <Pressable
            style={styles.pauseButton}
            onPress={() => {
              const current = activityRuntime.current();
              if (!current) return;
              const action = current.session.state === 'PAUSED'
                ? activityRuntime.resume()
                : activityRuntime.pause();
              void action.then(setActivityState).catch((error) => {
                setActivityError(error instanceof Error ? error.message : 'No se pudo cambiar el estado');
              });
            }}
          >
            <Text style={styles.pauseButtonText}>
              {activityState?.session.state === 'PAUSED' ? '▶ Reanudar' : 'Ⅱ Pausar'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            disabled={finishing || !activityState}
            onPress={() => {
              Alert.alert(
                'Finalizar aventura',
                'Se guardará el recorrido y la aventura quedará cerrada. Esta acción no es lo mismo que pausar.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Finalizar',
                    style: 'destructive',
                    onPress: () => {
                      setFinishing(true);
                      setActivityError(null);
                      void activityRuntime.finish()
                        .then((finished) => {
                          setActivityState(finished);
                          router.replace(`/adventure/${route.slug}/summary` as any);
                        })
                        .catch((error) => {
                          setActivityError(error instanceof Error ? error.message : 'No se pudo finalizar la aventura');
                        })
                        .finally(() => setFinishing(false));
                    },
                  },
                ],
              );
            }}
          >
            <Text style={styles.actionButtonText}>{finishing ? 'Finalizando…' : '✓ Finalizar'}</Text>
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
    bottom: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing[20],
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
  },
  bottomEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  bottomTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: spacing[8] },
  errorText: { color: colors.muted, fontSize: 10, marginTop: spacing[4] },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[12] },
  objectiveIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  objectiveIconText: { fontSize: 22 },
  objectiveCopy: { flex: 1 },
  objectiveName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  objectiveDistance: { color: colors.olive700, fontSize: 12, fontWeight: '800', marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[16] },
  actionButton: { flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.warmBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  actionButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  pauseButton: { flex: 1.2, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  pauseButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
});
