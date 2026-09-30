import React, { useEffect, useMemo, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { AdventureDefinition } from '@magina-aventura/contracts';
import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import { activityRuntime } from '../../src/activity/activity-runtime';
import { developmentRouteMapRepository } from '../../src/features/routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { routePresentationViewModel } from '../../src/features/routes/route-presentation-view-model';
import { RouteMap } from '../../src/map/RouteMap';
import type { EnhancedRoutePayload } from '../../src/map/map-layers';
import { colors, radius, spacing } from '../../src/theme/tokens';
import { checkpointViewModel } from '../../src/adventure/checkpoint-view-model';
import { technicalGpsMetricsViewModel } from '../../src/adventure/technical-gps-view-model';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';
  const routePresentation = route
    ? routePresentationViewModel(
        route,
        route.developmentFixture ? 'development-simulation' : 'unverified',
      )
    : null;
  const isTechnicalGpsQa = routePresentation?.mode === 'technical-gps-qa';

  const [mapPayload, setMapPayload] = useState<EnhancedRoutePayload | null>(null);
  const [activityState, setActivityState] = useState<ActivityEngineState | null>(null);
  const [clockNowMs, setClockNowMs] = useState(() => Date.now());
  const [activityError, setActivityError] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);
  const [finishing, setFinishing] = useState(false);

  useEffect(() => {
    if (!routeSlug) return;
    if (routePresentation?.showVerifiedMap !== true) {
      setMapPayload(null);
      return;
    }
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
  }, [routePresentation?.showVerifiedMap, routeSlug]);

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
    if (!route || !definition || (!isTechnicalGpsQa && !mapPayload)) return;
    let active = true;
    setStarting(true);
    setActivityError(null);

    async function startOrRecover() {
      try {
        const line = isTechnicalGpsQa
          ? []
          : mapPayload?.line.geometry.coordinates ?? [];
        const recovered = await activityRuntime.recover(definition!, route!, line);
        const next = recovered ?? await activityRuntime.start(definition!, route!, line);
        if (active) setActivityState(next);
      } catch (error) {
        if (active) {
          const current = activityRuntime.current();
          if (current?.session.state === 'PAUSED' && current.session.routeId === route?.id) {
            setActivityState(current);
          }
          setActivityError(error instanceof Error ? error.message : 'No se pudo iniciar el GPS');
        }
      } finally {
        if (active) setStarting(false);
      }
    }

    void startOrRecover();
    return () => { active = false; };
  }, [route, definition, mapPayload, isTechnicalGpsQa]);

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

  const nextPoi = isTechnicalGpsQa ? undefined : mapPayload?.pois?.[0];
  const snapshot = activityState?.snapshot;
  const nextCheckpoint = definition?.checkpoints?.[0] ?? null;
  const checkpoint = !isTechnicalGpsQa && routePresentation?.showVerifiedCheckpoints && nextCheckpoint && activityState?.exploration
    ? checkpointViewModel(nextCheckpoint, activityState.exploration, snapshot?.lastValidSample ?? null, 'verified')
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
  const gpsMetrics = technicalGpsMetricsViewModel(activityState, clockNowMs);
  const distanceValue = gpsMetrics.distanceKm === null
    ? '—'
    : `${gpsMetrics.distanceKm.toFixed(2)} km`;
  const elapsedSeconds = gpsMetrics.elapsedSeconds;
  const elapsedTimeLabel = elapsedSeconds === null
    ? '—'
    : `${String(Math.floor(elapsedSeconds / 60)).padStart(2, '0')}:${String(Math.floor(elapsedSeconds % 60)).padStart(2, '0')}`;
  const deviceMapPosition = useMemo(
    () => gpsMetrics.devicePosition,
    [gpsMetrics.deviceLocationSample],
  );
  const deviceLocationStatusLabel = {
    waiting: 'Esperando ubicación GPS del dispositivo',
    available: 'Ubicación GPS del dispositivo disponible',
    degraded: 'Posición GPS recibida · calidad limitada',
    paused: 'Captura pausada · el pin GPS está detenido',
    finished: 'Captura finalizada · el pin GPS está detenido',
    unavailable: 'Ubicación GPS física no disponible en esta sesión',
  }[gpsMetrics.deviceLocationState];
  const progressPercent = routePresentation?.showVerifiedMap
    ? Math.round((snapshot?.routeProgress ?? 0) * 100)
    : null;
  const gpsSamples = gpsMetrics.gpsSamples;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.mapContainer}>
        {isTechnicalGpsQa ? (
          <>
            <RouteMap
              payload={null}
              baseMapOnly={true}
              attribution={true}
              showLayerControls={false}
              deviceLocation={deviceMapPosition}
              height={600}
            />
            <View pointerEvents="none" style={styles.technicalMapNotice}>
              <Text style={styles.technicalMapNoticeTitle}>Posición GPS del dispositivo</Text>
              <Text style={styles.technicalMapNoticeCopy}>
                Prueba técnica; sin navegación ni ruta verificada.
              </Text>
              <Text style={styles.technicalMapNoticeStatus}>{deviceLocationStatusLabel}</Text>
            </View>
          </>
        ) : (
          <RouteMap
            payload={mapPayload}
            developmentMode={route.developmentFixture}
            showLayerControls={true}
            height={600}
          />
        )}
      </View>

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View>
            <Text style={styles.routeName}>{routePresentation?.title ?? 'Contenido en preparación'}</Text>
            <Text style={styles.routePlace}>
              {isTechnicalGpsQa ? 'Sin ruta oficial verificada' : routePresentation?.municipalityName ?? 'Contenido en preparación'}
            </Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>
              {isTechnicalGpsQa ? 'GPS QA' : progressPercent === null ? '—' : `${progressPercent} %`}
            </Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricValue}>{distanceValue}</Text>
            <Text style={styles.metricLabel}>{isTechnicalGpsQa ? 'Distancia GPS' : 'Distancia'}</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>
              {elapsedTimeLabel}
            </Text>
            <Text style={styles.metricLabel}>{isTechnicalGpsQa ? 'Tiempo GPS' : 'Tiempo activo'}</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>{gpsSamples ?? '—'}</Text>
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
            isTechnicalGpsQa ? 'Salir de la prueba GPS' : 'Salir de la aventura',
            isTechnicalGpsQa
              ? 'La captura técnica GPS seguirá guardada para continuarla después.'
              : 'La ruta seguirá guardada para que puedas continuarla después.',
            [
              { text: isTechnicalGpsQa ? 'Seguir con la prueba' : 'Seguir en ruta', style: 'cancel' },
              { text: 'Salir', onPress: () => router.back() },
            ],
          );
        }}
      >
        <Text style={styles.exitButtonText}>✕</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>
          {activityError
            ? 'GPS · ERROR'
            : starting
              ? isTechnicalGpsQa ? 'GPS TÉCNICO · INICIANDO' : 'GPS · INICIANDO'
              : activityState
                ? isTechnicalGpsQa ? `GPS TÉCNICO · MÉTRICAS REALES · ${activityState.session.state}` : `GPS SOLO EN PRIMER PLANO · ${activityState.session.state}`
                : isTechnicalGpsQa ? 'GPS TÉCNICO · PREPARANDO' : 'GPS · PREPARANDO'}
        </Text>
        {isTechnicalGpsQa ? (
          <Text style={styles.technicalNotice}>{routePresentation?.technicalGpsNotice}</Text>
        ) : null}
        {activityError ? (
          <Pressable onPress={() => Alert.alert('GPS', activityError)}>
            <Text style={styles.errorText}>Toca para ver el error · {activityError}</Text>
          </Pressable>
        ) : null}
        <Text style={styles.bottomTitle}>{isTechnicalGpsQa ? 'Sin checkpoint verificado' : 'Siguiente objetivo'}</Text>
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
              {isTechnicalGpsQa ? 'No hay checkpoint verificado' : nextPoi?.name ?? 'Sin objetivo cargado'}
            </Text>
            <Text style={styles.objectiveDistance}>
              {isTechnicalGpsQa
                ? 'Los objetivos simulados no se muestran como reales'
                : `${objectiveDistanceLabel} · ${checkpoint ? checkpointStatusLabel : nextPoi?.category ? nextPoi.category.toUpperCase() : 'POIs'}`}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          {!isTechnicalGpsQa ? (
            <Pressable style={styles.actionButton}>
              <Text style={styles.actionButtonText}>⚑ Ruta</Text>
            </Pressable>
          ) : null}
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
              {activityState?.session.state === 'PAUSED'
                ? isTechnicalGpsQa ? '▶ Reanudar GPS' : '▶ Reanudar'
                : isTechnicalGpsQa ? 'Ⅱ Pausar GPS' : 'Ⅱ Pausar'}
            </Text>
          </Pressable>
          <Pressable
            style={styles.actionButton}
            disabled={finishing || !activityState}
            onPress={() => {
              Alert.alert(
                isTechnicalGpsQa ? 'Finalizar captura GPS' : 'Finalizar aventura',
                isTechnicalGpsQa
                  ? 'Se guardarán las métricas GPS reales de la prueba. No se validará ninguna ruta, checkpoint ni recompensa.'
                  : 'Se guardará el recorrido y la aventura quedará cerrada. Esta acción no es lo mismo que pausar.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: isTechnicalGpsQa ? 'Finalizar captura' : 'Finalizar',
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
            <Text style={styles.actionButtonText}>
              {finishing ? 'Finalizando…' : isTechnicalGpsQa ? '✓ Finalizar GPS' : '✓ Finalizar'}
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  mapContainer: { flex: 1, marginHorizontal: -spacing[20], marginTop: -spacing[12] },
  preparationMap: { flex: 1, marginHorizontal: spacing[20], marginVertical: spacing[12], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center', padding: spacing[24] },
  preparationMapTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', textAlign: 'center' },
  preparationMapBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8], textAlign: 'center' },
  technicalMapNotice: { position: 'absolute', top: 206, left: spacing[20], right: spacing[20], padding: spacing[12], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive700, backgroundColor: colors.white, elevation: 3 },
  technicalMapNoticeTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  technicalMapNoticeCopy: { color: colors.olive900, fontSize: 11, fontWeight: '800', marginTop: spacing[4] },
  technicalMapNoticeStatus: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: spacing[4] },
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
  technicalNotice: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing[8] },
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
