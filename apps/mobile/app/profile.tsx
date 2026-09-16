import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../src/components/branding/BrandMark';
import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { brand } from '../src/theme/branding';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

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
          <BrandMark size={72} inverse />
          <Text style={styles.eyebrow}>{brand.identity.descriptor}</Text>
          <Text style={styles.title}>Tu perfil de aventura</Text>
          <Text style={styles.subtitle}>Aquí vivirán tu progreso, rutas, logros y colecciones cuando conectemos identidad y datos de usuario al candidate.</Text>
        </View>

        <View style={styles.levelCard}>
          <View style={styles.levelBadge}><Text style={styles.levelBadgeText}>1</Text></View>
          <View style={styles.levelCopy}>
            <Text style={styles.levelLabel}>PROGRESO</Text>
            <Text style={styles.levelTitle}>Preparado para empezar</Text>
            <Text style={styles.levelBody}>No mostramos XP, rutas ni logros ficticios. El progreso aparecerá cuando exista actividad real asociada a la cuenta.</Text>
          </View>
        </View>

        <View style={styles.statsRow}>
          <Stat value="—" label="Rutas" />
          <Stat value="—" label="Logros" />
          <Stat value="—" label="Colecciones" />
        </View>

        <View style={styles.menu}>
          {sections.map(([title, subtitle]) => (
            <View key={title} style={styles.menuRow}>
              <View style={styles.menuDot} />
              <View style={styles.menuCopy}>
                <Text style={styles.menuTitle}>{title}</Text>
                <Text style={styles.menuSubtitle}>{subtitle}</Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </View>
          ))}
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
  profileHeader: { backgroundColor: colors.olive900, alignItems: 'center', paddingHorizontal: spacing[24], paddingTop: spacing[24], paddingBottom: spacing[32] },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.8, marginTop: spacing[12] },
  title: { color: colors.white, fontSize: typography.title, fontWeight: '900', marginTop: spacing[4], textAlign: 'center' },
  subtitle: { color: colors.limestone, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing[8], maxWidth: 340 },
  levelCard: { marginHorizontal: spacing[20], marginTop: -16, borderRadius: radius.xl, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: spacing[20], flexDirection: 'row', alignItems: 'center' },
  levelBadge: { width: 54, height: 54, borderRadius: 27, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  levelBadgeText: { color: colors.olive900, fontSize: 22, fontWeight: '900' },
  levelCopy: { flex: 1, marginLeft: spacing[16] },
  levelLabel: { color: colors.aoveGold, fontSize: 8, fontWeight: '900', letterSpacing: 1.3 },
  levelTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginTop: 2 },
  levelBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: spacing[4] },
  statsRow: { flexDirection: 'row', marginHorizontal: spacing[20], marginTop: spacing[16], borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  stat: { flex: 1, alignItems: 'center', paddingVertical: spacing[16] },
  statValue: { color: colors.ink, fontSize: 20, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  menu: { marginHorizontal: spacing[20], marginTop: spacing[16], borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  menuRow: { minHeight: 66, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[16], borderBottomWidth: 1, borderBottomColor: colors.border },
  menuDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.olive700 },
  menuCopy: { flex: 1, marginLeft: spacing[12] },
  menuTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  menuSubtitle: { color: colors.muted, fontSize: 10, marginTop: 2 },
  chevron: { color: colors.olive700, fontSize: 24, marginLeft: spacing[8] },
});
