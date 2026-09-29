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
  distanceMeters,
  jumpToQaPosition,
  positionAtDistance,
  routeLengthMeters,
  walkToAdvance,
  type QaRouteSimulationMode,
  type QaRouteSimulationSnapshot,
} from '../../src/activity/qa-route-simulator';
import { route01CuadrosContent } from '../../src/features/adventure-content/route-01-cuadros.fixture';
import {
  mockRoutePayload,
} from '../../src/features/routes/development-route-map-repository';
import type { EnhancedRoutePayload } from '../../src/map/map-layers';
import { RouteMap } from '../../src/map/RouteMap';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

const simulatorEnabled =
  __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_ROUTE_SIMULATOR === '1';

const REPLAY_BASE_METERS_PER_SECOND = 1.4;

type ReplaySpeed = 1 | 4 | 10;

function modeLabel(mode: QaRouteSimulationMode): string {
  if (mode === 'walk_to_advance') return 'Caminar para avanzar';
  if (mode === 'checkpoint_jump') return 'Salto de checkpoint';
  return 'Replay de ruta';
}

function km(valueMeters: number): string {
  return `${(valueMeters / 1000).toFixed(2)} km`;
}

function percent(value: number): string {
  return `${Math.round(Math.max(0, Math.min(1, value)) * 100)}%`;
}

