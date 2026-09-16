import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentOliveTreeDashboard } from '../../src/features/rewards/development-rewards-data';
import { buildOliveTreeDashboardModel } from '../../src/features/rewards/olive-tree-dashboard-model';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

const model = buildOliveTreeDashboardModel(developmentOliveTreeDashboard);

function OliveTreeScene() {
  return (
    <View accessibilityLabel="Olivo en crecimiento" style={styles.scene}>
      <View style={styles.sun} />
      <View style={styles.hillBack} />
      <View style={styles.hillFront} />
      <View style={styles.treeShadow} />
      <View style={styles.trunk} />
      <View style={[styles.branch, styles.branchLeft]} />
      <View style={[styles.branch, styles.branchRight]} />
      <View style={[styles.canopy, styles.canopyLeft]} />
      <View style={[styles.canopy, styles.canopyRight]} />
      <View style={[styles.canopy, styles.canopyTop]} />
      <View style={[styles.oliveDot, styles.oliveOne]} />
      <View style={[styles.oliveDot, styles.oliveTwo]} />
      <View style={[styles.oliveDot, styles.oliveThree]} />
      <View style={[styles.oliveDot, styles.oliveFour]} />
    </View>
  );
}

function ActionCard({
  action,
}: {
  action: (typeof model.actions)[number];
}) {
  const isRewards = action.id === 'rewards';

  return (
    <Pressable
      accessibilityRole={isRewards ? 'button' : undefined}
      disabled={!isRewards}
      onPress={isRewards ? () => router.push('/rewards') : undefined}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && isRewards ? styles.actionCardPressed : null,
      ]}
    >
      <View style={styles.actionIconShell}>
        <Text style={styles.actionIcon}>
          {action.id === 'rewards'
            ? '🫒'
            : action.id === 'customize'
              ? '✦'
              : action.id === 'history'
                ? '◌'
                : '⌁'}
        </Text>
      </View>
      <Text style={styles.actionTitle}>{action.label}</Text>
      <Text style={styles.actionDescription}>{action.description}</Text>
      <Text style={isRewards ? styles.actionLink : styles.actionSoon}>
        {isRewards ? 'Abrir →' : 'Próximamente'}
      </Text>
    </Pressable>
  );
}

