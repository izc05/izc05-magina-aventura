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

import { colors, radius, spacing, typography } from '../src/theme/tokens';
import { HeroTerritory } from '../src/components/ui/HeroTerritory';
import { adelfalDeCuadrosInformation } from '../src/features/routes/adelfal-de-cuadros-information';

const filters = ['Todos', 'Fácil', 'Moderada', 'Difícil'] as const;
const navItems = [
  { icon: '⌂', label: 'Rutas', unavailable: false },
  { icon: '◇', label: 'Retos', unavailable: true },
  { icon: '▦', label: 'Colecciones', unavailable: true },
  { icon: '△', label: 'Ranking', unavailable: true },
  { icon: '○', label: 'Pasaporte', unavailable: false },
] as const;

export default function RoutesHomeScreen() {
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
          kicker="RUTAS DE SIERRA MÁGINA"
          title={`Explora Mágina\ncon información clara.`}
          body="Consulta la información pública disponible y distingue lo verificado de lo que sigue pendiente."
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
            <Text style={styles.sectionTitle}>Ruta piloto</Text>
            <Text style={styles.sectionSubtitle}>Adelfal de Cuadros · Bedmar y Garcíez</Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Abrir catálogo público de rutas"
            accessibilityHint="Consulta las fichas públicas sin iniciar sesión."
            style={styles.sectionAction}
            onPress={() => router.push('/routes')}
          >
            <Text style={styles.sectionActionText}>Ver catálogo</Text>
          </Pressable>
        </View>

        <Pressable
          testID="home-adelfal-route-card"
          accessibilityRole="button"
          accessibilityLabel={`Abrir ficha oficial de ${adelfalDeCuadrosInformation.title}`}
          accessibilityHint="Abre la ficha oficial de la Junta. La app no muestra mapa ni navegación de esta ruta."
          style={styles.pilotCard}
          onPress={() => router.push('/official-routes/adelfal-de-cuadros')}
        >
          <View style={styles.pilotCardHeader}>
            <Text style={styles.pilotBadge}>PILOTO OFICIAL</Text>
            <Text style={styles.pilotSource}>Ficha de la Junta de Andalucía</Text>
          </View>
          <Text accessibilityRole="header" style={styles.pilotTitle}>{adelfalDeCuadrosInformation.title}</Text>
          <Text style={styles.pilotLocation}>{adelfalDeCuadrosInformation.municipality}</Text>
          <Text style={styles.pilotFacts}>
            {adelfalDeCuadrosInformation.facts.routeType} · {adelfalDeCuadrosInformation.facts.outwardDistanceMeters} m de ida · {adelfalDeCuadrosInformation.facts.durationMinutes} min
          </Text>
          <Text style={styles.pilotDetail}>
            Dificultad {adelfalDeCuadrosInformation.facts.difficulty.toLowerCase()} · {adelfalDeCuadrosInformation.facts.pathType} · sombra {adelfalDeCuadrosInformation.facts.shade.toLowerCase()}.
          </Text>
          <View style={styles.pilotNotice}>
            <Text style={styles.pilotNoticeTitle}>Aviso publicado por la Junta · {adelfalDeCuadrosInformation.noticeDate}</Text>
            <Text style={styles.pilotNoticeStatus}>{adelfalDeCuadrosInformation.publishedStatus}</Text>
            <Text style={styles.pilotNoticeBody}>{adelfalDeCuadrosInformation.statusContext}</Text>
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
              onPress={
                label === 'Rutas'
                  ? () => router.push('/routes')
                  : label === 'Pasaporte'
                    ? () => router.push('/profile')
                    : undefined
              }
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
  sectionAction: { alignItems: 'flex-end', minHeight: 48, justifyContent: 'center' },
  sectionActionText: { color: colors.olive700, fontSize: 13, fontWeight: '800' },
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
  pilotCard: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
  },
  pilotCardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  pilotBadge: { color: colors.white, backgroundColor: colors.olive900, borderRadius: radius.pill, paddingHorizontal: spacing[12], paddingVertical: spacing[8], fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  pilotSource: { color: colors.olive700, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  pilotTitle: { color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '900', marginTop: spacing[12] },
  pilotLocation: { color: colors.muted, fontSize: 12, marginTop: spacing[4] },
  pilotFacts: { color: colors.olive700, fontSize: 12, lineHeight: 18, fontWeight: '900', marginTop: spacing[12] },
  pilotDetail: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  pilotNotice: { marginTop: spacing[12], borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.earth, backgroundColor: colors.limestone, padding: spacing[12] },
  pilotNoticeTitle: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '900' },
  pilotNoticeStatus: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: spacing[4] },
  pilotNoticeBody: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
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