export default function QaRouteSimulatorScreen() {
  const routeLine = mockRoutePayload.line.geometry.coordinates;
  const totalRouteMeters = useMemo(() => routeLengthMeters(routeLine), [routeLine]);
  const [replayDistanceMeters, setReplayDistanceMeters] = useState(0);
  const [replaySpeed, setReplaySpeed] = useState<ReplaySpeed | null>(null);
  const [steps, setSteps] = useState(0);
  const [strideMeters] = useState(0.75);
  const [mode, setMode] = useState<QaRouteSimulationMode>('replay');
  const [jumpSnapshot, setJumpSnapshot] = useState<QaRouteSimulationSnapshot | null>(null);
  const [checkpointIndex, setCheckpointIndex] = useState(0);

  useEffect(() => {
    if (mode !== 'replay' || replaySpeed === null) return;

    const timer = setInterval(() => {
      setReplayDistanceMeters((current) =>
        Math.min(
          totalRouteMeters,
          current + REPLAY_BASE_METERS_PER_SECOND * replaySpeed,
        ),
      );
    }, 1000);

    return () => clearInterval(timer);
  }, [mode, replaySpeed, totalRouteMeters]);

  const baseSnapshot = useMemo(() => {
    if (mode === 'walk_to_advance') {
      return walkToAdvance(routeLine, steps, strideMeters);
    }
    return positionAtDistance(routeLine, replayDistanceMeters);
  }, [mode, replayDistanceMeters, routeLine, steps, strideMeters]);

  const snapshot =
    mode === 'checkpoint_jump' && jumpSnapshot ? jumpSnapshot : baseSnapshot;

  const nearestCheckpoint = useMemo(() => {
    return [...mockRoutePayload.checkpoints]
      .map((checkpoint) => ({
        checkpoint,
        distance: distanceMeters(snapshot.position, checkpoint.position),
      }))
      .sort((left, right) => left.distance - right.distance)[0];
  }, [snapshot.position]);

  const simulatedPayload: EnhancedRoutePayload = useMemo(
    () => ({
      ...mockRoutePayload,
      hikerPosition: snapshot.position,
      hikerHeadingDeg: 45,
    }),
    [snapshot.position],
  );

  function startReplay(speed: ReplaySpeed) {
    setJumpSnapshot(null);
    setMode('replay');
    setReplaySpeed(speed);
  }

  function switchToWalkMode() {
    setReplaySpeed(null);
    setJumpSnapshot(null);
    setMode('walk_to_advance');
  }

  function addSteps(value: number) {
    switchToWalkMode();
    setSteps((current) => current + value);
  }

  function jumpToNextCheckpoint() {
    setReplaySpeed(null);
    const nextIndex =
      checkpointIndex >= mockRoutePayload.checkpoints.length
        ? 0
        : checkpointIndex;
    const checkpoint = mockRoutePayload.checkpoints[nextIndex]!;

    setJumpSnapshot(jumpToQaPosition(checkpoint.position));
    setCheckpointIndex((nextIndex + 1) % mockRoutePayload.checkpoints.length);
    setMode('checkpoint_jump');
  }

  function resetSimulation() {
    setReplaySpeed(null);
    setReplayDistanceMeters(0);
    setSteps(0);
    setCheckpointIndex(0);
    setJumpSnapshot(null);
    setMode('replay');
  }

  if (!simulatorEnabled) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.disabled}>
          <Text style={styles.disabledTitle}>Simulador QA desactivado</Text>
          <Text style={styles.disabledBody}>
            Esta pantalla solo se habilita en desarrollo o en una APK QA con
            EXPO_PUBLIC_ENABLE_QA_ROUTE_SIMULATOR=1.
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
          <Text style={styles.qaBannerText}>SIMULACIÓN QA · NO ES GPS FÍSICO</Text>
        </View>

        <Text style={styles.eyebrow}>ROUTE-01 · CUADROS</Text>
        <Text style={styles.title}>{route01CuadrosContent.title}</Text>
        <Text style={styles.subtitle}>{route01CuadrosContent.subtitle}</Text>

        <View style={styles.metricCard}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{percent(snapshot.routeProgress)}</Text>
            <Text style={styles.metricLabel}>Progreso virtual</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{km(snapshot.virtualDistanceMeters)}</Text>
            <Text style={styles.metricLabel}>Distancia virtual</Text>
          </View>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{steps}</Text>
            <Text style={styles.metricLabel}>Pasos QA</Text>
          </View>
        </View>

        <RouteMap
          payload={simulatedPayload}
          mapStyle="https://demotiles.maplibre.org/style.json"
          developmentMode
          showLayerControls={false}
          height={330}
        />

        <View style={styles.statusCard}>
          <Text style={styles.statusEyebrow}>MODO ACTUAL</Text>
          <Text style={styles.statusTitle}>{modeLabel(mode)}</Text>
          <Text style={styles.statusBody}>
            {mode === 'checkpoint_jump'
              ? 'El salto mueve el avatar para probar UI/eventos, pero no acredita distancia ni progreso físico.'
              : snapshot.completed
                ? 'Replay completado. Ninguna recompensa comercial puede canjearse desde una sesión QA.'
                : `Ruta virtual: ${km(snapshot.virtualDistanceMeters)} de ${km(totalRouteMeters)}.`}
          </Text>
          {nearestCheckpoint ? (
            <Text style={styles.targetText}>
              Objetivo más cercano: {nearestCheckpoint.checkpoint.name} · {Math.round(nearestCheckpoint.distance)} m
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Replay automático</Text>
        <View style={styles.buttonRow}>
          {([1, 4, 10] as ReplaySpeed[]).map((speed) => (
            <Pressable
              key={speed}
              style={[
                styles.modeButton,
                mode === 'replay' && replaySpeed === speed && styles.modeButtonActive,
              ]}
              onPress={() => startReplay(speed)}
            >
              <Text style={styles.modeButtonText}>x{speed}</Text>
            </Pressable>
          ))}
          <Pressable
            style={styles.pauseButton}
            onPress={() => setReplaySpeed(null)}
          >
            <Text style={styles.pauseButtonText}>Pausa</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Caminar para avanzar</Text>
        <Text style={styles.helpText}>
          De momento estos botones simulan lotes de pasos. El siguiente adaptador
          podrá recibir pasos reales del dispositivo sin modificar el motor de ruta.
        </Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.secondaryButton} onPress={() => addSteps(100)}>
            <Text style={styles.secondaryButtonText}>+100 pasos</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={() => addSteps(500)}>
            <Text style={styles.secondaryButtonText}>+500 pasos</Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>Prueba de checkpoints</Text>
        <View style={styles.buttonRow}>
          <Pressable style={styles.primaryButton} onPress={jumpToNextCheckpoint}>
            <Text style={styles.primaryButtonText}>Saltar al siguiente</Text>
          </Pressable>
          <Pressable style={styles.secondaryButton} onPress={resetSimulation}>
            <Text style={styles.secondaryButtonText}>Reiniciar</Text>
          </Pressable>
        </View>

        <View style={styles.contentCard}>
          <Text style={styles.contentEyebrow}>CONTENIDO PREPARADO</Text>
          <Text style={styles.contentTitle}>
            {route01CuadrosContent.knowledgeCards.length} historias · {route01CuadrosContent.collectibles.length} coleccionables · {route01CuadrosContent.photoSpots.length} puntos de foto
          </Text>
          <Text style={styles.contentBody}>
            Las promociones siguen siendo MOCK e inactivas. Este simulador no
            participa en rankings públicos ni puede autorizar canjes.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: spacing[40] },
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
    letterSpacing: 0.8,
  },
  eyebrow: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    color: colors.ink,
    fontSize: typography.display,
    fontWeight: '900',
    marginTop: spacing[4],
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing[8],
  },
  metricCard: {
    marginTop: spacing[20],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    flexDirection: 'row',
    padding: spacing[16],
    ...shadow.card,
  },
  metric: { flex: 1, minWidth: 0 },
  metricValue: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: spacing[4] },
  statusCard: {
    marginTop: spacing[12],
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    padding: spacing[20],
  },
  statusEyebrow: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  statusTitle: {
    color: colors.white,
    fontSize: 19,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  statusBody: {
    color: colors.limestone,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing[8],
  },
  targetText: {
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
  helpText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
  buttonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[8],
    marginTop: spacing[12],
  },
  modeButton: {
    minWidth: 56,
    minHeight: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[12],
  },
  modeButtonActive: {
    borderColor: colors.olive900,
    backgroundColor: colors.limestone,
  },
  modeButtonText: { color: colors.olive900, fontWeight: '900' },
  pauseButton: {
    minHeight: 44,
    borderRadius: radius.md,
    backgroundColor: colors.ink,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  pauseButtonText: { color: colors.white, fontWeight: '900' },
  primaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  primaryButtonText: { color: colors.white, fontWeight: '900' },
  secondaryButton: {
    minHeight: 48,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.olive900,
    backgroundColor: colors.white,
    justifyContent: 'center',
    paddingHorizontal: spacing[16],
  },
  secondaryButtonText: { color: colors.olive900, fontWeight: '900' },
  contentCard: {
    marginTop: spacing[24],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
  },
  contentEyebrow: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  contentTitle: {
    color: colors.ink,
    fontSize: 15,
    lineHeight: 21,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  contentBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
  disabled: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[24],
  },
  disabledTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
  },
  disabledBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing[8],
  },
});
