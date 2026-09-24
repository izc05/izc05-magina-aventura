import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { BottomNav } from '../src/components/navigation/BottomNav';
import { FeaturedRouteCard } from '../src/components/routes/FeaturedRouteCard';
import { expoOnboardingStorage } from '../src/features/onboarding/expo-onboarding-storage';
import { LaunchScreen } from '../src/features/onboarding/LaunchScreen';
import {
  filterHomeRoutes,
  HOME_DIFFICULTY_FILTERS,
  resolveBottomNavSelection,
  type HomeDifficultyFilter,
} from '../src/features/prebeta/prebeta-ux';
import { useRouteCatalog } from '../src/features/routes/use-route-catalog';
import { brand } from '../src/theme/branding';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export default function RoutesHomeScreen() {
  const [ready, setReady] = useState(false);
  const [query, setQuery] = useState('');
  const [difficultyFilter, setDifficultyFilter] = useState<HomeDifficultyFilter>('Todos');

  useEffect(() => {
    let mounted = true;

    void expoOnboardingStorage
      .hasSeen()
      .then((seen) => {
        if (!mounted) return;
        if (!seen) {
          router.replace('/onboarding');
          return;
        }
        setReady(true);
      })
      .catch(() => {
        if (mounted) setReady(true);
      });

    return () => {
      mounted = false;
    };
  }, []);

  const { routes: catalogRoutes } = useRouteCatalog();
  const filteredRoutes = useMemo(
    () => filterHomeRoutes(catalogRoutes, query, difficultyFilter),
    [catalogRoutes, query, difficultyFilter],
  );

  function resetFilters() {
    setQuery('');
    setDifficultyFilter('Todos');
  }

  function handleBottomNav(item: (typeof brand.bottomNavigation)[number]) {
    const action = resolveBottomNavSelection(item);
    router.replace(action.href);
  }

  if (!ready) return <LaunchScreen />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroSun} />
          <View style={styles.heroMountainBack} />
          <View style={styles.heroMountainMid} />
          <View style={styles.heroMountainFront} />
          <View style={styles.heroPath} />
          <View style={styles.heroCopy}>
            <Text style={styles.heroKicker}>SIERRA MÁGINA · JAÉN</Text>
            <Text style={styles.heroTitle}>Camina. Descubre.{`\n`}Conquista Mágina.</Text>
            <Text style={styles.heroBody}>
              Rutas, patrimonio y naturaleza con información para preparar cada salida y seguirla con GPS.
            </Text>
          </View>
        </View>

        <View style={styles.valueStrip}>
          <ValueItem symbol="△" title="Rutas" />
          <ValueItem symbol="◎" title="GPS real" />
          <ValueItem symbol="◇" title="Offline" />
        </View>

        <View style={styles.searchBox}>
          <SearchGlyph />
          <TextInput
            accessibilityLabel="Buscar rutas o municipios"
            autoCorrect={false}
            placeholder="Buscar rutas o municipios…"
            placeholderTextColor={colors.muted}
            value={query}
            onChangeText={setQuery}
            style={styles.searchInput}
          />
          <View style={styles.resultCountPill}>
            <Text style={styles.resultCountText}>{filteredRoutes.length}</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filters}
        >
          {HOME_DIFFICULTY_FILTERS.map((filter) => {
            const selected = difficultyFilter === filter;
            return (
              <Pressable
                key={filter}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => setDifficultyFilter(filter)}
                style={({ pressed }) => [
                  styles.filterChip,
                  selected && styles.filterChipActive,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={[styles.filterText, selected && styles.filterTextActive]}>{filter}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionHeaderCopy}>
            <Text style={styles.sectionTitle}>Rutas disponibles</Text>
            <Text style={styles.sectionSubtitle}>
              {filteredRoutes.length === 1
                ? '1 resultado en esta selección'
                : `${filteredRoutes.length} resultados en esta selección`}
            </Text>
          </View>
          {query || difficultyFilter !== 'Todos' ? (
            <Pressable accessibilityRole="button" onPress={resetFilters} hitSlop={8}>
              <Text style={styles.resetAction}>Limpiar</Text>
            </Pressable>
          ) : null}
        </View>

        {filteredRoutes.length > 0 ? (
          <View style={styles.routeList}>
            {filteredRoutes.map((route) => (
              <FeaturedRouteCard
                key={route.id}
                route={route}
                onPress={() =>
                  router.push({
                    pathname: '/routes/[slug]',
                    params: { slug: route.slug },
                  })
                }
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptyCard}>
            <View style={styles.emptyMark}>
              <Text style={styles.emptyMarkText}>△</Text>
            </View>
            <Text style={styles.emptyTitle}>No encontramos rutas</Text>
            <Text style={styles.emptyBody}>
              Prueba con otro municipio, nombre o nivel de dificultad.
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={resetFilters}
              style={({ pressed }) => [styles.emptyButton, pressed && styles.pressed]}
            >
              <Text style={styles.emptyButtonText}>Ver todas las rutas</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.betaCard}>
          <View style={styles.betaIcon}>
            <Text style={styles.betaIconText}>GPS</Text>
          </View>
          <View style={styles.betaCopy}>
            <Text style={styles.betaEyebrow}>BETA DE CAMPO</Text>
            <Text style={styles.betaTitle}>Preparada para validar navegación real</Text>
            <Text style={styles.betaBody}>
              Las secciones sociales y de recompensas se activarán después de cerrar rutas y seguimiento GPS.
            </Text>
          </View>
        </View>

        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterClaim}>{brand.supportingClaim}</Text>
          <View style={styles.brandFooterLine} />
        </View>
      </ScrollView>

      <View style={styles.bottomNavWrap}>
        <BottomNav active="Rutas" onSelect={handleBottomNav} />
      </View>
    </SafeAreaView>
  );
}

function ValueItem({ symbol, title }: { symbol: string; title: string }) {
  return (
    <View style={styles.valueItem}>
      <View style={styles.valueIcon}>
        <Text style={styles.valueSymbol}>{symbol}</Text>
      </View>
      <Text style={styles.valueTitle}>{title}</Text>
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
  heroGlow: {
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
    backgroundColor: colors.aoveGold,
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
  valueSymbol: {
    color: colors.olive900,
    fontSize: 19,
    fontWeight: '900',
  },
  valueTitle: {
    marginTop: spacing[8],
    color: colors.ink,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
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
  resultCountPill: {
    minWidth: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.oliveWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  resultCountText: {
    color: colors.olive900,
    fontSize: 12,
    fontWeight: '900',
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
  pressed: {
    opacity: 0.78,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: spacing[12],
    marginTop: spacing[4],
    marginBottom: spacing[12],
  },
  sectionHeaderCopy: {
    flex: 1,
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
  resetAction: {
    color: colors.olive700,
    fontSize: 12,
    fontWeight: '900',
    paddingBottom: 2,
  },
  routeList: {
    gap: spacing[20],
  },
  emptyCard: {
    alignItems: 'center',
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[24],
  },
  emptyMark: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.oliveWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyMarkText: {
    color: colors.olive900,
    fontSize: 23,
    fontWeight: '900',
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    marginTop: spacing[12],
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  emptyButton: {
    marginTop: spacing[16],
    minHeight: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[20],
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyButtonText: {
    color: colors.white,
    fontSize: 12,
    fontWeight: '900',
  },
  betaCard: {
    flexDirection: 'row',
    borderRadius: radius.lg,
    backgroundColor: colors.limestone,
    padding: spacing[20],
    marginTop: spacing[20],
  },
  betaIcon: {
    width: 52,
    height: 52,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive900,
    marginRight: spacing[16],
  },
  betaIconText: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  betaCopy: {
    flex: 1,
  },
  betaEyebrow: {
    color: colors.earth,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  betaTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    marginTop: 2,
  },
  betaBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: spacing[4],
  },
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
