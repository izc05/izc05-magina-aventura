import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { brand } from '../src/theme/branding';
import { resolveBottomNavSelection } from '../src/features/prebeta/prebeta-ux';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export default function CollectionsScreen() {
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
          <Text style={styles.title}>Colecciones Culturales</Text>
          <Text style={styles.subtitle}>
            Descubre elementos patrimoniales y etnológicos al explorar las rutas de Sierra Mágina.
          </Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.cardTitle}>Patrimonio de Cuadros</Text>
          <Text style={styles.cardDescription}>
            Descubrimientos etnológicos y naturales asociados a la ruta del Santuario de Cuadros.
          </Text>
          <View style={styles.statsRow}>
            <Text style={styles.statsText}>0 de 4 descubrimientos hallados</Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        {brand.bottomNavigation.map((item) => {
          const active = item === 'Colecciones';
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
  statsRow: {
    paddingTop: spacing[12],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  statsText: {
    fontSize: typography.caption,
    color: colors.muted,
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
