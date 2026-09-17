import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../src/components/branding/BrandMark';
import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { AdventureLandscape } from '../src/components/visuals/AdventureLandscape';
import { brand } from '../src/theme/branding';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

const sections = [
  ['Mis rutas', 'Rutas guardadas y actividades'],
  ['Favoritos', 'Lugares que quieres conservar'],
  ['Logros', 'Progreso y reconocimientos'],
  ['Colecciones', 'Descubrimientos de Sierra Mágina'],
  ['Ajustes', 'Cuenta, privacidad y preferencias'],
] as const;

export default function ProfileScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.profileHeader}>
          <AdventureLandscape variant="prepare" />
          <View style={styles.profileHeaderCopy}>
            <BrandMark size={72} inverse />
            <Text style={styles.eyebrow}>{brand.identity.descriptor}</Text>
            <Text style={styles.title}>Tu perfil de aventura</Text>
            <Text style={styles.subtitle}>Tus rutas, logros y colecciones aparecerán aquí cuando estén asociados a actividad real de tu cuenta.</Text>
          </View>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>◎</Text></View>
          <View style={styles.levelCopy}>
            <Text style={styles.levelLabel}>TU HISTORIA EN MÁGINA</Text>
            <Text style={styles.levelTitle}>Preparado para empezar</Text>
            <Text style={styles.levelBody}>No mostramos niveles, XP ni logros inventados. El progreso se construirá con rutas y acciones reales.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat value="—" label="Rutas" />
          <Stat value="—" label="Logros" />
          <Stat value="—" label="Colecciones" />
        </View>

        <Text style={styles.sectionTitle}>Tu espacio</Text>
        <View style={styles.menu}>
          {sections.map(([title, subtitle]) => (
            <View key={title} style={styles.menuRow}>
              <View style={styles.menuDot} />
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
              </View>
              <View style={styles.pendingBadge}><Text style={styles.pendingText}>PRÓX.</Text></View>
            </View>
          ))}
        </View>

        <View style={styles.privacyCard}>
          <View style={styles.privacyIcon}><Text style={styles.privacyGlyph}>✓</Text></View>
          <View style={styles.privacyCopy}>
            <Text style={styles.privacyTitle}>Datos reales y bajo tu control</Text>
            <Text style={styles.privacyBody}>El perfil mostrará información personal únicamente cuando exista una cuenta y datos asociados.</Text>
          </View>
        </View>
      </ScrollView>
      <PrimaryTabBar active="Perfil" />
    </SafeAreaView>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: 126 },
  profileHeader: {
    minHeight: 292,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingHorizontal: spacing[24],
    paddingTop: spacing[24],
    paddingBottom: spacing[32],
    overflow: 'hidden',
  },
  profileHeaderCopy: { zIndex: 2, alignItems: 'center' },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing[12] },
  title: { color: colors.white, fontSize: typography.title, fontWeight: '900', marginTop: spacing[4], textAlign: 'center' },
  subtitle: { color: colors.limestone, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing[8], maxWidth: 340 },
  levelCard: {
    marginHorizontal: spacing[20],
    marginTop: -18,
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.card,
  },
  levelBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { color: colors.olive900, fontSize: 25, fontWeight: '900' },
  levelCopy: { flex: 1, marginLeft: spacing[16] },
  levelLabel: { color: colors.aoveGold, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  levelTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 2 },
  levelBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: spacing[4] },
  statsRow: {
    flexDirection: 'row',
    marginHorizontal: spacing[20],
    marginTop: spacing[16],
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing[16] },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  sectionTitle: { marginHorizontal: spacing[20], marginTop: spacing[24], color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  menu: {
    marginHorizontal: spacing[20],
    marginTop: spacing[12],
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.olive700 },
  menuCopy: { flex: 1, marginLeft: spacing[12] },
  menuTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  menuSubtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  pendingBadge: { borderRadius: radius.pill, backgroundColor: colors.oliveWash, paddingHorizontal: spacing[8], paddingVertical: 5 },
  pendingText: { color: colors.olive700, fontSize: 8, fontWeight: '900', letterSpacing: 0.6 },
  privacyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing[20],
    marginTop: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.limestone,
    padding: spacing[16],
  },
  privacyIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  privacyGlyph: { color: colors.white, fontSize: 16, fontWeight: '900' },
  privacyCopy: { flex: 1, marginLeft: spacing[12] },
  privacyTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  privacyBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
});
