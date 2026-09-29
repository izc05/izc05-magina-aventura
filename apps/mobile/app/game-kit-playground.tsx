import React, { useMemo, useReducer, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  AdventureHud,
  BadgeRewardCard,
  CheckpointCard,
  DiscoveryCard,
  GameEventFeedback,
  type GameFeedback,
} from '../src/features/game-kit/GameKitComponents';
import {
  createInitialGameKitState,
  getExplorerLevel,
  reduceGameKitAction,
  XP_REWARDS,
  type GameEvent,
  type GameKitAction,
} from '../src/features/game-kit/model';
import {
  createMockFullAdventureSequence,
  MOCK_BADGES,
  MOCK_ACTIVE_OBJECTIVE,
  MOCK_CHALLENGES,
  MOCK_COLLECTIBLES,
  MOCK_DISCOVERIES,
  MOCK_ROUTE,
} from '../src/features/game-kit/mock-content';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

const initialState = createInitialGameKitState(MOCK_ROUTE.checkpoints.map((checkpoint) => checkpoint.id));
const reducer = (state: typeof initialState, action: GameKitAction) => reduceGameKitAction(state, action);

export default function GameKitPlaygroundScreen() {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, initialState);
  const [feedback, setFeedback] = useState<GameFeedback | null>(null);
  const level = getExplorerLevel(state.xp);
  const activeObjective = state.completed
    ? 'Aventura demo finalizada'
    : state.activeObjectiveId === MOCK_ACTIVE_OBJECTIVE.id
      ? MOCK_ACTIVE_OBJECTIVE.label
      : 'Inicia la aventura para fijar objetivo';
  const resetDisabled = state.eventHistory.length === 0;

  const nextDiscovery = useMemo(
    () => MOCK_DISCOVERIES.find((discovery) => !state.discoveries.includes(discovery.id))?.title ?? 'Ruta completada',
    [state.discoveries],
  );

  if (!__DEV__) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.releaseNotice}>
          <Text style={styles.systemTitle}>Herramienta de desarrollo</Text>
          <Text style={styles.releaseCopy}>El Game Kit Playground solo está disponible en builds de desarrollo y QA.</Text>
          <Pressable accessibilityRole="button" style={styles.releaseButton} onPress={() => router.replace('/')}>
            <Text style={styles.releaseButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  function emit(event: GameEvent) {
    dispatch({ type: 'GAME_EVENT', event });
  }

  function resetPlayground() {
    dispatch({ type: 'RESET_PLAYGROUND', checkpointIds: MOCK_ROUTE.checkpoints.map((checkpoint) => checkpoint.id) });
    show('Playground reiniciado', 'Progreso, recompensas y deduplicación vuelven al estado inicial.', 'default');
  }

  function show(title: string, detail: string, kind: GameFeedback['kind']) {
    setFeedback({ title, detail, kind });
  }

  function awardXp(amount: number, reason: string) {
    emit({ type: 'XP_GAINED', amount, reason });
  }

  function startAdventure() {
    emit({ type: 'ADVENTURE_STARTED' });
    show('Aventura iniciada', 'Modo demo · ubicación simulada', 'default');
  }

  function approachCheckpoint(checkpointId = MOCK_ROUTE.checkpoints[0]!.id) {
    emit({ type: 'CHECKPOINT_NEARBY', checkpointId });
    show('Checkpoint cercano', 'Señal visual simulada · no se ha consultado el GPS', 'checkpoint');
  }

  function reachCheckpoint(checkpointId = MOCK_ROUTE.checkpoints[0]!.id) {
    const checkpoint = MOCK_ROUTE.checkpoints.find((item) => item.id === checkpointId);
    if (state.checkpointStates[checkpointId] === 'DISCOVERED' || state.checkpointStates[checkpointId] === 'COMPLETED') {
      show('Checkpoint ya alcanzado', 'La repetición no concede XP adicional.', 'checkpoint');
      return;
    }
    emit({ type: 'CHECKPOINT_REACHED', checkpointId });
    awardXp(XP_REWARDS.checkpoint, 'Checkpoint alcanzado');
    show('Checkpoint alcanzado', `+${XP_REWARDS.checkpoint} XP · ${checkpoint?.title ?? 'Checkpoint demo'}`, 'checkpoint');
  }

  function unlockDiscovery(discoveryId: string) {
    const discovery = MOCK_DISCOVERIES.find((item) => item.id === discoveryId);
    if (!discovery) return;
    if (state.discoveries.includes(discoveryId)) {
      show('Descubrimiento ya registrado', 'La repetición no concede XP adicional.', 'discovery');
      return;
    }
    emit({ type: 'DISCOVERY_UNLOCKED', discoveryId });
    awardXp(discovery.xp, `Descubrimiento · ${discovery.title}`);
    show(discovery.title, `+${discovery.xp} XP · descubrimiento ${discovery.category.toLowerCase()} demo`, 'discovery');
  }

  function unlockBadge(badgeId: string) {
    const badge = MOCK_BADGES.find((item) => item.id === badgeId);
    if (!badge) return;
    emit({ type: 'BADGE_UNLOCKED', badgeId });
    show('Insignia conseguida', `${badge.icon} ${badge.title} · prueba visual`, 'badge');
  }

  function unlockFirstChallenge() {
    const challenge = MOCK_CHALLENGES[0]!;
    if (state.challenges.includes(challenge.id)) {
      show('Reto ya desbloqueado', 'La repetición no concede XP adicional.', 'xp');
      return;
    }
    emit({ type: 'CHALLENGE_UNLOCKED', challengeId: challenge.id });
    awardXp(XP_REWARDS.challenge, 'Reto desbloqueado');
    show('Reto desbloqueado', `+${XP_REWARDS.challenge} XP · ${challenge.title}`, 'xp');
  }

  function findFirstCollectible() {
    const collectible = MOCK_COLLECTIBLES[0]!;
    if (state.collectibles.includes(collectible.id)) {
      show('Objeto ya encontrado', 'La repetición no concede XP adicional.', 'default');
      return;
    }
    emit({ type: 'COLLECTIBLE_FOUND', collectibleId: collectible.id });
    awardXp(XP_REWARDS.collectible, 'Objeto encontrado');
    show('Objeto encontrado', `+${XP_REWARDS.collectible} XP · ${collectible.title}`, 'default');
  }

  function runDemoSequence() {
    for (const event of createMockFullAdventureSequence()) emit(event);
    show('Aventura demo completada', 'Objetivo → checkpoint → descubrimiento → XP → insignias → finalización · 650 XP', 'route');
  }

  function completeAdventure() {
    if (state.completed) return;
    emit({ type: 'ADVENTURE_COMPLETED' });
    awardXp(XP_REWARDS.completedRoute, 'Ruta demo completada');
    emit({ type: 'BADGE_UNLOCKED', badgeId: 'magina-explorer' });
    show('Ruta completada', `+${XP_REWARDS.completedRoute} XP · recompensa demo desbloqueada`, 'route');
  }

  const firstCheckpoint = MOCK_ROUTE.checkpoints[0]!;
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Volver" style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <View style={styles.headerCopy}>
          <Text style={styles.eyebrow}>LABORATORIO DE DESARROLLO · QA</Text>
          <Text style={styles.headerTitle} numberOfLines={1} ellipsizeMode="tail">Game Kit Playground</Text>
        </View>
        <View style={styles.demoPill}><Text style={styles.demoPillText}>MOCK</Text></View>
      </View>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.intro}>
          Eventos manuales para probar HUD, descubrimientos y recompensas. Sin GPS real, sin persistencia y sin conexión al Adventure Engine.
        </Text>

        <View style={styles.mapPreview} accessibilityLabel="Vista conceptual de mapa ficticio para el HUD">
          <View style={styles.terrainRingOne} />
          <View style={styles.terrainRingTwo} />
          <View style={styles.terrainRingThree} />
          <View style={styles.routeSegmentOne} />
          <View style={styles.routeSegmentTwo} />
          <View style={styles.routeSegmentThree} />
          <View style={[styles.mapPoint, styles.mapPointStart]}><Text style={styles.mapPointText}>I</Text></View>
          <View style={[styles.mapPoint, styles.mapPointOne]}><Text style={styles.mapPointText}>1</Text></View>
          <View style={[styles.mapPoint, styles.mapPointTwo]}><Text style={styles.mapPointText}>2</Text></View>
          <View style={[styles.mapPoint, styles.mapPointFinish]}><Text style={styles.mapPointText}>F</Text></View>
          <View style={styles.mapLabel}><Text style={styles.mapEyebrow}>RECORRIDO CONCEPTUAL</Text><Text style={styles.mapTitle}>{MOCK_ROUTE.title}</Text><Text style={styles.mapCaption}>Sin cartografía ni datos de ubicación</Text></View>
          <View style={styles.hudOverlay}>
            <AdventureHud state={state} checkpointTotal={MOCK_ROUTE.checkpoints.length} nextDiscovery={nextDiscovery} activeObjective={activeObjective} />
          </View>
        </View>

        <GameEventFeedback feedback={feedback} />

        <View style={styles.disclosure}>
          <Text style={styles.disclosureTag}>CONTENIDO FICTICIO</Text>
          <Text style={styles.disclosureText}>{MOCK_ROUTE.disclosure}</Text>
        </View>

        <SectionHeader title="Controles de simulación" subtitle="Cada acción emite GameEvent local" />
        <View style={styles.actionGrid}>
          <ActionButton icon="▶" title="Iniciar aventura" onPress={startAdventure} />
          <ActionButton icon="⌖" title="Aproximar checkpoint" onPress={() => approachCheckpoint(firstCheckpoint.id)} />
          <ActionButton icon="✓" title="Alcanzar checkpoint" onPress={() => reachCheckpoint(firstCheckpoint.id)} />
          <ActionButton icon="✧" title="Simular +150 XP" onPress={() => { awardXp(150, 'XP de prueba'); show('+150 XP', `Nivel actual · ${level.name}`, 'xp'); }} />
          <ActionButton icon="◇" title="Desbloquear reto" onPress={unlockFirstChallenge} />
          <ActionButton icon="❧" title="Encontrar objeto" onPress={findFirstCollectible} />
          <ActionButton icon="↗" title="Avanzar progreso" onPress={() => { const percent = Math.min(100, state.progressPercent + 20); emit({ type: 'ROUTE_PROGRESS', percent, distanceKm: state.distanceKm + 0.8, elapsedMinutes: state.elapsedMinutes + 12 }); show('Progreso actualizado', `${percent}% · distancia y tiempo simulados`, 'default'); }} />
          <ActionButton icon="▣" title="Completar ruta" onPress={completeAdventure} prominent disabled={state.completed} />
          <ActionButton icon="↺" title="Reset completo" onPress={resetPlayground} disabled={resetDisabled} />
        </View>
        <Pressable accessibilityRole="button" style={styles.sequenceButton} onPress={runDemoSequence}>
          <Text style={styles.sequenceIcon}>✦</Text>
          <View style={styles.sequenceCopy}><Text style={styles.sequenceTitle}>Reproducir aventura completa</Text><Text style={styles.sequenceSubtitle}>Secuencia MOCK determinista · reset para repetir desde cero</Text></View>
          <Text style={styles.sequenceArrow}>→</Text>
        </Pressable>

        <SectionHeader title="Checkpoints" subtitle="Cambia manualmente los cinco estados" />
        {MOCK_ROUTE.checkpoints.map((checkpoint) => (
          <CheckpointCard
            key={checkpoint.id}
            checkpoint={checkpoint}
            state={state.checkpointStates[checkpoint.id] ?? 'LOCKED'}
            onStateChange={(nextState) => {
              emit({ type: 'CHECKPOINT_STATE_SET', checkpointId: checkpoint.id, state: nextState });
              show('Estado actualizado', `${checkpoint.title} · ${nextState}`, 'checkpoint');
            }}
          />
        ))}

        <SectionHeader title="Discovery System" subtitle="Categorías listas para contenido verificado o demo" />
        {MOCK_DISCOVERIES.map((discovery) => (
          <DiscoveryCard
            key={discovery.id}
            discovery={discovery}
            discovered={state.discoveries.includes(discovery.id)}
            onPress={() => unlockDiscovery(discovery.id)}
          />
        ))}

        <SectionHeader title="Insignias" subtitle="Desbloqueo manual para validar el efecto" />
        <View style={styles.badgeGrid}>
          {MOCK_BADGES.map((badge) => (
            <BadgeRewardCard key={badge.id} badge={badge} unlocked={state.badges.includes(badge.id)} onUnlock={() => unlockBadge(badge.id)} />
          ))}
        </View>

        <SectionHeader title="Ruta piloto" subtitle="Itinerario ficticio · no usar para navegación" />
        <View style={styles.routeCard}>
          {MOCK_ROUTE.steps.map((step, index) => (
            <View key={step.id} style={styles.routeStepRow}>
              <View style={styles.routeRail}>
                <View style={[styles.routeNode, index === 0 && styles.routeNodeStart, index === MOCK_ROUTE.steps.length - 1 && styles.routeNodeFinish]} />
                {index < MOCK_ROUTE.steps.length - 1 ? <View style={styles.routeStem} /> : null}
              </View>
              <Text style={styles.routeStepLabel}>{step.label}</Text>
              <Text style={styles.routeStepKind}>{step.kind.toUpperCase()}</Text>
            </View>
          ))}
        </View>

        <View style={styles.systemCard}>
          <Text style={styles.systemTitle}>Frontera de integración</Text>
          <Text style={styles.systemBody}>Adventure Engine → GameEventListener → reduceGameEvent → HUD / FX / Rewards. Este playground emite los mismos contratos de forma local y simulada. No solicita permisos ni importa módulos GPS.</Text>
          <Text style={styles.systemMeta}>Nivel actual · {level.name} · {state.xp} XP · {state.eventHistory.length} eventos recientes</Text>
          {state.eventHistory.slice(-4).reverse().map((event, index) => (
            <Text key={`${event.type}-${state.eventHistory.length - index}`} style={styles.eventLine}>• {event.type}</Text>
          ))}
        </View>
        <View style={styles.bottomSpace} />
      </ScrollView>
    </SafeAreaView>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  return <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>{title}</Text><Text style={styles.sectionSubtitle}>{subtitle}</Text></View>;
}

