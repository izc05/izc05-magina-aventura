import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { brand } from '../src/theme/branding';
import { resolveBottomNavSelection } from '../src/features/prebeta/prebeta-ux';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export default function RankingScreen() {
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
          <Text style={styles.title}>Clasificación Verificada</Text>
          <Text style={styles.subtitle}>
            Las puntuaciones del ranking se calculan exclusivamente con datos de actividades validadas por el servidor.
          </Text>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Garantía de Integridad</Text>
          <Text style={styles.noticeBody}>
            Las actividades pendientes o no validadas no inflan la clasificación final hasta recibir la validación oficial del servidor.
          </Text>
        </View>

        <View style={styles.emptyCard}>
          <Text style={styles.emptyTitle}>Sin clasificaciones aún</Text>
          <Text style={styles.emptyText}>
            Completa y valida tu primera aventura para aparecer en el ranking oficial de Sierra Mágina.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {brand.bottomNavigation.map((item) => {
          const active = item === 'Ranking';
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
  noticeCard: {
    backgroundColor: colors.oliveWash,
    borderRadius: radius.md,
    padding: spacing[16],
    marginBottom: spacing[20],
  },
  noticeTitle: {
    fontSize: typography.caption,
    fontWeight: '700',
    color: colors.olive900,
    marginBottom: spacing[4],
  },
  noticeBody: {
    fontSize: typography.caption,
    color: colors.olive900,
    lineHeight: 18,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[24],
    alignItems: 'center',
    ...shadow.card,
  },
  emptyTitle: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing[8],
  },
  emptyText: {
    fontSize: typography.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
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
