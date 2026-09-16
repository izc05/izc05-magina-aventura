import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import type { LocationSample } from '@magina-aventura/contracts';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../src/activity/activity-runtime';
import { presentActiveAdventure } from '../../src/features/adventure/active-adventure-presenter';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { colors, radius, shadow, spacing } from '../../src/theme/tokens';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const [engineState, setEngineState] = useState<ActivityEngineState | null>(null);
  const [track, setTrack] = useState<LocationSample[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!route) return;
    let active = true;

    async function load() {
      try {
        const recovered = activityRuntime.current() ?? (await activityRuntime.recover(route));
        if (!active) return;
        setEngineState(recovered);
        setTrack(await activityRuntime.loadTrack());
        if (!recovered) setErrorMessage('No hay una aventura activa. Iníciala desde Preparación.');
      } catch (error) {
        if (active) setErrorMessage(error instanceof Error ? error.message : 'No se pudo recuperar la aventura.');
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
          setTrack(await activityRuntime.loadTrack());
        } catch {
          // Keep the last durable state visible. The next refresh may recover.
        }
      })();
    }, 2000);

    return () => {
      active = false;
      clearInterval(timer);
    };
  }, [route?.id]);

  const presentation = useMemo(
    () => (route ? presentActiveAdventure(route, engineState) : null),
    [route, engineState],
  );

  if (!route || !presentation) return null;

  const currentPoint = engineState?.snapshot.lastValidSample ?? track.at(-1) ?? null;
  const isPaused = engineState?.session.state === 'PAUSED';
  const hasActivity = Boolean(engineState);

  async function togglePause() {
    if (!engineState) return;
    setErrorMessage(null);
    try {
      const next = isPaused ? await activityRuntime.resume() : await activityRuntime.pause();
      setEngineState(next);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo cambiar el estado del GPS.');
    }
  }

  async function finishAdventure() {
    if (!engineState) return;
    setErrorMessage(null);
    try {
      const finished = await activityRuntime.finish();
      setEngineState(finished);
      router.replace({ pathname: '/adventure-summary/[slug]', params: { slug: route.slug } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo finalizar la aventura.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.trackingCanvas}>
        <View style={styles.canvasGridHorizontal} />
        <View style={styles.canvasGridVertical} />
        <View style={styles.positionRadius} />
        <View style={styles.positionDot} />
        <View style={styles.gpsBadge}>
          <Text style={styles.gpsBadgeText}>
            {hasActivity ? (isPaused ? 'GPS PAUSADO' : 'GPS REAL · OFFLINE') : 'SIN ACTIVIDAD'}
          </Text>
        </View>
        <View style={styles.positionCard}>
          <Text style={styles.positionCardLabel}>POSICIÓN ACTUAL</Text>
          <Text style={styles.positionCardValue}>
            {currentPoint
              ? `${currentPoint.latitude.toFixed(5)}, ${currentPoint.longitude.toFixed(5)}`
              : 'Esperando una posición GPS válida…'}
          </Text>
          <Text style={styles.positionCardMeta}>
            {currentPoint
              ? `${track.length} puntos guardados · precisión ±${Math.round(currentPoint.accuracyMeters)} m`
              : 'Sal al exterior y mantén la ubicación activada.'}
          </Text>
        </View>
      </View>

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
      </View>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>{presentation.modeLabel}</Text>
        <Text style={styles.objectiveName}>{presentation.objectiveTitle}</Text>
        <Text style={styles.objectiveMeta}>{presentation.objectiveMeta}</Text>

        {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}

        {!hasActivity && !loading ? (
          <Pressable
            style={styles.primaryButton}
            onPress={() => router.replace({ pathname: '/routes/[slug]/prepare', params: { slug: route.slug } })}
          >
            <Text style={styles.primaryButtonText}>Volver a Preparación</Text>
          </Pressable>
        ) : (
          <>
            <View style={styles.actionRow}>
              <Pressable style={styles.secondaryButton} onPress={() => void togglePause()}>
                <Text style={styles.secondaryButtonText}>{isPaused ? 'Reanudar' : 'Pausar'}</Text>
              </Pressable>
              <Pressable style={styles.finishButton} onPress={() => void finishAdventure()}>
                <Text style={styles.finishButtonText}>Finalizar</Text>
              </Pressable>
            </View>
            <Text style={styles.persistNote}>
              Puedes bloquear la pantalla. Android seguirá guardando posiciones en SQLite mientras el servicio esté activo.
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
  trackingCanvas: { flex: 1, overflow: 'hidden', backgroundColor: colors.limestone },
  canvasGridHorizontal: { position: 'absolute', left: 0, right: 0, top: '50%', height: 1, backgroundColor: colors.border },
  canvasGridVertical: { position: 'absolute', top: 0, bottom: 0, left: '50%', width: 1, backgroundColor: colors.border },
  positionRadius: { position: 'absolute', width: 180, height: 180, borderRadius: 90, borderWidth: 2, borderColor: colors.sky, backgroundColor: 'rgba(127,179,217,0.12)', left: '50%', top: '51%', marginLeft: -90, marginTop: -90 },
  positionDot: { position: 'absolute', width: 26, height: 26, borderRadius: 13, backgroundColor: colors.aoveGold, borderWidth: 5, borderColor: colors.white, left: '50%', top: '51%', marginLeft: -13, marginTop: -13 },
  gpsBadge: { position: 'absolute', top: 214, left: spacing[20], borderRadius: radius.pill, backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  gpsBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  positionCard: { position: 'absolute', left: spacing[20], right: spacing[20], top: '61%', borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[16], borderWidth: 1, borderColor: colors.border, ...shadow.card },
  positionCardLabel: { color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  positionCardValue: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: spacing[6] },
  positionCardMeta: { color: colors.muted, fontSize: 11, marginTop: spacing[4] },
  topHud: { position: 'absolute', top: spacing[12], left: spacing[16], right: spacing[16], borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[16], borderWidth: 1, borderColor: colors.border, ...shadow.card },
  topHudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[12] },
  routeCopy: { flex: 1 },
  routeName: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  routePlace: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressBadge: { borderRadius: radius.pill, backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  progressText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  metrics: { flexDirection: 'row', marginTop: spacing[16], paddingTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  bottomCard: { position: 'absolute', left: spacing[16], right: spacing[16], bottom: spacing[16], borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[20], borderWidth: 1, borderColor: colors.border, ...shadow.card },
  bottomEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  objectiveName: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: spacing[8] },
  objectiveMeta: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 4 },
  errorText: { color: colors.earth, fontSize: 11, fontWeight: '800', marginTop: spacing[12] },
  actionRow: { flexDirection: 'row', gap: spacing[10], marginTop: spacing[16] },
  secondaryButton: { flex: 1, minHeight: 50, borderRadius: radius.md, backgroundColor: colors.warmBackground, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  finishButton: { flex: 1, minHeight: 50, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  finishButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  primaryButton: { minHeight: 52, marginTop: spacing[16], borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  persistNote: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: spacing[12] },
});
