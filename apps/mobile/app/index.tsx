import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { BottomNav } from '../src/components/navigation/BottomNav';
import { FeaturedRouteCard } from '../src/components/routes/FeaturedRouteCard';
import { resolveOnboardingBootstrap } from '../src/features/onboarding/bootstrap';
import { expoOnboardingStorage } from '../src/features/onboarding/expo-onboarding-storage';
import { LaunchScreen } from '../src/features/onboarding/LaunchScreen';
import { getQaHarnessCard, getRuntimeRoutes } from '../src/features/qa/qa-harness';
import { startupBreadcrumb } from '../src/features/diagnostics/startup-breadcrumbs';
import { brand } from '../src/theme/branding';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

const filters = ['Todos', 'Fácil', 'Moderada', 'Difícil'] as const;

export default function RoutesHomeScreen() {
  startupBreadcrumb('react-runtime');
  const routes = getRuntimeRoutes();
  const QaHarnessCard = getQaHarnessCard();
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<(typeof filters)[number]>('Todos');

  const visibleRoutes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return routes.filter((candidate) => {
      const matchesQuery = normalizedQuery.length === 0 || [
        candidate.title,
        candidate.municipalityName,
        candidate.description,
      ].some((value) => value.toLocaleLowerCase().includes(normalizedQuery));
      const matchesDifficulty = activeFilter === 'Todos'
        || (activeFilter === 'Fácil' && candidate.difficulty === 'easy')
        || (activeFilter === 'Moderada' && candidate.difficulty === 'moderate')
        || (activeFilter === 'Difícil' && candidate.difficulty === 'hard');
      return matchesQuery && matchesDifficulty;
    });
  }, [activeFilter, query, routes]);

  const route = visibleRoutes[0] ?? routes[0];

  useEffect(() => {
    let mounted = true;
    startupBreadcrumb('onboarding-storage-start');

    void resolveOnboardingBootstrap(expoOnboardingStorage)
      .then((nextScreen) => {
        if (!mounted) return;
        startupBreadcrumb('onboarding-storage-complete');
        if (nextScreen === 'onboarding') {
          router.replace('/onboarding');
          return;
        }
        startupBreadcrumb('home-mounted');
        setReady(true);
      })

    return () => {
      mounted = false;
    };
  }, []);

  if (!ready) return <LaunchScreen />;
  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
        <View style={styles.emptyState}>
          <AppHeader onDiagnosticsPress={() => router.push('/diagnostics')} />
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateTitle}>Rutas verificadas próximamente</Text>
            <Text style={styles.emptyStateBody}>
              Esta compilación no muestra contenido provisional ni datos de prueba.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <AppHeader onDiagnosticsPress={() => router.push('/diagnostics')} />

        <View style={styles.hero}>
          <View style={styles.heroSkyGlow} />
          <View style={styles.heroSun} />
          <View style={styles.heroMountainBack} />
          <View style={styles.heroMountainMid} />
          <View style={styles.heroMountainFront} />
          <View style={styles.heroPath} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>SIERRA MÁGINA TE ESPERA</Text>
            <Text style={styles.heroTitle}>Camina. Descubre.{`\n`}Conquista Mágina.</Text>
            <Text style={styles.heroBody}>
              Rutas reales, patrimonio y naturaleza convertidos en una aventura que progresa contigo.
            </Text>
          </View>
        </View>

        <View style={styles.valueStrip}>
          <ValueItem kind="route" title="Rutas reales" />
          <ValueItem kind="heritage" title="Patrimonio vivo" />
          <ValueItem kind="nature" title="Naturaleza única" />
        </View>

        <View style={styles.searchBox}>
          <SearchGlyph />
          <TextInput
            placeholder="Buscar rutas, municipios, lugares…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
          <View style={styles.filterButton}>
            <View style={styles.filterLineWide} />
            <View style={styles.filterLineNarrow} />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {filters.map((filter) => (
            <Pressable
              key={filter}
              accessibilityRole="button"
              accessibilityState={{ selected: activeFilter === filter }}
              onPress={() => setActiveFilter(filter)}
              style={[styles.filterChip, activeFilter === filter && styles.filterChipActive]}
            >
              <Text style={[styles.filterText, activeFilter === filter && styles.filterTextActive]}>{filter}</Text>
            </Pressable>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View>
          <Text style={styles.sectionTitle}>Explora rutas</Text>
            <Text style={styles.sectionSubtitle}>{visibleRoutes.length} ruta{visibleRoutes.length === 1 ? '' : 's'} disponibles para comenzar</Text>
          </View>
          <Text style={styles.sectionAction}>Mapa y detalle  →</Text>
        </View>

        {visibleRoutes.length > 0 ? visibleRoutes.map((candidate) => (
          <View key={candidate.slug} style={styles.routeCardWrap}>
            <FeaturedRouteCard
              route={candidate}
              onPress={() =>
                router.push({
                  pathname: '/routes/[slug]',
                  params: { slug: candidate.slug },
                })
              }
            />
          </View>
        )) : (
          <View style={styles.noResultsCard}>
            <Text style={styles.noResultsTitle}>No encontramos esa ruta</Text>
            <Text style={styles.noResultsBody}>Prueba con otro municipio, lugar o dificultad.</Text>
          </View>
        )}

        {QaHarnessCard && route?.developmentFixture ? (
          <>
            <QaHarnessCard />
            <Pressable
              style={styles.qaHarnessButton}
              onPress={() =>
                router.push({
                  pathname: '/routes/[slug]',
                  params: { slug: route.slug },
                })
              }
            >
              <Text style={styles.qaHarnessButtonText}>Abrir simulador TEST DATA</Text>
            </Pressable>
          </>
        ) : null}

        <View style={styles.challengeCard}>
          <View style={styles.challengeIcon}>
            <View style={styles.challengeMedal} />
            <View style={styles.challengeRibbonLeft} />
            <View style={styles.challengeRibbonRight} />
          </View>
          <View style={styles.challengeCopy}>
            <Text style={styles.challengeEyebrow}>PRÓXIMAMENTE</Text>
            <Text style={styles.challengeTitle}>Retos de temporada</Text>
            <Text style={styles.challengeBody}>
              Completa rutas, descubre lugares y sube en el ranking de Mágina.
            </Text>
          </View>
        </View>

        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterClaim}>{brand.supportingClaim}</Text>
          <View style={styles.brandFooterLine} />
        </View>
      </ScrollView>

      <View style={styles.bottomNavWrap}>
        <BottomNav active="Rutas" />
      </View>
    </SafeAreaView>
  );
}

