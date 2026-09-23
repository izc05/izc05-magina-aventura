import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getActivityRuntime } from '../../src/activity/activity-runtime';
import {
  emitQaTestPosition,
  getQaSimulationPanel,
  isQaAdventureRoute,
  type QaTestPositionKey,
} from '../../src/features/qa/qa-harness';
import { useActiveAdventure } from '../../src/activity/use-active-adventure';
import { presentActiveAdventure } from '../../src/features/adventure/active-adventure-presenter';
import { presentExploration } from '../../src/features/adventure/exploration-presenter';
import { shouldShowExplorationOverlay } from '../../src/features/adventure/exploration-overlay';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { ActiveAdventureMap } from '../../src/map/ActiveAdventureMap';
import { colors, radius, shadow, spacing } from '../../src/theme/tokens';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const runtime = getActivityRuntime(route?.slug);
  const QaSimulationPanel = getQaSimulationPanel();
  const {
    engineState,
    adventureDefinition,
    setEngineState,
    track,
    trackFeature,
    currentPoint,
    mapPayload,
    mapStyle,
    loading,
    errorMessage,
    setErrorMessage,
  } = useActiveAdventure(route);

  const presentation = useMemo(
    () => (route ? presentActiveAdventure(route, engineState) : null),
    [route, engineState],
  );
  const exploration = useMemo(
    () => presentExploration(adventureDefinition, engineState, mapPayload),
    [adventureDefinition, engineState, mapPayload],
  );
  const [celebrationVisible, setCelebrationVisible] = useState(false);
  const seenObservationKey = useRef<string | null>(null);
  const latestObservation = engineState?.explorationObservations?.at(-1);
  const latestObservationKey = latestObservation
    ? `${latestObservation.targetKey}:${latestObservation.sampleSequence}`
    : null;

  useEffect(() => {
    if (!latestObservationKey) return;
    if (seenObservationKey.current === null) {
      seenObservationKey.current = latestObservationKey;
      return;
    }
    if (shouldShowExplorationOverlay(seenObservationKey.current, latestObservationKey)) {
      seenObservationKey.current = latestObservationKey;
      setCelebrationVisible(true);
    }
  }, [latestObservationKey]);

  if (!route) {
    return (
      <SafeAreaView style={styles.startupSafeArea}>
        <View style={styles.startupCard}>
          <Text style={styles.startupEyebrow}>MÁGINA AVENTURA</Text>
          <Text style={styles.startupTitle}>Ruta no disponible</Text>
          <Text style={styles.startupBody}>Esta aventura ya no está disponible en el paquete local.</Text>
          <Pressable style={styles.startupButton} onPress={() => router.replace('/')}>
            <Text style={styles.startupButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  if (!presentation) return null;

  if (loading && !engineState) {
    return (
      <SafeAreaView style={styles.startupSafeArea}>
        <View style={styles.startupCard}>
          <Text style={styles.startupEyebrow}>RECUPERACIÓN OFFLINE</Text>
          <Text style={styles.startupTitle}>Cargando tu aventura</Text>
          <Text style={styles.startupBody}>Estamos leyendo el progreso guardado en este dispositivo.</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!loading && !engineState && errorMessage) {
    return (
      <SafeAreaView style={styles.startupSafeArea}>
        <View style={styles.startupCard}>
          <Text style={styles.startupEyebrow}>RECUPERACIÓN OFFLINE</Text>
          <Text style={styles.startupTitle}>No se pudo recuperar la aventura</Text>
          <Text style={styles.startupBody}>{errorMessage}</Text>
          <Pressable
            style={styles.startupButton}
            onPress={() =>
              router.replace({ pathname: '/routes/[slug]/prepare', params: { slug: route.slug } })
            }
          >
            <Text style={styles.startupButtonText}>Volver a Preparación</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentRoute = route;
  const isPaused = engineState?.session.state === 'PAUSED';
  const hasActivity = Boolean(engineState);

  async function togglePause() {
    if (!engineState) return;
    setErrorMessage(null);
    try {
      const next = isPaused
        ? await runtime.resume()
        : await runtime.pause();
      setEngineState(next);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo cambiar el estado del GPS.',
      );
    }
  }

  async function finishAdventure() {
    if (!engineState) return;
    setErrorMessage(null);
    try {
      const finished = await runtime.finish();
      setEngineState(finished);
      router.replace({
        pathname: '/adventure-summary/[slug]',
        params: { slug: currentRoute.slug },
      });
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : 'No se pudo finalizar la aventura.',
      );
    }
  }

  function confirmFinish() {
    if (!engineState) return;
    Alert.alert(
      'Finalizar aventura',
      'El recorrido se guardará en el teléfono y quedará pendiente de sincronización si no tienes conexión.',
      [
        { text: 'Seguir caminando', style: 'cancel' },
        {
          text: 'Finalizar',
          style: 'destructive',
          onPress: () => void finishAdventure(),
        },
      ],
    );
  }

  async function emitTestPosition(position: QaTestPositionKey) {
    if (!isQaAdventureRoute(currentRoute.slug)) return;
    try {
      await emitQaTestPosition(position);
      setEngineState(await runtime.refresh());
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo simular la posición.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ActiveAdventureMap
        payload={mapPayload}
        mapStyle={mapStyle ?? {
          version: 8,
          sources: {},
          layers: [{ id: 'background', type: 'background', paint: { 'background-color': '#E7E1D6' } }],
        }}
        track={trackFeature}
        currentPoint={currentPoint}
        fallbackCenter={[currentRoute.startLongitude, currentRoute.startLatitude]}
        discoveryTargets={adventureDefinition?.discoveries ?? []}
        unlockedTargetKeys={engineState?.exploration?.unlockedTargetKeys ?? []}
      />

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View style={styles.routeCopy}>
            <Text style={styles.routeName}>{presentation.routeTitle}</Text>
            <Text style={styles.routePlace}>{presentation.place}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{presentation.progress}</Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <Metric value={presentation.distance} label="Distancia" />
          <Metric value={presentation.elapsed} label="Tiempo" />
          <Metric value={presentation.elevation} label="Desnivel" />
        </View>
        <View style={styles.gpsRow}>
          <Text style={styles.gpsStatus}>{presentation.modeLabel}</Text>
          <Text style={styles.gpsMeta}>
            {currentPoint
              ? `${track.length} puntos · ±${Math.round(currentPoint.accuracyMeters)} m`
              : 'Buscando señal GPS…'}
          </Text>
        </View>
        <View style={styles.explorationProgressRow}>
          <View style={styles.explorationProgressTrack}>
            <View
              style={[
                styles.explorationProgressFill,
                {
                  width: exploration.totalCount
                    ? `${Math.round((exploration.completedCount / exploration.totalCount) * 100)}%`
                    : '0%',
                },
              ]}
            />
          </View>
          <Text style={styles.explorationProgressLabel}>{exploration.progressLabel}</Text>
        </View>
      </View>

      <View style={styles.objectiveCard}>
        <View style={styles.objectiveIcon}>
          <Text style={styles.objectiveIconText}>
            {exploration.nextKind === 'discovery' ? '◇' : exploration.nextKind === 'complete' ? '✓' : '◎'}
          </Text>
        </View>
        <View style={styles.objectiveCopy}>
          <Text style={styles.objectiveEyebrow}>
            {exploration.nextKind === 'discovery' ? 'SIGUIENTE DISCOVERY' : 'SIGUIENTE CHECKPOINT'}
          </Text>
          <Text style={styles.explorationObjectiveName}>{exploration.nextTitle}</Text>
          <Text style={styles.explorationObjectiveMeta}>{exploration.nextMeta}</Text>
        </View>
      </View>

      {exploration.latestEventTitle ? (
        <View style={styles.eventCard}>
          <View style={styles.eventSeal}>
            <Text style={styles.eventSealText}>{exploration.latestEventKind === 'discovery' ? '◇' : '✓'}</Text>
          </View>
          <View style={styles.eventCopy}>
            <Text style={styles.eventEyebrow}>
              {exploration.latestEventKind === 'discovery' ? 'DESCUBRIMIENTO REGISTRADO' : 'CHECKPOINT ALCANZADO'}
            </Text>
            <Text style={styles.eventTitle}>{exploration.latestEventTitle}</Text>
            <Text style={styles.eventMeta}>{exploration.latestEventMeta}</Text>
          </View>
        </View>
      ) : null}

      {celebrationVisible && exploration.latestEventTitle ? (
        <View style={styles.celebrationBackdrop}>
          <View style={styles.celebrationCard}>
            <View style={styles.celebrationSeal}>
              <Text style={styles.celebrationSealText}>
                {exploration.latestEventKind === 'discovery' ? '◇' : '✓'}
              </Text>
            </View>
            <Text style={styles.celebrationEyebrow}>
              {exploration.latestEventKind === 'discovery' ? 'NUEVO DESCUBRIMIENTO' : 'CHECKPOINT ALCANZADO'}
            </Text>
            <Text style={styles.celebrationTitle}>{exploration.latestEventTitle}</Text>
            <Text style={styles.celebrationBody}>
              Tu progreso se ha guardado en este dispositivo. Sigue la ruta para continuar la aventura.
            </Text>
            <Pressable style={styles.celebrationButton} onPress={() => setCelebrationVisible(false)}>
              <Text style={styles.celebrationButtonText}>Continuar ruta</Text>
            </Pressable>
          </View>
        </View>
      ) : null}

      {isPaused ? (
        <View style={styles.pauseBanner}>
          <View style={styles.pauseIcon}>
            <Text style={styles.pauseIconText}>Ⅱ</Text>
          </View>
          <View style={styles.pauseCopy}>
            <Text style={styles.pauseEyebrow}>PAUSA · PROGRESO PROTEGIDO</Text>
            <Text style={styles.pauseTitle}>El GPS está detenido</Text>
            <Text style={styles.pauseMeta}>SQLite ha guardado tu recorrido hasta aquí</Text>
          </View>
          <Pressable style={styles.resumePill} onPress={() => void togglePause()}>
            <Text style={styles.resumePillText}>Seguir</Text>
          </Pressable>
        </View>
      ) : null}

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>{isPaused ? 'PROGRESO PROTEGIDO' : 'ESTADO DE LA AVENTURA'}</Text>
        <Text style={styles.objectiveName}>{presentation.objectiveTitle}</Text>
        <Text style={styles.objectiveMeta}>{presentation.objectiveMeta}</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {!hasActivity && !loading ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() =>
              router.replace({
                pathname: '/routes/[slug]/prepare',
                params: { slug: currentRoute.slug },
              })
            }
          >
            <Text style={styles.primaryButtonText}>Volver a Preparación</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.actionRow}>
              <Pressable
                style={styles.secondaryButton}
                onPress={() => void togglePause()}
              >
                <Text style={styles.secondaryButtonText}>
                  {isPaused ? 'Reanudar' : 'Pausar'}
                </Text>
              </Pressable>
              <Pressable style={styles.finishButton} onPress={confirmFinish}>
                <Text style={styles.finishButtonText}>Finalizar</Text>
              </Pressable>
            </View>
            <Text style={styles.persistNote}>
              Puedes bloquear la pantalla. Android seguirá guardando posiciones en SQLite y el track se sincronizará después.
            </Text>
            {QaSimulationPanel && isQaAdventureRoute(currentRoute.slug) ? (
              <QaSimulationPanel onEmit={(position) => void emitTestPosition(position)} />
            ) : null}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  startupSafeArea: { flex: 1, backgroundColor: colors.warmBackground, justifyContent: 'center', padding: spacing[20] },
  startupCard: { borderRadius: radius.xl, backgroundColor: colors.white, padding: spacing[24], borderWidth: 1, borderColor: colors.border, ...shadow.card },
  startupEyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  startupTitle: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: spacing[8] },
  startupBody: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: spacing[12] },
  startupButton: { minHeight: 52, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center', marginTop: spacing[20] },
  startupButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  topHud: {
    position: 'absolute',
    top: spacing[12],
    left: spacing[16],
    right: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.96)',
    padding: spacing[16],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  topHudHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  routeCopy: { flex: 1 },
  routeName: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  routePlace: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  progressText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  metrics: {
    flexDirection: 'row',
    marginTop: spacing[16],
    paddingTop: spacing[12],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  gpsRow: {
    marginTop: spacing[12],
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  gpsStatus: {
    flex: 1,
    color: colors.olive700,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  gpsMeta: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  explorationProgressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[12] },
  explorationProgressTrack: { flex: 1, height: 5, borderRadius: radius.pill, backgroundColor: colors.oliveWash, overflow: 'hidden' },
  explorationProgressFill: { height: 5, borderRadius: radius.pill, backgroundColor: colors.aoveGold },
  explorationProgressLabel: { color: colors.muted, fontSize: 10, fontWeight: '900' },
  objectiveCard: {
    position: 'absolute', top: 226, left: spacing[16], right: spacing[16],
    borderRadius: radius.lg, backgroundColor: 'rgba(255,255,255,0.97)', padding: spacing[12],
    flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.border, ...shadow.card,
  },
  objectiveIcon: { width: 42, height: 42, borderRadius: radius.md, backgroundColor: colors.oliveWash, alignItems: 'center', justifyContent: 'center' },
  objectiveIconText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  objectiveCopy: { flex: 1, marginLeft: spacing[12] },
  objectiveEyebrow: { color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  explorationObjectiveName: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 3 },
  explorationObjectiveMeta: { color: colors.muted, fontSize: 11, fontWeight: '700', marginTop: 3 },
  eventCard: {
    position: 'absolute', top: 308, left: spacing[28], right: spacing[28], borderRadius: radius.md,
    backgroundColor: colors.goldWash, padding: spacing[10], flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: '#E9DDAF',
  },
  eventSeal: { width: 30, height: 30, borderRadius: 15, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  eventSealText: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  eventCopy: { flex: 1, marginLeft: spacing[10] },
  eventEyebrow: { color: colors.earth, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  eventTitle: { color: colors.ink, fontSize: 13, fontWeight: '900', marginTop: 2 },
  eventMeta: { color: colors.earth, fontSize: 10, marginTop: 2 },
  celebrationBackdrop: {
    position: 'absolute', left: 0, right: 0, top: 0, bottom: 0,
    backgroundColor: 'rgba(23,32,25,0.42)', alignItems: 'center', justifyContent: 'center', padding: spacing[24],
  },
  celebrationCard: {
    width: '100%', borderRadius: radius.xl, backgroundColor: colors.warmBackground,
    padding: spacing[24], alignItems: 'center', ...shadow.floating,
  },
  celebrationSeal: { width: 72, height: 72, borderRadius: 36, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  celebrationSealText: { color: colors.ink, fontSize: 38, fontWeight: '900' },
  celebrationEyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.2, marginTop: spacing[20], textAlign: 'center' },
  celebrationTitle: { color: colors.ink, fontSize: 24, fontWeight: '900', marginTop: spacing[8], textAlign: 'center' },
  celebrationBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[12], textAlign: 'center' },
  celebrationButton: { width: '100%', minHeight: 54, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center', marginTop: spacing[20] },
  celebrationButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  pauseBanner: {
    position: 'absolute', top: 318, left: spacing[16], right: spacing[16], borderRadius: radius.lg,
    backgroundColor: colors.olive900, padding: spacing[12], flexDirection: 'row', alignItems: 'center', ...shadow.card,
  },
  pauseIcon: { width: 38, height: 38, borderRadius: 19, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  pauseIconText: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  pauseCopy: { flex: 1, marginLeft: spacing[10] },
  pauseEyebrow: { color: colors.aoveGold, fontSize: 8, fontWeight: '900', letterSpacing: 0.8 },
  pauseTitle: { color: colors.white, fontSize: 14, fontWeight: '900', marginTop: 3 },
  pauseMeta: { color: colors.limestone, fontSize: 10, marginTop: 2 },
  resumePill: { borderRadius: radius.pill, backgroundColor: colors.white, paddingHorizontal: spacing[12], paddingVertical: spacing[8], marginLeft: spacing[8] },
  resumePillText: { color: colors.olive900, fontSize: 11, fontWeight: '900' },
  bottomCard: {
    position: 'absolute',
    left: spacing[16],
    right: spacing[16],
    bottom: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: 'rgba(255,255,255,0.97)',
    padding: spacing[20],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  bottomEyebrow: {
    color: colors.aoveGold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  objectiveName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  objectiveMeta: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    marginTop: 4,
  },
  errorText: {
    color: colors.earth,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing[12],
  },
  actionRow: {
    flexDirection: 'row',
    gap: spacing[10],
    marginTop: spacing[16],
  },
  secondaryButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.warmBackground,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  finishButton: {
    flex: 1,
    minHeight: 50,
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  finishButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  primaryButton: {
    minHeight: 52,
    marginTop: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  persistNote: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing[12],
  },
});
