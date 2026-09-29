import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
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
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

const enabled = __DEV__ || process.env.EXPO_PUBLIC_ENABLE_QA_ROUTE_SIMULATOR === '1';
const geometry: RouteGeometry = { coordinates: mockRoutePayload.line.geometry.coordinates };
const checkpointIds = route01CuadrosContent.checkpoints.map((checkpoint) => checkpoint.id);

function km(value: number): string { return `${(value / 1000).toFixed(2)} km`; }

export default function QaRouteSimulatorScreen() {
  const totalMeters = useMemo(() => routeLengthMeters(geometry), []);
  const [state, setState] = useState<SimulatorState>(() => createSimulator(route01CuadrosContent, geometry, 'mobile-qa-route-01'));
  const progress = totalMeters === 0 ? 0 : Math.min(1, state.progressMeters / totalMeters);
  const nextCheckpoint = route01CuadrosContent.checkpoints.find((checkpoint) => !state.reachedCheckpointIds.includes(checkpoint.id));

  if (!enabled) {
    return <SafeAreaView style={styles.safe}><View style={styles.center}><Text style={styles.title}>Simulador QA desactivado</Text><Text style={styles.body}>Solo disponible en desarrollo o en una build QA explícita.</Text></View></SafeAreaView>;
  }

  const replay = (speedMultiplier: 1 | 4 | 10) => setState((current) => advanceReplay(route01CuadrosContent, geometry, current, Math.min(120_000, current.elapsedMs + 10_000), speedMultiplier));
  const walk = (steps: number) => setState((current) => advanceBySteps(route01CuadrosContent, geometry, current, steps));
  const jump = () => setState((current) => nextCheckpoint ? jumpToCheckpoint(route01CuadrosContent, geometry, current, nextCheckpoint.id) : current);
  const reset = () => setState(createSimulator(route01CuadrosContent, geometry, 'mobile-qa-route-01'));

  return <SafeAreaView style={styles.safe} edges={['top']}><ScrollView contentContainerStyle={styles.content}>
    <View style={styles.banner}><Text style={styles.bannerText}>SIMULACIÓN QA · NO ES GPS FÍSICO</Text></View>
    <Text style={styles.eyebrow}>ROUTE-01 · QA ROUTE SIMULATOR</Text>
    <Text style={styles.title}>{route01CuadrosContent.title}</Text>
    <Text style={styles.body}>Sesión virtual aislada. La ruta oficial continúa en simulation-only mientras figure cerrada.</Text>
    <View style={styles.metrics}><Metric label="Progreso virtual" value={`${Math.round(progress * 100)}%`} /><Metric label="Distancia" value={km(state.progressMeters)} /><Metric label="Checkpoints" value={`${state.reachedCheckpointIds.length}/${route01CuadrosContent.checkpoints.length}`} /></View>
    <View style={styles.progressTrack}><View style={[styles.progressFill, { width: `${progress * 100}%` }]} /></View>
    <Card label="MODO ACTUAL" title={state.context.mode === 'walk_to_advance' ? 'Caminar para avanzar' : state.context.mode === 'checkpoint_jump' ? 'Checkpoint-jump' : 'Replay GPX/KML'} body={`Watermark: ${state.context.watermark}. Recompensas comerciales, ranking y logros públicos: desactivados.`} />
    <Text style={styles.section}>Replay determinista</Text><View style={styles.row}>{([1, 4, 10] as const).map((speed) => <Button key={speed} text={`Avanzar x${speed}`} onPress={() => replay(speed)} />)}</View>
    <Text style={styles.section}>Walk-to-advance</Text><View style={styles.row}><Button text="+100 pasos" onPress={() => walk(100)} /><Button text="+500 pasos" onPress={() => walk(500)} /></View>
    <Text style={styles.section}>Checkpoint-jump</Text><Button text={nextCheckpoint ? `Saltar a ${nextCheckpoint.title}` : 'Ruta completada'} onPress={jump} />
    <View style={styles.card}><Text style={styles.cardLabel}>DISCOVERIES DESBLOQUEADOS</Text><Text style={styles.cardTitle}>{state.unlockedDiscoveryIds.length} · {state.unlockedDiscoveryIds.map((id) => route01CuadrosContent.discoveries.find((item) => item.id === id)?.title).filter(Boolean).join(' · ') || 'Ninguno todavía'}</Text><Text style={styles.body}>Contenido y SponsorReward MOCK disponibles para probar sin efectos comerciales.</Text></View>
    <Button text="Reiniciar simulación" onPress={reset} secondary />
  </ScrollView></SafeAreaView>;
}

function Metric({ label, value }: { label: string; value: string }) { return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>; }
function Card({ label, title, body }: { label: string; title: string; body: string }) { return <View style={styles.card}><Text style={styles.cardLabel}>{label}</Text><Text style={styles.cardTitle}>{title}</Text><Text style={styles.body}>{body}</Text></View>; }
function Button({ text, onPress, secondary = false }: { text: string; onPress: () => void; secondary?: boolean }) { return <Pressable onPress={onPress} style={[styles.button, secondary && styles.secondary]}><Text style={[styles.buttonText, secondary && styles.secondaryText]}>{text}</Text></Pressable>; }

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.warmBackground }, content: { padding: spacing[20], gap: spacing[12], paddingBottom: spacing[40] }, center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[24] }, banner: { alignSelf: 'flex-start', borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: spacing[12], paddingVertical: spacing[8] }, bannerText: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 0.7 }, eyebrow: { color: colors.olive700, fontSize: 11, fontWeight: '900', letterSpacing: 1.1, marginTop: spacing[8] }, title: { color: colors.ink, fontSize: typography.display, fontWeight: '900' }, body: { color: colors.muted, fontSize: 13, lineHeight: 19 }, metrics: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[16], marginTop: spacing[8] }, metric: { flex: 1 }, metricValue: { color: colors.ink, fontSize: 18, fontWeight: '900' }, metricLabel: { color: colors.muted, fontSize: 10, marginTop: spacing[4] }, progressTrack: { height: 10, borderRadius: radius.pill, backgroundColor: colors.border, overflow: 'hidden' }, progressFill: { height: '100%', backgroundColor: colors.aoveGold }, card: { backgroundColor: colors.olive900, borderRadius: radius.lg, padding: spacing[20], marginTop: spacing[8] }, cardLabel: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1 }, cardTitle: { color: colors.white, fontSize: 16, fontWeight: '900', marginTop: spacing[8], lineHeight: 22 }, section: { color: colors.ink, fontSize: typography.section, fontWeight: '900', marginTop: spacing[8] }, row: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] }, button: { minHeight: 46, borderRadius: radius.md, backgroundColor: colors.olive900, justifyContent: 'center', paddingHorizontal: spacing[16] }, buttonText: { color: colors.white, fontWeight: '900' }, secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.olive900 }, secondaryText: { color: colors.olive900 }, });
