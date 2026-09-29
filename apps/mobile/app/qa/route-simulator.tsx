import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  advanceBySteps,
  advanceReplay,
  createSimulator,
  jumpToCheckpoint,
  route01CuadrosContent,
  routeLengthMeters,
  snapshot,
  type RouteGeometry,
  type SimulatorState,
} from '@magina-aventura/route-simulator';

import { mockRoutePayload } from '../../src/features/routes/development-route-map-repository';
import type { EnhancedRoutePayload } from '../../src/map/map-layers';
import { RouteMap } from '../../src/map/RouteMap';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

const enabled =
  __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_ROUTE_SIMULATOR === '1';

type ReplaySpeed = 1 | 4 | 10;

function scaledContentForGeometry(geometryLengthMeters: number) {
  const authoredLength =
    route01CuadrosContent.checkpoints.at(-1)?.progressMeters || 8720;
  const scale =
    authoredLength > 0 && geometryLengthMeters > 0
      ? geometryLengthMeters / authoredLength
      : 1;

  return {
    ...route01CuadrosContent,
    checkpoints: route01CuadrosContent.checkpoints.map((checkpoint) => ({
      ...checkpoint,
      progressMeters: checkpoint.progressMeters * scale,
    })),
  };
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
}

function formatPercent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export default function RouteSimulatorQaScreen() {
  const geometry: RouteGeometry = useMemo(
    () => ({
      coordinates: mockRoutePayload.line.geometry.coordinates,
    }),
    [],
  );
  const geometryLengthMeters = useMemo(
    () => routeLengthMeters(geometry),
    [geometry],
  );
  const content = useMemo(
    () => scaledContentForGeometry(geometryLengthMeters),
    [geometryLengthMeters],
  );
  const [state, setState] = useState<SimulatorState>(() =>
    createSimulator(content, geometry, 'route-01-mobile-qa'),
  );
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed | null>(null);
  const [qaSteps, setQaSteps] = useState(0);

  useEffect(() => {
    if (replaySpeed === null) return;

    const timer = setInterval(() => {
      setState((current) =>
        advanceReplay(
          content,
          geometry,
          current,
          current.elapsedMs + 1000,
          replaySpeed,
        ),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [content, geometry, replaySpeed]);

  const progress = geometryLengthMeters
    ? state.progressMeters / geometryLengthMeters
    : 0;
  const publicSnapshot = snapshot(state);
  const reached = new Set(state.reachedCheckpointIds);
  const nextCheckpoint = content.checkpoints.find(
    (checkpoint) => !reached.has(checkpoint.id),
  );
  const lastReached = [...content.checkpoints]
    .reverse()
    .find((checkpoint) => reached.has(checkpoint.id));

  const mapPayload: EnhancedRoutePayload = useMemo(
    () => ({
      ...mockRoutePayload,
      hikerPosition: state.position,
      hikerHeadingDeg: 45,
    }),
    [state.position],
  );

  function startReplay(speed: ReplaySpeed) {
    setReplaySpeed(speed);
  }

  function addSteps(steps: number) {
    setReplaySpeed(null);
    setQaSteps((current) => current + steps);
    setState((current) =>
      advanceBySteps(content, geometry, current, steps),
    );
  }

  function jumpNext() {
    setReplaySpeed(null);
    const target =
      nextCheckpoint ?? content.checkpoints[content.checkpoints.length - 1];
    if (!target) return;
    setState((current) =>
      jumpToCheckpoint(content, geometry, current, target.id),
    );
  }

  function reset() {
    setReplaySpeed(null);
    setQaSteps(0);
    setState(createSimulator(content, geometry, 'route-01-mobile-qa'));
  }

  if (!enabled) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <Text style={styles.title}>Simulador QA desactivado</Text>
          <Text style={styles.body}>
            Esta pantalla solo está disponible en desarrollo o en una APK QA.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.qaBanner}>
          <Text style={styles.qaBannerText}>
            SIMULACIÓN QA · NO ES EVIDENCIA DE GPS FÍSICO
          </Text>
        </View>

        <Text style={styles.eyebrow}>ROUTE-01 · BEDMAR / CUADROS</Text>
        <Text style={styles.title}>{content.title}</Text>
        <Text style={styles.body}>
          Geometría provisional de desarrollo. Mistral está verificando el
          track oficial antes de sustituirla.
        </Text>

        <View style={styles.metrics}>
          <Metric label="Progreso" value={formatPercent(progress)} />
          <Metric label="Virtual" value={formatDistance(progress * 8720)} />
          <Metric label="Pasos QA" value={String(qaSteps)} />
        </View>

        <RouteMap
          payload={mapPayload}
          mapStyle="https://demotiles.maplibre.org/style.json"
          developmentMode
          showLayerControls={false}
          height={330}
        />

        <View style={styles.objectiveCard}>
          <Text style={styles.objectiveEyebrow}>OBJETIVO</Text>
          <Text style={styles.objectiveTitle}>
            {nextCheckpoint?.title ?? 'Aventura virtual completada'}
          </Text>
          <Text style={styles.objectiveBody}>
            {lastReached
              ? `Último alcanzado: ${lastReached.title}`
              : 'Todavía no se ha alcanzado ningún checkpoint.'}
          </Text>
          <Text style={styles.objectiveMeta}>
            {state.unlockedDiscoveryIds.length} descubrimientos desbloqueados
          </Text>
        </View>

        <Text style={styles.sectionTitle}>Replay</Text>
        <View style={styles.row}>
          {([1, 4, 10] as ReplaySpeed[]).map((speed) => (
            <Pressable
              key={speed}
              style={[
                styles.smallButton,
                replaySpeed === speed && styles.smallButtonActive,
              ]}
              onPress={() => startReplay(speed)}
            >
              <Text style={styles.smallButtonText}>x{speed}</Text>
            </Pressable>
          ))}
          <Pressable style={styles.darkButton} onPress={() => setReplaySpeed(null)}>
            <Text style={styles.darkButtonText}>Pausa</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Caminar para avanzar</Text>
        <Text style={styles.helper}>
          En esta iteración los pasos son botones QA. El adaptador de pasos
          reales se añadirá después, sin cambiar el motor de simulación.
        </Text>
        <View style={styles.row}>
          <Pressable style={styles.outlineButton} onPress={() => addSteps(100)}>
            <Text style={styles.outlineButtonText}>+100 pasos</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={() => addSteps(500)}>
            <Text style={styles.outlineButtonText}>+500 pasos</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Checkpoints</Text>
        <View style={styles.row}>
          <Pressable style={styles.primaryButton} onPress={jumpNext}>
            <Text style={styles.primaryButtonText}>Saltar al siguiente</Text>
          </Pressable>
          <Pressable style={styles.outlineButton} onPress={reset}>
            <Text style={styles.outlineButtonText}>Reiniciar</Text>
          </Pressable>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Separación de QA</Text>
          <Text style={styles.safetyBody}>
            Logros públicos: {publicSnapshot.publicAchievementEligible ? 'sí' : 'no'} ·
            Ranking: {publicSnapshot.rankingEligible ? 'sí' : 'no'} ·
            Cupones: {publicSnapshot.sponsorRedemptionEligible ? 'sí' : 'no'}
          </Text>
          <Text style={styles.safetyBody}>
            La ruta oficial permanece en modo simulación mientras figure cerrada
            temporalmente y hasta validar la geometría real.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: spacing[40] },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[24],
  },
  qaBanner: {
    alignSelf: 'flex-start',
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    marginBottom: spacing[16],
  },
  qaBannerText: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.7,
  },
  eyebrow: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  title: {
    color: colors.ink,
    fontSize: typography.display,
    fontWeight: '900',
    marginTop: spacing[4],
  },
  body: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing[8],
  },
  metrics: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    marginTop: spacing[20],
    padding: spacing[16],
    ...shadow.card,
  },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 3 },
  objectiveCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    padding: spacing[20],
    marginTop: spacing[12],
  },
  objectiveEyebrow: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  objectiveTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  objectiveBody: {
    color: colors.limestone,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
  objectiveMeta: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing[12],
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
    marginTop: spacing[24],
  },
  helper: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
  row: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginTop: spacing[12],
  },
  smallButton: {
    minWidth: 52,
    minHeight: 44,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallButtonActive: {
    borderColor: colors.olive900,
    backgroundColor: colors.limestone,
  },
  smallButtonText: { color: colors.olive900, fontWeight: '900' },
  darkButton: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  darkButtonText: { color: colors.white, fontWeight: '900' },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  primaryButtonText: { color: colors.white, fontWeight: '900' },
  outlineButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.olive900,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  outlineButtonText: { color: colors.olive900, fontWeight: '900' },
  safetyCard: {
    marginTop: spacing[24],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
  },
  safetyTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  safetyBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
});