function ValueItem({ kind, title }: { kind: 'route' | 'heritage' | 'nature'; title: string }) {
  return (
    <View style={styles.valueItem}>
      <View style={styles.valueIcon}>
        {kind === 'route' ? <RouteValueGlyph /> : null}
        {kind === 'heritage' ? <HeritageValueGlyph /> : null}
        {kind === 'nature' ? <NatureValueGlyph /> : null}
      </View>
      <Text style={styles.valueTitle}>{title}</Text>
    </View>
  );
}

function RouteValueGlyph() {
  return (
    <View style={styles.valueGlyphBox}>
      <View style={styles.valueMountain} />
      <View style={styles.valuePath} />
    </View>
  );
}

function HeritageValueGlyph() {
  return (
    <View style={styles.valueGlyphBox}>
      <View style={styles.templeRoof} />
      <View style={styles.templeColumns}>
        <View style={styles.templeColumn} />
        <View style={styles.templeColumn} />
        <View style={styles.templeColumn} />
      </View>
      <View style={styles.templeBase} />
    </View>
  );
}

function NatureValueGlyph() {
  return (
    <View style={styles.valueGlyphBox}>
      <View style={styles.leafStem} />
      <View style={styles.leafLeft} />
      <View style={styles.leafRight} />
    </View>
  );
}

