import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CHECKPOINT_STATES, getExplorerLevel, type CheckpointState, type GameKitState } from './model';
import type { MockCheckpoint, MockDiscovery } from './mock-content';
import { colors, radius, spacing } from '../../theme/tokens';

export function AdventureHud({ state, checkpointTotal, nextDiscovery }: {
  state: GameKitState;
  checkpointTotal: number;
  nextDiscovery: string;
}) {
  const level = getExplorerLevel(state.xp);
  const checkpointsFound = Object.values(state.checkpointStates).filter(
    (checkpointState) => checkpointState === 'DISCOVERED' || checkpointState === 'COMPLETED',
  ).length;
  const nextLevel = [
    { xpRequired: 0 }, { xpRequired: 200 }, { xpRequired: 500 },
    { xpRequired: 900 }, { xpRequired: 1400 },
  ].find((candidate) => candidate.xpRequired > state.xp)?.xpRequired;
  const levelProgress = nextLevel === undefined
    ? 1
    : Math.max(0, Math.min(1, (state.xp - level.xpRequired) / (nextLevel - level.xpRequired)));
  return (
    <View style={styles.hud} accessibilityLabel="HUD de aventura simulada">
      <View style={styles.hudTop}>
        <View style={styles.hudTitleGroup}>
          <Text style={styles.eyebrow}>AVENTURA DEMO</Text>
          <Text style={styles.hudTitle}>{state.progressPercent}% <Text style={styles.hudMuted}>· progreso</Text></Text>
        </View>
        <View style={styles.levelChip}><Text style={styles.levelChipText}>{level.name}</Text></View>
      </View>
      <View style={styles.progressTrack} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: state.progressPercent }}>
        <View style={[styles.progressFill, { width: `${state.progressPercent}%` }]} />
      </View>
      <View style={styles.hudMetrics}>
        <Metric value={`${state.distanceKm.toFixed(1)} km`} label="distancia" />
        <Metric value={`${state.elapsedMinutes} min`} label="tiempo" />
        <Metric value={`${checkpointsFound}/${checkpointTotal}`} label="checkpoints" />
        <Metric value={`${state.xp} XP`} label="experiencia" />
      </View>
      <View style={styles.levelProgressRow}>
        <Text style={styles.levelProgressLabel}>Nivel {level.level} de 5</Text>
        <View style={styles.levelTrack}><View style={[styles.levelFill, { width: `${levelProgress * 100}%` }]} /></View>
        <Text style={styles.levelProgressLabel}>{nextLevel === undefined ? 'MAX' : `${nextLevel - state.xp} XP`}</Text>
      </View>
      <View style={styles.nextDiscovery}>
        <Text style={styles.nextDiscoveryIcon}>⌖</Text>
        <Text style={styles.nextDiscoveryCopy} numberOfLines={1}>Próximo descubrimiento · {nextDiscovery}</Text>
      </View>
    </View>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return <View style={styles.metric}><Text style={styles.metricValue}>{value}</Text><Text style={styles.metricLabel}>{label}</Text></View>;
}

export function DiscoveryCard({ discovery, discovered, onPress }: {
  discovery: MockDiscovery;
  discovered: boolean;
  onPress: () => void;
}) {
  return (
    <View style={styles.discoveryCard}>
      <View style={styles.discoveryIcon}><Text style={styles.discoveryGlyph}>{discovery.icon}</Text></View>
      <View style={styles.discoveryCopy}>
        <Text style={styles.discoveryCategory}>{discovery.category.toUpperCase()} · MOCK</Text>
        <Text style={styles.discoveryTitle}>{discovery.title}</Text>
        <Text style={styles.bodyText}>{discovery.description}</Text>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel={`${discovered ? 'Repetir' : 'Simular'} descubrimiento ${discovery.title}`} style={styles.smallButton} onPress={onPress}>
        <Text style={styles.smallButtonText}>{discovered ? 'Repetir' : 'Descubrir'}</Text>
      </Pressable>
    </View>
  );
}

export function CheckpointCard({ checkpoint, state, onStateChange }: {
  checkpoint: MockCheckpoint;
  state: CheckpointState;
  onStateChange: (state: CheckpointState) => void;
}) {
  const currentIndex = CHECKPOINT_STATES.indexOf(state);
  return (
    <View style={styles.checkpointCard}>
      <View style={styles.checkpointDot}><Text style={styles.checkpointDotText}>{state === 'COMPLETED' ? '✓' : '⌖'}</Text></View>
      <View style={styles.checkpointCopy}>
        <Text style={styles.checkpointTitle}>{checkpoint.title}</Text>
        <Text style={styles.checkpointSubtitle}>{checkpoint.subtitle}</Text>
      </View>
      <View style={styles.stateActions}>
        <Text style={styles.stateLabel}>{state}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel={`Cambiar estado de ${checkpoint.title}`} onPress={() => onStateChange(CHECKPOINT_STATES[(currentIndex + 1) % CHECKPOINT_STATES.length]!)}>
          <Text style={styles.stateChange}>Cambiar ›</Text>
        </Pressable>
      </View>
    </View>
  );
}

