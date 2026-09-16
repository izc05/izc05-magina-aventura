import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { FeaturedRouteCard } from '../src/components/routes/FeaturedRouteCard';
import { presentHome, type HomeQuickAction } from '../src/features/home/home-presenter';
import { expoOnboardingStorage } from '../src/features/onboarding/expo-onboarding-storage';
import { LaunchScreen } from '../src/features/onboarding/LaunchScreen';
import { developmentRoutes } from '../src/features/routes/fixtures';
import { brand } from '../src/theme/branding';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

const quickActionGlyph: Record<HomeQuickAction, string> = {
  Rutas: '△',
  Mapa: '▱',
  'Cerca de ti': '⌖',
  Favoritos: '♡',
};

function destinationForQuickAction(action: HomeQuickAction) {
  if (action === 'Rutas') return '/explore';
  if (action === 'Mapa' || action === 'Cerca de ti') return '/map';
  return '/profile';
}

export default function HomeScreen() {
  const [ready, setReady] = useState(false);
  const presentation = useMemo(() => presentHome(developmentRoutes), []);

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

  if (!ready) return <LaunchScreen />;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.sun} />
          <View style={styles.mountainBack} />
          <View style={styles.mountainMid} />
          <View style={styles.mountainFront} />
          <View style={styles.path} />

          <View style={styles.heroCopy}>
            <Text style={styles.greeting}>Buenos días,</Text>
            <Text style={styles.heroTitle}>{presentation.headline}</Text>
            <Text style={styles.heroSubtitle}>Explora Sierra Mágina con rutas, seguridad y territorio en un mismo lugar.</Text>
          </View>

          <View style={styles.searchBox}>
            <Text style={styles.searchGlyph}>⌕</Text>
            <TextInput
              placeholder={presentation.searchPlaceholder}
              placeholderTextColor={colors.muted}
              style={styles.searchInput}
              returnKeyType="search"
              onSubmitEditing={() => router.push('/explore' as never)}
            />
          </View>
        </View>

        <View style={styles.quickGrid}>
          {presentation.quickActions.map((action) => (
            <Pressable
              key={action}
              accessibilityRole="button"
              onPress={() => router.push(destinationForQuickAction(action) as never)}
              style={({ pressed }) => [styles.quickAction, pressed && styles.pressed]}
            >
              <View style={styles.quickIcon}>
                <Text style={styles.quickGlyph}>{quickActionGlyph[action]}</Text>
              </View>
              <Text style={styles.quickLabel}>{action}</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Rutas destacadas</Text>
            <Text style={styles.sectionSubtitle}>Una primera puerta de entrada a Mágina</Text>
          </View>
          <Pressable onPress={() => router.push('/explore' as never)}>
            <Text style={styles.sectionAction}>Ver todas →</Text>
          </Pressable>
        </View>

        {presentation.featuredRoute ? (
          <FeaturedRouteCard
            route={presentation.featuredRoute}
            onPress={() =>
              router.push({
                pathname: '/routes/[slug]',
                params: { slug: presentation.featuredRoute?.slug ?? '' },
              })
            }
          />
        ) : (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Catálogo en preparación</Text>
            <Text style={styles.emptyBody}>Las rutas aparecerán aquí en cuanto estén verificadas y disponibles.</Text>
          </View>
        )}

        <View style={styles.safetyCard}>
          <View style={styles.safetyBadge}><Text style={styles.safetyBadgeText}>✓</Text></View>
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>Tiempo y seguridad antes de salir</Text>
            <Text style={styles.safetyBody}>La aventura empieza comprobando condiciones, avisos y preparación.</Text>
          </View>
          <Pressable onPress={() => router.push('/map' as never)} style={styles.safetyArrow}>
            <Text style={styles.safetyArrowText}>→</Text>
          </Pressable>
        </View>

        <View style={styles.brandFooter}>
          <Text style={styles.brandFooterClaim}>{brand.supportingClaim}</Text>
          <Text style={styles.brandFooterLocation}>{brand.identity.descriptor}</Text>
        </View>
      </ScrollView>

      <PrimaryTabBar active="Inicio" />
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
    paddingBottom: 126,
  },
  hero: {
    minHeight: 330,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.olive900,
    padding: spacing[24],
    justifyContent: 'flex-end',
    ...shadow.card,
  },
  heroGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#47725B',
    opacity: 0.55,
  },
  sun: {
    position: 'absolute',
    width: 82,
    height: 82,
    borderRadius: 41,
    right: 30,
    top: 26,
    backgroundColor: colors.aoveGold,
    opacity: 0.96,
  },
  mountainBack: {
    position: 'absolute',
    width: 330,
    height: 145,
    borderRadius: 64,
    right: -108,
    bottom: 90,
    backgroundColor: '#6D8A72',
    transform: [{ rotate: '-14deg' }],
  },
  mountainMid: {
    position: 'absolute',
    width: 320,
    height: 150,
    borderRadius: 64,
    left: -120,
    bottom: 72,
    backgroundColor: colors.olive700,
    transform: [{ rotate: '17deg' }],
  },
  mountainFront: {
    position: 'absolute',
    width: 350,
    height: 135,
    borderRadius: 58,
    right: -120,
    bottom: 34,
    backgroundColor: '#173C2D',
    transform: [{ rotate: '9deg' }],
  },
  path: {
    position: 'absolute',
    width: 54,
    height: 150,
    borderRadius: 28,
    backgroundColor: colors.limestone,
    left: '48%',
    bottom: 0,
    opacity: 0.86,
    transform: [{ rotate: '18deg' }],
  },
  heroCopy: {
    zIndex: 2,
    maxWidth: 310,
    marginBottom: spacing[20],
  },
  greeting: {
    color: colors.limestone,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: spacing[4],
  },
  heroTitle: {
    color: colors.white,
    fontSize: 31,
    lineHeight: 34,
    fontWeight: '900',
    letterSpacing: -0.8,
  },
  heroSubtitle: {
    color: colors.limestone,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
    maxWidth: 290,
  },
  searchBox: {
    zIndex: 2,
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[16],
  },
  searchGlyph: {
    color: colors.olive900,
    fontSize: 24,
    marginRight: spacing[8],
  },
  searchInput: {
    flex: 1,
    color: colors.ink,
    fontSize: 13,
  },
  quickGrid: {
    flexDirection: 'row',
    gap: spacing[8],
    paddingVertical: spacing[20],
  },
  quickAction: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: {
    opacity: 0.78,
  },
  quickIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.oliveWash,
    marginBottom: spacing[8],
  },
  quickGlyph: {
    color: colors.olive900,
    fontSize: 18,
    fontWeight: '900',
  },
  quickLabel: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: spacing[12],
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 11,
    marginTop: 3,
  },
  sectionAction: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '900',
  },
  emptyCard: {
    borderRadius: radius.lg,
    padding: spacing[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[4],
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: spacing[16],
    marginTop: spacing[20],
    backgroundColor: colors.limestone,
  },
  safetyBadge: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.olive900,
  },
  safetyBadgeText: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
  safetyCopy: {
    flex: 1,
    marginLeft: spacing[12],
  },
  safetyTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  safetyBody: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  safetyArrow: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  safetyArrowText: {
    color: colors.olive900,
    fontSize: 18,
    fontWeight: '900',
  },
  brandFooter: {
    alignItems: 'center',
    paddingVertical: spacing[32],
  },
  brandFooterClaim: {
    color: colors.olive700,
    fontSize: 14,
    fontWeight: '700',
    fontStyle: 'italic',
  },
  brandFooterLocation: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 2.1,
    marginTop: spacing[8],
  },
});
