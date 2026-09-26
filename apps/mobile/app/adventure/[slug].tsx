import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useMemo } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../src/activity/activity-runtime';
import { useActiveAdventure } from '../../src/activity/use-active-adventure';
import { presentActiveAdventure } from '../../src/features/adventure/active-adventure-presenter';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { ActiveAdventureMap } from '../../src/map/ActiveAdventureMap';
import { colors, radius, shadow, spacing } from '../../src/theme/tokens';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const {
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
  } = useActiveAdventure(route);

  const presentation = useMemo(
    () => (route ? presentActiveAdventure(route, engineState) : null),
    [route, engineState],
  );

  if (!route || !presentation) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <StatusBar style="dark" />
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Aventura no disponible</Text>
          <Text style={styles.notFoundBody}>
            No encontramos la ruta o la actividad necesaria para abrir esta aventura.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
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
        ? await activityRuntime.resume()
        : await activityRuntime.pause();
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
      const finished = await activityRuntime.finish();
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

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ActiveAdventureMap
        payload={mapPayload}
        mapStyle={mapStyle}
        track={trackFeature}
        currentPoint={currentPoint}
        fallbackCenter={[currentRoute.startLongitude, currentRoute.startLatitude]}
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
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>ESTADO DE LA AVENTURA</Text>
        <Text style={styles.objectiveName}>{presentation.objectiveTitle}</Text>
        <Text style={styles.objectiveMeta}>{presentation.objectiveMeta}</Text>
        <Text style={styles.checkpointProgress}>
          {explorationState.unlockedTargetIds.length} checkpoints detectados en modo piloto
        </Text>

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
              Puedes bloquear la pantalla durante la aventura. El teléfono seguirá guardando el recorrido y conservará los datos aunque pierdas la conexión.
            </Text>
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
  checkpointProgress: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    marginTop: spacing[8],
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
    paddingHorizontal: spacing[20],
  },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  persistNote: {
    color: colors.muted,
    fontSize: 10,
    lineHeight: 15,
    marginTop: spacing[12],
  },
  notFound: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
  },
  notFoundTitle: {
    color: colors.ink,
    fontSize: 22,
    fontWeight: '900',
    textAlign: 'center',
  },
  notFoundBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing[8],
    maxWidth: 320,
  },
});