function SearchGlyph() {
  return (
    <View style={styles.searchGlyph}>
      <View style={styles.searchCircle} />
      <View style={styles.searchHandle} />
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  emptyState: { flex: 1, paddingHorizontal: spacing[20], paddingTop: spacing[20] },
  emptyStateCard: {
    marginTop: spacing[32],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
  },
  emptyStateTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  emptyStateBody: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: spacing[8] },
  content: {
    paddingHorizontal: spacing[20],
    paddingBottom: 126,
  },
  hero: {
    height: 292,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.sky,
    padding: spacing[24],
    justifyContent: 'flex-end',
    ...shadow.card,
  },
  heroSkyGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#BFDCE9',
    opacity: 0.54,
  },
  heroSun: {
    position: 'absolute',
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0D274',
    right: 34,
    top: 28,
    opacity: 0.92,
  },
  heroMountainBack: {
    position: 'absolute',
    width: 330,
    height: 165,
    borderRadius: 70,
    backgroundColor: '#789489',
    right: -120,
    bottom: 20,
    transform: [{ rotate: '-17deg' }],
  },
  heroMountainMid: {
    position: 'absolute',
    width: 325,
    height: 155,
    borderRadius: 66,
    backgroundColor: colors.olive500,
    left: -120,
    bottom: -5,
    transform: [{ rotate: '17deg' }],
  },
  heroMountainFront: {
    position: 'absolute',
    width: 340,
    height: 140,
    borderRadius: 60,
    backgroundColor: colors.olive900,
    right: -118,
    bottom: -70,
    transform: [{ rotate: '8deg' }],
  },
  heroPath: {
    position: 'absolute',
    width: 68,
    height: 185,
    borderRadius: 40,
    backgroundColor: colors.limestone,
    left: '48%',
    bottom: -108,
    transform: [{ rotate: '19deg' }],
    opacity: 0.96,
  },
  heroCopy: {
    maxWidth: 305,
  },
  heroKicker: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
    marginBottom: spacing[8],
  },
  heroTitle: {
    color: colors.white,
    fontSize: typography.display,
    fontWeight: '900',
    lineHeight: 35,
    letterSpacing: -0.7,
  },
  heroBody: {
    color: colors.limestone,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing[12],
    maxWidth: 285,
  },
  valueStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing[8],
    paddingVertical: spacing[20],
  },
  valueItem: {
    flex: 1,
    alignItems: 'center',
  },
  valueIcon: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.oliveWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueTitle: {
    marginTop: spacing[8],
    color: colors.ink,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  valueGlyphBox: {
    width: 25,
    height: 25,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueMountain: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftWidth: 10,
    borderRightWidth: 10,
    borderBottomWidth: 16,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.olive900,
    bottom: 2,
  },
  valuePath: {
    position: 'absolute',
    width: 3,
    height: 12,
    borderRadius: 2,
    backgroundColor: colors.white,
    bottom: 1,
    transform: [{ rotate: '23deg' }],
  },
  templeRoof: {
    position: 'absolute',
    top: 2,
    width: 0,
    height: 0,
    borderLeftWidth: 11,
    borderRightWidth: 11,
    borderBottomWidth: 7,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: colors.olive900,
  },
  templeColumns: {
    position: 'absolute',
    top: 10,
    flexDirection: 'row',
    gap: 3,
  },
  templeColumn: {
    width: 3,
    height: 10,
    backgroundColor: colors.olive900,
  },
  templeBase: {
    position: 'absolute',
    bottom: 2,
    width: 23,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.olive900,
  },
  leafStem: {
    position: 'absolute',
    width: 3,
    height: 22,
    borderRadius: 2,
    backgroundColor: colors.olive900,
    transform: [{ rotate: '-18deg' }],
  },
  leafLeft: {
    position: 'absolute',
    width: 13,
    height: 6,
    borderRadius: 7,
    backgroundColor: colors.olive700,
    left: 1,
    top: 8,
    transform: [{ rotate: '28deg' }],
  },
  leafRight: {
    position: 'absolute',
    width: 14,
    height: 6,
    borderRadius: 7,
    backgroundColor: colors.olive900,
    right: 0,
    top: 5,
    transform: [{ rotate: '-25deg' }],
  },
  searchBox: {
    height: 56,
    borderRadius: radius.md,
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing[16],
    paddingRight: spacing[8],
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchGlyph: {
    width: 24,
    height: 24,
    marginRight: spacing[8],
  },
  searchCircle: {
    position: 'absolute',
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.olive900,
    left: 2,
    top: 2,
  },
  searchHandle: {
    position: 'absolute',
    width: 8,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.olive900,
    left: 13,
    top: 15,
    transform: [{ rotate: '45deg' }],
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 14,
  },
  filterButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.warmBackground,
  },
  filterLineWide: {
    width: 17,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.olive900,
    marginBottom: 5,
  },
  filterLineNarrow: {
    width: 9,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.olive900,
  },
  filters: {
    gap: spacing[8],
    paddingVertical: spacing[16],
  },
  filterChip: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[16],
    paddingVertical: spacing[8],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  filterChipActive: {
    backgroundColor: colors.olive900,
    borderColor: colors.olive900,
  },
  filterText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '700',
  },
  filterTextActive: {
    color: colors.white,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    marginBottom: spacing[12],
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 3,
  },
  sectionAction: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '900',
  },
  routeCardWrap: {
    marginBottom: spacing[16],
  },
  noResultsCard: {
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
  },
  noResultsTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  noResultsBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
  challengeCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.limestone,
    padding: spacing[20],
    marginTop: spacing[20],
  },
  challengeIcon: {
    width: 50,
    height: 50,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.aoveGold,
    marginRight: spacing[16],
    position: 'relative',
  },
  challengeMedal: {
    width: 19,
    height: 19,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: colors.olive900,
    marginTop: -6,
  },
  challengeRibbonLeft: {
    position: 'absolute',
    width: 4,
    height: 12,
    backgroundColor: colors.olive900,
    bottom: 8,
    left: 19,
    transform: [{ rotate: '18deg' }],
  },
  challengeRibbonRight: {
    position: 'absolute',
    width: 4,
    height: 12,
    backgroundColor: colors.olive900,
    bottom: 8,
    right: 19,
    transform: [{ rotate: '-18deg' }],
  },
  challengeCopy: {
    flex: 1,
  },
  challengeEyebrow: {
    color: colors.earth,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  challengeTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
    marginTop: 2,
  },
  challengeBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing[4],
  },
  qaHarnessButton: {
    minHeight: 44,
    marginTop: spacing[8],
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qaHarnessButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  brandFooter: {
    alignItems: 'center',
    paddingTop: spacing[32],
    paddingBottom: spacing[8],
  },
  brandFooterClaim: {
    color: colors.olive700,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  brandFooterLine: {
    width: 42,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.aoveGold,
    marginTop: spacing[8],
  },
  bottomNavWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
  },
});
