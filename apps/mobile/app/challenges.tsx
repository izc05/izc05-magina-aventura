import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { brand } from '../src/theme/branding';
import { resolveBottomNavSelection } from '../src/features/prebeta/prebeta-ux';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export default function ChallengesScreen() {
  const router = useRouter();

  function handleBottomNav(item: (typeof brand.bottomNavigation)[number]) {
    const action = resolveBottomNavSelection(item);
    router.replace(action.href);
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />
        <View style={styles.header}>
          <Text style={styles.title}>Retos de Temporada</Text>
          <Text style={styles.subtitle}>
            Completa misiones en las rutas de Sierra Mágina y suma puntos de experiencia verificados.
          </Text>
        </View>

        <View style={styles.card}>
          <View style={styles.cardBadge}>
            <Text style={styles.cardBadgeText}>TEMPORADA 1</Text>
          </View>
          <Text style={styles.cardTitle}>Pionero de Mágina</Text>
          <Text style={styles.cardDescription}>
            Completa 3 rutas verificadas en Sierra Mágina durante la fase de lanzamiento.
          </Text>
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>Progreso verificado</Text>
            <Text style={styles.progressValue}>0 / 3 rutas</Text>
          </View>
          <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: '0%' }]} />
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {brand.bottomNavigation.map((item) => {
          const active = item === 'Retos';
          return (
            <Pressable
              key={item}
              style={[styles.bottomNavItem, active && styles.bottomNavItemActive]}
              onPress={() => handleBottomNav(item)}
            >
              <Text style={[styles.bottomNavText, active && styles.bottomNavTextActive]}>
                {item}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    padding: spacing[20],
    paddingBottom: 100,
  },
  header: {
    marginBottom: spacing[24],
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.olive900,
    marginBottom: spacing[8],
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.muted,
    lineHeight: 22,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[20],
    ...shadow.card,
  },
  cardBadge: {
    alignSelf: 'flex-start',
    backgroundColor: colors.oliveWash,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[4],
    borderRadius: radius.sm,
    marginBottom: spacing[12],
  },
  cardBadgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.olive900,
  },
  cardTitle: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing[8],
  },
  cardDescription: {
    fontSize: typography.body,
    color: colors.muted,
    marginBottom: spacing[16],
    lineHeight: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[8],
  },
  progressLabel: {
    fontSize: typography.caption,
    color: colors.muted,
  },
  progressValue: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.olive900,
  },
  progressBarBg: {
    height: 8,
    backgroundColor: colors.border,
    borderRadius: radius.pill,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.olive700,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingVertical: spacing[12],
    paddingHorizontal: spacing[16],
    justifyContent: 'space-around',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  bottomNavItem: {
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    borderRadius: radius.md,
  },
  bottomNavItemActive: {
    backgroundColor: colors.oliveWash,
  },
  bottomNavText: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.muted,
  },
  bottomNavTextActive: {
    color: colors.olive900,
    fontWeight: '700',
  },
});