function ActionButton({ icon, title, onPress, prominent = false, disabled = false }: { icon: string; title: string; onPress: () => void; prominent?: boolean; disabled?: boolean }) {
  return (
    <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={[styles.actionButton, prominent && styles.actionButtonProminent, disabled && styles.actionButtonDisabled]}>
      <Text style={[styles.actionIcon, prominent && styles.actionIconProminent]}>{icon}</Text>
      <Text numberOfLines={2} ellipsizeMode="tail" style={[styles.actionTitle, prominent && styles.actionTitleProminent]}>{title}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[16], paddingVertical: spacing[12], backgroundColor: colors.warmBackground },
  backButton: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  backText: { color: colors.olive900, fontSize: 22, fontWeight: '900' },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.olive700, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  headerTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 2 },
  demoPill: { borderRadius: radius.pill, paddingHorizontal: spacing[12], paddingVertical: spacing[8], backgroundColor: colors.aoveGold },
  demoPillText: { color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  content: { paddingHorizontal: spacing[16], paddingBottom: spacing[24] },
  intro: { color: colors.muted, fontSize: 12, lineHeight: 18, marginBottom: spacing[12] },
  mapPreview: { height: 300, borderRadius: radius.lg, backgroundColor: '#304A3B', overflow: 'hidden', position: 'relative', marginBottom: spacing[16] },
  terrainRingOne: { position: 'absolute', top: -76, right: -25, width: 250, height: 190, borderWidth: 1, borderColor: 'rgba(213, 211, 177, 0.18)', borderRadius: 120, transform: [{ rotate: '-25deg' }] },
  terrainRingTwo: { position: 'absolute', top: -46, right: 14, width: 200, height: 146, borderWidth: 1, borderColor: 'rgba(213, 211, 177, 0.2)', borderRadius: 100, transform: [{ rotate: '-25deg' }] },
  terrainRingThree: { position: 'absolute', top: -17, right: 51, width: 148, height: 103, borderWidth: 1, borderColor: 'rgba(213, 211, 177, 0.24)', borderRadius: 75, transform: [{ rotate: '-25deg' }] },
  routeSegmentOne: { position: 'absolute', left: '20%', top: 94, width: '24%', height: 3, backgroundColor: '#D7B66E', transform: [{ rotate: '22deg' }] },
  routeSegmentTwo: { position: 'absolute', left: '39%', top: 109, width: '24%', height: 3, backgroundColor: '#D7B66E', transform: [{ rotate: '-36deg' }] },
  routeSegmentThree: { position: 'absolute', left: '59%', top: 93, width: '20%', height: 3, backgroundColor: '#D7B66E', transform: [{ rotate: '24deg' }] },
  mapPoint: { position: 'absolute', width: 23, height: 23, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 2, borderColor: '#D7B66E', alignItems: 'center', justifyContent: 'center' },
  mapPointText: { color: colors.olive900, fontSize: 9, fontWeight: '900' },
  mapPointStart: { top: 112, left: '14%' }, mapPointOne: { top: 123, left: '39%' }, mapPointTwo: { top: 84, left: '61%' }, mapPointFinish: { top: 116, left: '80%' },
  mapLabel: { position: 'absolute', left: spacing[16], top: spacing[16] },
  mapEyebrow: { color: '#E9D7A6', fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  mapTitle: { color: colors.white, fontSize: 15, fontWeight: '900', marginTop: 3 },
  mapCaption: { color: '#D7DFD3', fontSize: 9, marginTop: 2 },
  hudOverlay: { position: 'absolute', left: spacing[12], right: spacing[12], bottom: spacing[12] },
  disclosure: { backgroundColor: '#F0E8D8', borderRadius: radius.md, padding: spacing[12], borderLeftWidth: 3, borderLeftColor: colors.aoveGold },
  disclosureTag: { color: colors.earth, fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  disclosureText: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: spacing[4] },
  sectionHeader: { marginTop: spacing[24], marginBottom: spacing[8] },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: 11, marginTop: 3 },
  actionGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  actionButton: { width: '48.5%', minHeight: 66, flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing[12], marginTop: spacing[8] },
  actionButtonProminent: { backgroundColor: colors.olive900, borderColor: colors.olive900 },
  actionButtonDisabled: { backgroundColor: '#EEEAE1', borderColor: colors.border, opacity: 0.65 },
  actionIcon: { color: colors.earth, fontSize: 19, fontWeight: '900', marginRight: spacing[8] },
  actionIconProminent: { color: colors.aoveGold },
  actionTitle: { flex: 1, color: colors.ink, fontSize: 10, fontWeight: '900' },
  actionTitleProminent: { color: colors.white },
  sequenceButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.limestone, borderRadius: radius.md, padding: spacing[12], marginTop: spacing[12] },
  sequenceIcon: { color: colors.earth, fontSize: 20, marginRight: spacing[12] },
  sequenceCopy: { flex: 1 },
  sequenceTitle: { color: colors.ink, fontSize: 11, fontWeight: '900' },
  sequenceSubtitle: { color: colors.muted, fontSize: 9, marginTop: 3 },
  sequenceArrow: { color: colors.olive900, fontSize: 20, fontWeight: '900' },
  badgeGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginTop: spacing[8] },
  routeCard: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.lg, paddingHorizontal: spacing[16], paddingVertical: spacing[12] },
  routeStepRow: { minHeight: 36, flexDirection: 'row', alignItems: 'center' },
  routeRail: { width: 22, alignItems: 'center', height: 36, justifyContent: 'center', marginRight: spacing[8] },
  routeNode: { width: 11, height: 11, borderRadius: radius.pill, backgroundColor: colors.limestone, borderWidth: 2, borderColor: colors.olive700, zIndex: 1 },
  routeNodeStart: { backgroundColor: colors.olive700 },
  routeNodeFinish: { backgroundColor: colors.aoveGold, borderColor: colors.aoveGold },
  routeStem: { position: 'absolute', top: 23, height: 19, width: 2, backgroundColor: colors.border },
  routeStepLabel: { flex: 1, color: colors.ink, fontSize: 11, fontWeight: '800' },
  routeStepKind: { color: colors.muted, fontSize: 8, fontWeight: '800' },
  systemCard: { backgroundColor: colors.olive900, borderRadius: radius.lg, padding: spacing[16], marginTop: spacing[24] },
  releaseNotice: { flex: 1, justifyContent: 'center', padding: spacing[24] },
  releaseCopy: { color: colors.muted, fontSize: 14, lineHeight: 21, marginTop: spacing[8] },
  releaseButton: { alignSelf: 'flex-start', marginTop: spacing[20], backgroundColor: colors.olive900, borderRadius: radius.md, paddingHorizontal: spacing[16], paddingVertical: spacing[12] },
  releaseButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  systemTitle: { color: colors.aoveGold, fontSize: 14, fontWeight: '900' },
  systemBody: { color: colors.limestone, fontSize: 11, lineHeight: 17, marginTop: spacing[8] },
  systemMeta: { color: colors.white, fontSize: 10, fontWeight: '800', marginTop: spacing[12] },
  eventLine: { color: colors.limestone, fontSize: 9, marginTop: spacing[4] },
  bottomSpace: { height: spacing[24] },
});
