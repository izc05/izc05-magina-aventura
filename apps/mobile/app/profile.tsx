import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { brand } from '../src/theme/branding';
import { resolveBottomNavSelection } from '../src/features/prebeta/prebeta-ux';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export default function ProfileScreen() {
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
          <Text style={styles.title}>Perfil del Aventurero</Text>
          <Text style={styles.subtitle}>
            Progreso, medallas e historial de actividades verificadas.
          </Text>
        </View>

        {/* User Card */}
        <View style={styles.userCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarInitial}>A</Text>
          </View>
          <Text style={styles.userName}>Aventurero Mágina</Text>
          <Text style={styles.userLevel}>Nivel 1 · Explorador Novato</Text>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0.0 km</Text>
              <Text style={styles.statLabel}>Distancia verificada</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statBox}>
              <Text style={styles.statValue}>0 XP</Text>
              <Text style={styles.statLabel}>Experiencia oficial</Text>
            </View>
          </View>
        </View>

        {/* History Link */}
        <Pressable
          style={styles.menuItem}
          onPress={() => router.push('/history')}
        >
          <View style={styles.menuItemTextContainer}>
            <Text style={styles.menuItemTitle}>Historial de Actividades</Text>
            <Text style={styles.menuItemSubtitle}>
              Consulta el estado de validación y sincronización de tus aventuras.
            </Text>
          </View>
          <Text style={styles.menuArrow}>→</Text>
        </Pressable>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {brand.bottomNavigation.map((item) => {
          const active = item === 'Perfil';
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
  userCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[20],
    alignItems: 'center',
    marginBottom: spacing[20],
    ...shadow.card,
  },
  avatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: colors.oliveWash,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing[12],
  },
  avatarInitial: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.olive900,
  },
  userName: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  userLevel: {
    fontSize: typography.body,
    color: colors.muted,
    marginBottom: spacing[16],
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.olive900,
  },
  statLabel: {
    fontSize: typography.caption,
    color: colors.muted,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: colors.border,
  },
  menuItem: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },
  menuItemTextContainer: {
    flex: 1,
    marginRight: spacing[12],
  },
  menuItemTitle: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: 2,
  },
  menuItemSubtitle: {
    fontSize: typography.caption,
    color: colors.muted,
    lineHeight: 16,
  },
  menuArrow: {
    fontSize: typography.section,
    color: colors.olive900,
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