export function BadgeRewardCard({ badge, unlocked, onUnlock }: {
  badge: { id: string; title: string; description: string; icon: string };
  unlocked: boolean;
  onUnlock: () => void;
}) {
  return (
    <View style={[styles.badgeCard, unlocked && styles.badgeUnlocked]}>
      <View style={[styles.badgeIcon, unlocked && styles.badgeIconUnlocked]}><Text style={styles.badgeGlyph}>{badge.icon}</Text></View>
      <Text style={styles.badgeTitle}>{badge.title}</Text>
      <Text style={styles.badgeDescription}>{unlocked ? 'Desbloqueada · MOCK' : badge.description}</Text>
      <Pressable accessibilityRole="button" onPress={onUnlock} style={styles.badgeButton}><Text style={styles.badgeButtonText}>{unlocked ? 'Repetir efecto' : 'Desbloquear'}</Text></Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  hud: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[16], borderWidth: 1, borderColor: colors.border },
  hudTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  hudTitleGroup: { flex: 1 },
  eyebrow: { color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  hudTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: 2 },
  hudMuted: { color: colors.muted, fontSize: 12, fontWeight: '700' },
  levelChip: { backgroundColor: colors.olive900, borderRadius: radius.pill, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  levelChipText: { color: colors.white, fontSize: 10, fontWeight: '900' },
  progressTrack: { height: 7, backgroundColor: colors.limestone, borderRadius: radius.pill, overflow: 'hidden', marginTop: spacing[12] },
  progressFill: { height: '100%', backgroundColor: colors.olive500, borderRadius: radius.pill },
  hudMetrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[16] },
  metric: { minWidth: 58 },
  metricValue: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 9, marginTop: 2 },
  levelProgressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[12] },
  levelProgressLabel: { color: colors.muted, fontSize: 9, fontWeight: '700' },
  levelTrack: { height: 4, flex: 1, backgroundColor: colors.limestone, borderRadius: radius.pill, overflow: 'hidden' },
  levelFill: { height: '100%', backgroundColor: colors.aoveGold },
  nextDiscovery: { flexDirection: 'row', alignItems: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12], marginTop: spacing[12] },
  nextDiscoveryIcon: { fontSize: 16, color: colors.earth, marginRight: spacing[8] },
  nextDiscoveryCopy: { color: colors.olive900, fontSize: 11, fontWeight: '800', flex: 1 },
  discoveryCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing[12], marginTop: spacing[8] },
  discoveryIcon: { width: 38, height: 38, borderRadius: radius.sm, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  discoveryGlyph: { fontSize: 20, color: colors.olive900 },
  discoveryCopy: { flex: 1 },
  discoveryCategory: { fontSize: 8, fontWeight: '900', letterSpacing: 1, color: colors.earth },
  discoveryTitle: { fontSize: 13, fontWeight: '900', color: colors.ink, marginTop: 2 },
  bodyText: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: 3 },
  smallButton: { backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8], borderRadius: radius.pill, marginLeft: spacing[8] },
  smallButtonText: { color: colors.white, fontWeight: '800', fontSize: 9 },
  checkpointCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing[12], marginTop: spacing[8] },
  checkpointDot: { width: 34, height: 34, borderRadius: radius.pill, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  checkpointDotText: { color: colors.olive900, fontSize: 16, fontWeight: '900' },
  checkpointCopy: { flex: 1 },
  checkpointTitle: { color: colors.ink, fontSize: 12, fontWeight: '900' },
  checkpointSubtitle: { color: colors.muted, fontSize: 9, marginTop: 2 },
  stateActions: { alignItems: 'flex-end' },
  stateLabel: { color: colors.olive700, fontSize: 9, fontWeight: '900' },
  stateChange: { color: colors.earth, fontSize: 9, fontWeight: '800', marginTop: spacing[4] },
  badgeCard: { width: '48%', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing[12], alignItems: 'center', marginBottom: spacing[8] },
  badgeUnlocked: { borderColor: colors.aoveGold, backgroundColor: '#FBF6E9' },
  badgeIcon: { width: 42, height: 42, borderRadius: radius.pill, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center' },
  badgeIconUnlocked: { backgroundColor: colors.aoveGold },
  badgeGlyph: { color: colors.olive900, fontSize: 21 },
  badgeTitle: { color: colors.ink, fontSize: 11, fontWeight: '900', marginTop: spacing[8], textAlign: 'center' },
  badgeDescription: { color: colors.muted, fontSize: 9, marginTop: 3, textAlign: 'center' },
  badgeButton: { paddingHorizontal: spacing[8], paddingVertical: spacing[8] },
  badgeButtonText: { color: colors.olive700, fontWeight: '900', fontSize: 9 },
});
