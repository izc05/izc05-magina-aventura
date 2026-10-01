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
import { MunicipalRouteInformationCard } from '../src/components/ui/MunicipalRouteInformationCard';
import { municipalRouteInformation } from '../src/features/routes/municipal-route-information';

const filters = ['Todos', 'Fácil', 'Moderada', 'Difícil'] as const;
const navItems = [
  { icon: '⌂', label: 'Rutas', unavailable: false },
  { icon: '◇', label: 'Retos', unavailable: true },
  { icon: '▦', label: 'Colecciones', unavailable: true },
  { icon: '△', label: 'Ranking', unavailable: true },
  { icon: '○', label: 'Perfil', unavailable: false },
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
            accessibilityLabel="Buscar rutas, pueblos o dificultad. Próximamente."
            accessibilityHint="La búsqueda todavía no está disponible."
            accessibilityState={{ disabled: true }}
            editable={false}
          />
        </View>
        <Text style={styles.availabilityNote}>Búsqueda de rutas: próximamente.</Text>

        <View style={styles.filterSection}>
          <Text style={styles.availabilityNote}>Filtros de dificultad: próximamente.</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
          >
            {filters.map((filter) => (
              <Pressable
                key={filter}
                disabled
                accessibilityRole="button"
                accessibilityLabel={`Filtro ${filter}. Próximamente.`}
                accessibilityHint="Los filtros de rutas todavía no están disponibles."
                accessibilityState={{ disabled: true }}
                style={[styles.filterChip, styles.filterChipDisabled]}
              >
                <Text style={[styles.filterText, styles.filterTextDisabled]}>{filter}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {__DEV__ ? (
          <Pressable
            style={styles.testerBanner}
            onPress={() => router.push('/theme-tester')}
            accessibilityRole="button"
            accessibilityLabel="Abrir Probador Visual y Capas, solo para desarrollo."
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
        ) : null}

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rutas destacadas</Text>
            <Text style={styles.sectionSubtitle}>Empieza por Bedmar y Garcíez</Text>
          </View>
          <Pressable
            disabled
            accessibilityRole="button"
            accessibilityLabel="Ver todas las rutas. Próximamente."
            accessibilityHint="El catálogo completo de rutas todavía no está disponible."
            accessibilityState={{ disabled: true }}
            style={styles.sectionAction}
          >
            <Text style={styles.sectionActionText}>Ver todas</Text>
            <Text style={styles.sectionActionStatus}>Próximamente</Text>
          </Pressable>
        </View>

        <RouteCard 
          route={route} 
          onPress={() => router.push({ pathname: '/routes/[slug]', params: { slug: route.slug } })} 
        />

        <MunicipalRouteInformationCard
          onPress={() =>
            router.push({
              pathname: '/municipal-routes/[slug]',
              params: { slug: municipalRouteInformation.slug },
            })
          }
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
        {navItems.map(({ icon, label, unavailable }) => {
          const isSelected = label === 'Rutas';
          const isDisabled = unavailable === true;

          return (
            <Pressable
              key={label}
              style={styles.navItem}
              disabled={isDisabled}
              accessibilityRole="tab"
              accessibilityLabel={isDisabled ? `${label}, próximamente.` : label}
              accessibilityHint={isDisabled ? 'Esta sección todavía no está disponible.' : undefined}
              accessibilityState={{ disabled: isDisabled, selected: isSelected }}
              onPress={label === 'Perfil' ? () => router.push('/profile') : undefined}
            >
              <Text style={[styles.navIcon, isSelected && styles.navActive, isDisabled && styles.navDisabled]}>{icon}</Text>
              <Text style={[styles.navLabel, isSelected && styles.navActive, isDisabled && styles.navDisabled]}>{label}</Text>
              {isDisabled ? <Text style={styles.navStatus}>Próximamente</Text> : null}
            </Pressable>
          );
        })}
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
  availabilityNote: { color: colors.muted, fontSize: 11, lineHeight: 15, marginTop: spacing[4] },
  filterSection: { marginTop: spacing[8] },
  filters: { gap: spacing[8], paddingVertical: spacing[16] },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipDisabled: { backgroundColor: colors.limestone, opacity: 0.72 },
  filterText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  filterTextDisabled: { color: colors.muted },
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
  sectionAction: { alignItems: 'flex-end', opacity: 0.72 },
  sectionActionText: { color: colors.olive700, fontSize: 13, fontWeight: '800' },
  sectionActionStatus: { color: colors.muted, fontSize: 9, fontWeight: '700', marginTop: 2 },
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
  navStatus: { color: colors.muted, fontSize: 8, fontWeight: '700' },
  navDisabled: { opacity: 0.72 },
  navActive: { color: colors.olive900 },
});
