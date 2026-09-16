import { router } from 'expo-router';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentOliveTreeDashboard } from '../../src/features/rewards/development-rewards-data';
import { buildOliveTreeDashboardModel } from '../../src/features/rewards/olive-tree-dashboard-model';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

const model = buildOliveTreeDashboardModel(developmentOliveTreeDashboard);

function OliveTreeIllustration() {
  return (
    <View accessibilityLabel="Olivo en crecimiento" style={styles.scene}>
      <View style={styles.sun} />
      <View style={styles.hill} />
      <View style={styles.treeShadow} />
      <View style={styles.trunk} />
      <View style={[styles.canopy, styles.canopyLeft]} />
      <View style={[styles.canopy, styles.canopyRight]} />
      <View style={[styles.canopy, styles.canopyTop]} />
      <View style={[styles.olive, styles.oliveLeft]} />
      <View style={[styles.olive, styles.oliveCenter]} />
      <View style={[styles.olive, styles.oliveRight]} />
    </View>
  );
}

function DashboardAction({
  action,
}: {
  action: (typeof model.actions)[number];
}) {
  const active = action.id === 'rewards';

  return (
    <Pressable
      accessibilityRole={active ? 'button' : undefined}
      disabled={!active}
      onPress={active ? () => router.push('/rewards') : undefined}
      style={({ pressed }) => [
        styles.actionCard,
        pressed && active ? styles.pressed : null,
      ]}
    >
      <Text style={styles.actionGlyph}>
        {action.id === 'rewards'
          ? '🫒'
          : action.id === 'customize'
            ? '✦'
            : action.id === 'history'
              ? '◌'
              : '⌁'}
      </Text>
      <Text style={styles.actionTitle}>{action.label}</Text>
      <Text style={styles.actionBody}>{action.description}</Text>
      <Text style={active ? styles.actionLink : styles.actionSoon}>
        {active ? 'Abrir →' : 'Próximamente'}
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
        <View style={styles.header}>
          <View style={styles.headerCopy}>
            <Text style={styles.kicker}>MÁGINA · PROGRESO</Text>
            <Text style={styles.title}>{model.title}</Text>
          </View>
          <Pressable
            accessibilityLabel="Abrir recompensas"
            accessibilityRole="button"
            onPress={() => router.push('/rewards')}
            style={({ pressed }) => [styles.balancePill, pressed ? styles.pressed : null]}
          >
            <Text style={styles.balanceText}>🫒 {model.availableOlivesLabel}</Text>
          </Pressable>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroHeading}>
            <Text style={styles.heroEyebrow}>ETAPA ACTUAL</Text>
            <Text style={styles.heroTitle}>{model.stageLabel}</Text>
            <Text style={styles.heroLevel}>{model.levelLabel}</Text>
          </View>

          <OliveTreeIllustration />

          <View style={styles.progressSection}>
            <View style={styles.progressRow}>
              <Text style={styles.progressLabel}>Crecimiento permanente</Text>
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
          <View style={styles.walletTop}>
            <View style={styles.walletCopy}>
              <Text style={styles.sectionEyebrow}>TU COSECHA</Text>
              <Text style={styles.walletTitle}>Aceitunas disponibles</Text>
            </View>
            <Text style={styles.walletAmount}>{model.availableOlivesLabel} 🫒</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.metricRow}>
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{model.reservedOlivesLabel}</Text>
              <Text style={styles.metricLabel}>Pendientes de canje</Text>
            </View>
            <View style={styles.metricDivider} />
            <View style={styles.metric}>
              <Text style={styles.metricValue}>{model.collectionLabel}</Text>
              <Text style={styles.metricLabel}>Colección digital</Text>
            </View>
          </View>

          <Text style={styles.history}>{model.historyLabel}</Text>
          <Text style={styles.note}>
            Gastar aceitunas no reduce tu nivel ni hace retroceder el olivo.
          </Text>
        </View>

        <View style={styles.sectionHeading}>
          <Text style={styles.sectionEyebrow}>TU ESPACIO</Text>
          <Text style={styles.sectionTitle}>Hazlo crecer a tu manera</Text>
        </View>

        <View style={styles.actionGrid}>
          {model.actions.map((action) => (
            <DashboardAction action={action} key={action.id} />
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoGlyph}>✦</Text>
          <View style={styles.infoCopy}>
            <Text style={styles.infoTitle}>Tu olivo cuenta tu historia</Text>
            <Text style={styles.infoBody}>
              Las aventuras verificadas hacen crecer el árbol y pueden darte
              aceitunas. El árbol conserva tu progreso; las aceitunas son la
              recompensa que puedes gastar.
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    paddingVertical: spacing[16],
  },
  headerCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: 3,
  },
  balancePill: {
    backgroundColor: colors.white,
    borderRadius: radius.pill,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing[12],
    paddingVertical: 9,
    ...shadow.card,
  },
  balanceText: {
    color: colors.olive900,
    fontSize: 13,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.78,
  },
  heroCard: {
    overflow: 'hidden',
    backgroundColor: colors.olive900,
    borderRadius: radius.lg,
    ...shadow.card,
  },
  heroHeading: {
    paddingHorizontal: spacing[24],
    paddingTop: spacing[24],
    zIndex: 2,
  },
  heroEyebrow: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 28,
    fontWeight: '900',
    marginTop: spacing[4],
  },
  heroLevel: {
    color: colors.limestone,
    fontSize: 13,
    fontWeight: '600',
    marginTop: spacing[4],
  },
  scene: {
    height: 270,
    marginTop: -8,
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    right: 34,
    top: 38,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: colors.aoveGold,
    opacity: 0.76,
  },
  hill: {
    position: 'absolute',
    left: -60,
    right: -70,
    bottom: -38,
    height: 145,
    borderRadius: 90,
    backgroundColor: colors.earth,
    opacity: 0.58,
    transform: [{ rotate: '3deg' }],
  },
  treeShadow: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 44,
    width: 172,
    height: 24,
    borderRadius: 86,
    backgroundColor: colors.ink,
    opacity: 0.25,
  },
  trunk: {
    position: 'absolute',
    alignSelf: 'center',
    bottom: 58,
    width: 34,
    height: 126,
    borderRadius: 16,
    backgroundColor: '#79563D',
    transform: [{ rotate: '2deg' }],
  },
  canopy: {
    position: 'absolute',
    borderRadius: 80,
    backgroundColor: colors.olive500,
  },
  canopyLeft: {
    width: 132,
    height: 106,
    left: '15%',
    top: 66,
  },
  canopyRight: {
    width: 136,
    height: 110,
    right: '14%',
    top: 63,
  },
  canopyTop: {
    width: 126,
    height: 112,
    alignSelf: 'center',
    top: 31,
    backgroundColor: colors.olive700,
  },
  olive: {
    position: 'absolute',
    width: 8,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#28392B',
  },
  oliveLeft: { left: '34%', top: 100 },
  oliveCenter: { left: '49%', top: 69 },
  oliveRight: { right: '29%', top: 112 },
  progressSection: {
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[24],
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[8],
  },
  progressLabel: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '700',
  },
  progressValue: {
    color: colors.aoveGold,
    fontSize: 14,
    fontWeight: '900',
  },
  progressTrack: {
    height: 8,
    overflow: 'hidden',
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.16)',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
    backgroundColor: colors.aoveGold,
  },
  milestone: {
    color: colors.limestone,
    fontSize: 11,
    fontWeight: '600',
    marginTop: spacing[8],
  },
  walletCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing[20],
    marginTop: spacing[16],
    ...shadow.card,
  },
  walletTop: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing[12],
  },
  walletCopy: {
    flex: 1,
  },
  sectionEyebrow: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  walletTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  walletAmount: {
    color: colors.olive900,
    fontSize: 21,
    fontWeight: '900',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginVertical: spacing[16],
  },
  metricRow: {
    flexDirection: 'row',
  },
  metric: {
    flex: 1,
  },
  metricDivider: {
    width: StyleSheet.hairlineWidth,
    backgroundColor: colors.border,
    marginHorizontal: spacing[12],
  },
  metricValue: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '800',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  history: {
    color: colors.olive700,
    fontSize: 12,
    fontWeight: '700',
    marginTop: spacing[16],
  },
  note: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing[4],
  },
  sectionHeading: {
    marginTop: spacing[32],
    marginBottom: spacing[12],
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
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
    minHeight: 170,
    borderRadius: radius.md,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.white,
    padding: spacing[16],
  },
  actionGlyph: {
    color: colors.olive900,
    fontSize: 18,
    marginBottom: spacing[12],
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  actionBody: {
    flexGrow: 1,
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: spacing[4],
  },
  actionLink: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '900',
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
    gap: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.limestone,
    padding: spacing[16],
    marginTop: spacing[24],
  },
  infoGlyph: {
    color: colors.aoveGold,
    fontSize: 18,
    fontWeight: '900',
  },
  infoCopy: {
    flex: 1,
  },
  infoTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  infoBody: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: spacing[4],
  },
});
