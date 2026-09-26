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
import { colors, radius, spacing, typography } from '../src/theme/tokens';
import { HeroTerritory } from '../src/components/ui/HeroTerritory';
import { RouteCard } from '../src/components/ui/RouteCard';

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

        <HeroTerritory 
          kicker="TU PRÓXIMA AVENTURA" 
          title={`Camina. Descubre.\nConquista Mágina.`}
          body="Rutas reales, retos y descubrimientos que solo se desbloquean caminando."
        />

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

        <Pressable
          style={styles.testerBanner}
          onPress={() => router.push('/theme-tester')}
        >
          <View style={styles.testerIconBox}>
            <Text style={styles.testerIcon}>🎨</Text>
          </View>
          <View style={styles.testerCopy}>
            <Text style={styles.testerEyebrow}>HERRAMIENTA DE DISEÑO</Text>
            <Text style={styles.testerTitle}>Probador Visual & Capas</Text>
            <Text style={styles.testerBody}>
              Prueba los 4 temas cartográficos, altimetría y capas interactivas.
            </Text>
          </View>
          <Text style={styles.testerArrow}>→</Text>
        </Pressable>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rutas destacadas</Text>
            <Text style={styles.sectionSubtitle}>Empieza por Bedmar y Garcíez</Text>
          </View>
          <Text style={styles.sectionAction}>Ver todas</Text>
        </View>

        <RouteCard 
          route={route} 
          onPress={() => router.push({ pathname: '/routes/[slug]', params: { slug: route.slug } })} 
        />

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
          <Pressable 
            key={label} 
            style={styles.navItem}
            onPress={() => {
              if (label === 'Perfil') {
                router.push('/profile');
              }
            }}
          >
            <Text style={[styles.navIcon, index === 0 && styles.navActive]}>{icon}</Text>
            <Text style={[styles.navLabel, index === 0 && styles.navActive]}>{label}</Text>
          </Pressable>
        ))}
      </View>
    </SafeAreaView>
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
  testerBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    padding: spacing[16],
    marginVertical: spacing[12],
  },
  testerIconBox: {
    width: 42,
    height: 42,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  testerIcon: { fontSize: 20 },
  testerCopy: { flex: 1 },
  testerEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  testerTitle: { color: colors.white, fontSize: 15, fontWeight: '900', marginTop: 2 },
  testerBody: { color: colors.limestone, fontSize: 11, marginTop: 2 },
  testerArrow: { color: colors.aoveGold, fontSize: 20, fontWeight: '900', marginLeft: spacing[8] },
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