export default function OliveTreeScreen() {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.kicker}>MÁGINA · PROGRESO</Text>
            <Text style={styles.title}>{model.title}</Text>
          </View>
          <Pressable
            accessibilityLabel="Abrir recompensas"
            accessibilityRole="button"
            onPress={() => router.push('/rewards')}
            style={styles.balancePill}
          >
            <Text style={styles.balancePillIcon}>🫒</Text>
            <Text style={styles.balancePillText}>{model.availableOlivesLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroCopy}>
            <Text style={styles.stageEyebrow}>ETAPA ACTUAL</Text>
            <Text style={styles.stageTitle}>{model.stageLabel}</Text>
            <Text style={styles.levelLabel}>{model.levelLabel}</Text>
          </View>

          <OliveTreeScene />

          <View style={styles.progressBlock}>
            <View style={styles.progressHeader}>
              <Text style={styles.progressTitle}>Crecimiento permanente</Text>
              <Text style={styles.progressValue}>{model.progressPercentage}%</Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${model.progressPercentage}%` },
                ]}
              />
            </View>
            <Text style={styles.milestone}>{model.nextMilestoneLabel}</Text>
          </View>
        </View>

        <View style={styles.walletCard}>
          <View style={styles.walletHeader}>
            <View>
              <Text style={styles.sectionEyebrow}>TU COSECHA</Text>
              <Text style={styles.walletTitle}>Aceitunas disponibles</Text>
            </View>
            <Text style={styles.walletAmount}>{model.availableOlivesLabel} 🫒</Text>
          </View>

          <View style={styles.walletDivider} />

          <View style={styles.walletMetrics}>
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{model.reservedOlivesLabel}</Text>
              <Text style={styles.metricLabel}>Pendientes de canje</Text>
            </View>
            <View style={styles.metricSeparator} />
            <View style={styles.metricBlock}>
              <Text style={styles.metricValue}>{model.collectionLabel}</Text>
              <Text style={styles.metricLabel}>Colección digital</Text>
            </View>
          </View>

          <Text style={styles.walletHistory}>{model.historyLabel}</Text>
          <Text style={styles.walletNote}>
            Gastar aceitunas no reduce el nivel ni hace retroceder tu olivo.
          </Text>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionEyebrow}>TU ESPACIO</Text>
            <Text style={styles.sectionTitle}>Hazlo crecer a tu manera</Text>
          </View>
        </View>

        <View style={styles.actionGrid}>
          {model.actions.map((action) => (
            <ActionCard action={action} key={action.id} />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>✦</Text>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Tu olivo cuenta tu historia</Text>
            <Text style={styles.infoBody}>
              Las aventuras verificadas hacen crecer el árbol y pueden darte
              aceitunas. El árbol conserva para siempre tu progreso; las
              aceitunas son la recompensa que puedes gastar.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[40],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    paddingTop: spacing[16],
    paddingBottom: spacing[20],
  },
  kicker: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.8,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '800',
    marginTop: 3,
  },
  balancePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[4],
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[12],
    paddingVertical: 9,
    ...shadow.card,
  },
  balancePillIcon: {
    fontSize: 14,
  },
  balancePillText: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: colors.olive900,
    borderRadius: radius.lg,
    minHeight: 500,
    ...shadow.card,
  },
  heroCopy: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[24],
    zIndex: 4,
  },
  stageEyebrow: {
    color: colors.limestone,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.8,
    opacity: 0.8,
  },
  stageTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '800',
    marginTop: spacing[4],
  },
  levelLabel: {
    color: colors.limestone,
    fontSize: 14,
    fontWeight: '600',
    marginTop: spacing[4],
  },
  scene: {
    height: 290,
    marginTop: -12,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    right: 34,
    top: 34,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.aoveGold,
    opacity: 0.76,
  },
  hillBack: {
    position: 'absolute',
    left: -80,
    right: -30,
    bottom: 22,
    height: 130,
    borderRadius: 100,
    backgroundColor: colors.olive700,
    opacity: 0.5,
    transform: [{ rotate: '-5deg' }],
  },
  hillFront: {
    position: 'absolute',
    left: -50,
    right: -90,
    bottom: -34,
    height: 140,
    borderRadius: 100,
    backgroundColor: colors.earth,
    opacity: 0.58,
    transform: [{ rotate: '4deg' }],
  },
  treeShadow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 38,
    width: 180,
    height: 28,
    borderRadius: 90,
    backgroundColor: colors.ink,
    opacity: 0.28,
  },
  trunk: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 55,
    width: 34,
    height: 130,
    borderRadius: 16,
    backgroundColor: '#79563D',
    transform: [{ rotate: '2deg' }],
  },
  branch: {
    position: 'absolute',
    alignSelf: 'center',
    width: 16,
    height: 90,
    borderRadius: 8,
    backgroundColor: '#79563D',
    bottom: 118,
  },
  branchLeft: {
    marginLeft: -52,
    transform: [{ rotate: '-44deg' }],
  },
  branchRight: {
    marginLeft: 52,
    transform: [{ rotate: '44deg' }],
  },
  canopy: {
    position: 'absolute',
    backgroundColor: colors.olive500,
    borderRadius: 80,
  },
  canopyLeft: {
    width: 132,
    height: 112,
    left: '16%',
    top: 64,
    transform: [{ rotate: '-7deg' }],
  },
  canopyRight: {
    width: 138,
    height: 116,
    right: '14%',
    top: 60,
    transform: [{ rotate: '8deg' }],
  },
  canopyTop: {
    width: 126,
    height: 118,
    alignSelf: 'center',
    top: 28,
    backgroundColor: colors.olive700,
  },
  oliveDot: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28392B',
    zIndex: 3,
  },
  oliveOne: { left: '35%', top: 90 },
  oliveTwo: { right: '34%', top: 104 },
  oliveThree: { left: '46%', top: 56 },
  oliveFour: { right: '26%', top: 132 },
  progressBlock: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[24],
    marginTop: -6,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  progressTitle: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
  },
  progressValue: {
    color: colors.aoveGold,
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.aoveGold,
  },
  milestone: {
    color: colors.limestone,
    marginTop: spacing[8],
    fontSize: 12,
    fontWeight: '600',
    opacity: 0.9,
  },
  walletCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[20],
    marginTop: spacing[16],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    ...shadow.card,
  },
  walletHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    gap: spacing[12],
  },
  sectionEyebrow: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  walletTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '750',
    marginTop: 2,
  },
  walletAmount: {
    color: colors.olive900,
    fontSize: 22,
    fontWeight: '900',
  },
  walletDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing[16],
  },
  walletMetrics: {
    flexDirection: 'row',
    alignItems: 'stretch',
  },
  metricBlock: {
    flex: 1,
  },
  metricSeparator: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing[12],
  },
  metricValue: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  walletHistory: {
    color: colors.olive700,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing[16],
  },
  walletNote: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing[4],
  },
  sectionHeader: {
    marginTop: spacing[32],
    marginBottom: spacing[12],
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '800',
    marginTop: 2,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: spacing[12],
  },
  actionCard: {
    width: '48.3%',
    minHeight: 178,
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing[16],
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  actionCardPressed: {
    opacity: 0.82,
    transform: [{ scale: 0.985 }],
  },
  actionIconShell: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.limestone,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[12],
  },
  actionIcon: {
    fontSize: 16,
    color: colors.olive900,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  actionDescription: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing[4],
    flexGrow: 1,
  },
  actionLink: {
    color: colors.olive700,
    fontSize: 12,
    fontWeight: '800',
    marginTop: spacing[12],
  },
  actionSoon: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '700',
    marginTop: spacing[12],
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    backgroundColor: colors.limestone,
    borderRadius: radius.md,
    padding: spacing[16],
    marginTop: spacing[24],
  },
  infoIcon: {
    color: colors.aoveGold,
    fontSize: 20,
    fontWeight: '900',
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  infoBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[4],
  },
});
