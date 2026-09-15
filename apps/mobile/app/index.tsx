import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentRoutes } from '../src/features/routes/fixtures';
import { difficultyLabel, durationLabel } from '../src/features/routes/route-utils';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

const filters = ['Todos', 'Fácil', 'Moderada', 'Difícil'] as const;
const navItems = [
  ['⌂', 'Rutas'],
  ['◇', 'Retos'],
  ['▦', 'Colecciones'],
  ['△', 'Ranking'],
  ['○', 'Perfil'],
] as const;

export default function RoutesHomeScreen() {
  const route = developmentRoutes[0];

  if (!route) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.eyebrow}>SIERRA MÁGINA · JAÉN</Text>
            <Text style={styles.brand}>Mágina Aventura</Text>
          </View>
          <View style={styles.profileBadge}>
            <Text style={styles.profileInitial}>M</Text>
          </View>
        </View>

        <View style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.mountainBack} />
          <View style={styles.mountainFront} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>TU PRÓXIMA AVENTURA</Text>
            <Text style={styles.heroTitle}>Camina. Descubre.{`\n`}Conquista Mágina.</Text>
            <Text style={styles.heroBody}>
              Rutas reales, retos y descubrimientos que solo se desbloquean caminando.
            </Text>
          </View>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            placeholder="Buscar rutas, pueblos o dificultad"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter, index) => (
            <View
              key={filter}
              style={[styles.filterChip, index === 0 && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>
                {filter}
              </Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rutas destacadas</Text>
            <Text style={styles.sectionSubtitle}>Empieza por Bedmar y Garcíez</Text>
          </View>
          <Text style={styles.sectionAction}>Ver todas</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Abrir ${route.title}`}
          style={styles.routeCard}
          onPress={() =>
            router.push({
              pathname: '/routes/[slug]',
              params: { slug: route.slug },
            })
          }
        >
          <View style={styles.routeVisual}>
            <View style={styles.routeGlow} />
            <View style={styles.routeMountainBack} />
            <View style={styles.routeMountainFront} />
            <View style={styles.difficultyBadge}>
              <Text style={styles.difficultyText}>{difficultyLabel(route.difficulty)}</Text>
            </View>
            {route.developmentFixture ? (
              <View style={styles.developmentBadge}>
                <Text style={styles.developmentText}>DATOS DE DESARROLLO</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.routeContent}>
            <Text style={styles.municipality}>{route.municipalityName.toUpperCase()}</Text>
            <Text style={styles.routeTitle}>{route.title}</Text>

            <View style={styles.metricsRow}>
              <Metric value={`${route.distanceKm.toFixed(1)} km`} label="Distancia" />
              <Metric value={`+${route.elevationGainM} m`} label="Desnivel" />
              <Metric value={durationLabel(route.durationMinutes)} label="Duración" />
            </View>

            <View style={styles.rewardRow}>
              <View style={styles.rewardCopy}>
                <Text style={styles.rewardLabel}>RECOMPENSAS DE AVENTURA</Text>
                <Text style={styles.rewardValue}>
                  {route.rewardPreview.discoveries} descubrimientos · +{route.rewardPreview.xp} XP · +{route.rewardPreview.olives} 🫒
                </Text>
              </View>
              <View style={styles.arrowButton}>
                <Text style={styles.arrow}>→</Text>
              </View>
            </View>
          </View>
        </Pressable>

        <View style={styles.challengeCard}>
          <View style={styles.challengeIcon}>
            <Text style={styles.challengeIconText}>◇</Text>
          </View>
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeEyebrow}>PRÓXIMAMENTE</Text>
            <Text style={styles.challengeTitle}>Retos de temporada</Text>
            <Text style={styles.challengeBody}>
              Completa rutas, descubre lugares y sube en el ranking de Mágina.
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomNav}>
        {navItems.map(([icon, label], index) => (
          <View key={label} style={styles.navItem}>
            <Text style={[styles.navIcon, index === 0 && styles.navActive]}>{icon}</Text>
            <Text style={[styles.navLabel, index === 0 && styles.navActive]}>{label}</Text>
          </View>
        ))}
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
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingHorizontal: spacing[20], paddingBottom: 116 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[12],
    paddingBottom: spacing[20],
  },
  eyebrow: { color: colors.olive700, fontSize: 11, fontWeight: '800', letterSpacing: 1.6 },
  brand: { color: colors.ink, fontSize: typography.title, fontWeight: '800', marginTop: 2 },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInitial: { color: colors.white, fontSize: 18, fontWeight: '800' },
  hero: {
    height: 280,
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    padding: spacing[24],
    justifyContent: 'flex-end',
  },
  sun: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.aoveGold,
    opacity: 0.9,
    right: 28,
    top: 30,
  },
  mountainBack: {
    position: 'absolute',
    width: 340,
    height: 170,
    backgroundColor: colors.olive700,
    transform: [{ rotate: '20deg' }],
    right: -120,
    bottom: -75,
    borderRadius: 48,
  },
  mountainFront: {
    position: 'absolute',
    width: 300,
    height: 130,
    backgroundColor: colors.olive500,
    opacity: 0.82,
    transform: [{ rotate: '-12deg' }],
    left: -100,
    bottom: -65,
    borderRadius: 44,
  },
  heroCopy: { maxWidth: 300 },
  heroKicker: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.7, marginBottom: spacing[8] },
  heroTitle: { color: colors.white, fontSize: typography.display, fontWeight: '900', lineHeight: 35 },
  heroBody: { color: colors.limestone, fontSize: 14, lineHeight: 20, marginTop: spacing[12], maxWidth: 270 },
  searchBox: {
    height: 54,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[16],
    marginTop: spacing[20],
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchIcon: { color: colors.olive900, fontSize: 24, marginRight: spacing[8] },
  searchInput: { flex: 1, color: colors.ink, fontSize: 15 },
  filters: { gap: spacing[8], paddingVertical: spacing[16] },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: { backgroundColor: colors.olive900, borderColor: colors.olive900 },
  filterText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  filterTextActive: { color: colors.white },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing[8],
    marginBottom: spacing[12],
  },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: 13, marginTop: 3 },
  sectionAction: { color: colors.olive700, fontSize: 13, fontWeight: '800' },
  routeCard: { overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.white, ...shadow.card },
  routeVisual: { height: 188, backgroundColor: colors.sky, overflow: 'hidden' },
  routeGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.aoveGold,
    opacity: 0.75,
    right: 28,
    top: 26,
  },
  routeMountainBack: {
    position: 'absolute',
    width: 300,
    height: 150,
    backgroundColor: colors.olive700,
    transform: [{ rotate: '13deg' }],
    left: -60,
    bottom: -90,
    borderRadius: 40,
  },
  routeMountainFront: {
    position: 'absolute',
    width: 270,
    height: 140,
    backgroundColor: colors.olive900,
    transform: [{ rotate: '-14deg' }],
    right: -70,
    bottom: -85,
    borderRadius: 40,
  },
  difficultyBadge: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[16],
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  difficultyText: { color: colors.olive900, fontSize: 12, fontWeight: '900' },
  developmentBadge: {
    position: 'absolute',
    right: spacing[12],
    bottom: spacing[12],
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
  },
  developmentText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  routeContent: { padding: spacing[20] },
  municipality: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  routeTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: spacing[4] },
  metricsRow: { flexDirection: 'row', gap: spacing[12], marginTop: spacing[20] },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: typography.metric, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[20],
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardCopy: { flex: 1, paddingRight: spacing[12] },
  rewardLabel: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  rewardValue: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: spacing[4] },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { color: colors.white, fontSize: 20, fontWeight: '800' },
  challengeCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.limestone,
    padding: spacing[20],
    marginTop: spacing[20],
  },
  challengeIcon: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.aoveGold,
    marginRight: spacing[16],
  },
  challengeIconText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  challengeCopy: { flex: 1 },
  challengeEyebrow: { color: colors.earth, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  challengeTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 2 },
  challengeBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing[4] },
  bottomNav: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    minHeight: 82,
    paddingTop: spacing[12],
    paddingBottom: spacing[20],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  navItem: { flex: 1, alignItems: 'center', gap: 3 },
  navIcon: { color: colors.muted, fontSize: 19, fontWeight: '800' },
  navLabel: { color: colors.muted, fontSize: 10, fontWeight: '700' },
  navActive: { color: colors.olive900 },
});
