import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { FeaturedRouteCard } from '../src/components/routes/FeaturedRouteCard';
import { developmentRoutes } from '../src/features/routes/fixtures';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

const filters = ['Todas', 'Senderismo', 'Fácil', 'Moderada', 'Difícil'] as const;

export default function ExploreScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />
        <View style={styles.heading}>
          <Text style={styles.eyebrow}>DESCUBRE SIERRA MÁGINA</Text>
          <Text style={styles.title}>Explorar</Text>
          <Text style={styles.subtitle}>Busca rutas, municipios y experiencias antes de preparar tu aventura.</Text>
        </View>

        <View style={styles.searchBox}>
          <Text style={styles.searchGlyph}>⌕</Text>
          <TextInput
            placeholder="Buscar rutas, pueblos, puntos de interés…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {filters.map((filter, index) => (
            <View key={filter} style={[styles.filter, index === 0 && styles.filterActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{filter}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Rutas disponibles</Text>
          <Text style={styles.resultCount}>{developmentRoutes.length}</Text>
        </View>

        {developmentRoutes.map((route) => (
          <View key={route.id} style={styles.routeWrap}>
            <FeaturedRouteCard
              route={route}
              onPress={() => router.push({ pathname: '/routes/[slug]', params: { slug: route.slug } })}
            />
          </View>
        ))}

        <View style={styles.dataNotice}>
          <Text style={styles.dataNoticeTitle}>Catálogo en validación</Text>
          <Text style={styles.dataNoticeBody}>Los elementos marcados como datos de desarrollo no se publicarán como rutas verificadas hasta completar su validación editorial y de seguridad.</Text>
        </View>
      </ScrollView>
      <PrimaryTabBar active="Explorar" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingHorizontal: spacing[20], paddingBottom: 126 },
  heading: { marginTop: spacing[8], marginBottom: spacing[20] },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.7 },
  title: { color: colors.ink, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[4], maxWidth: 340 },
  searchBox: { height: 54, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing[16] },
  searchGlyph: { color: colors.olive900, fontSize: 23, marginRight: spacing[8] },
  searchInput: { flex: 1, color: colors.ink, fontSize: 13 },
  filters: { gap: spacing[8], paddingVertical: spacing[16] },
  filter: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  filterActive: { backgroundColor: colors.olive900, borderColor: colors.olive900 },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[12] },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  resultCount: { minWidth: 30, textAlign: 'center', color: colors.olive900, backgroundColor: colors.oliveWash, borderRadius: radius.pill, paddingHorizontal: spacing[8], paddingVertical: 5, fontWeight: '900' },
  routeWrap: { marginBottom: spacing[20] },
  dataNotice: { borderRadius: radius.lg, backgroundColor: colors.limestone, padding: spacing[16] },
  dataNoticeTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  dataNoticeBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: spacing[4] },
});
