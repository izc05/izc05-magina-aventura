import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  municipalRouteInformation,
  municipalRouteInformationViewModel,
} from '../../src/features/routes/municipal-route-information';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

export default function PublicRouteCatalogScreen() {
  const route = municipalRouteInformationViewModel();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
            accessibilityHint="Regresa a la portada pública de Mágina Aventura."
            style={styles.backButton}
            onPress={() => router.replace('/')}
          >
            <Text accessible={false} style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>CATÁLOGO PÚBLICO</Text>
            <Text accessibilityRole="header" style={styles.title}>Rutas de Sierra Mágina</Text>
          </View>
        </View>

        <Text style={styles.intro}>
          Consulta la información publicada y sus límites de verificación. La ficha y sus fuentes se pueden leer sin iniciar sesión.
        </Text>

        <Pressable
          testID="public-route-card"
          accessibilityRole="button"
          accessibilityLabel={`Abrir ficha informativa de ${route.title}`}
          accessibilityHint="Abre la ficha pública con fuentes y avisos de navegación. No requiere iniciar sesión."
          style={styles.routeCard}
          onPress={() =>
            router.push({
              pathname: '/municipal-routes/[slug]',
              params: { slug: municipalRouteInformation.slug },
            })
          }
        >
          <View style={styles.cardHeader}>
            <Text style={styles.pilotBadge}>PILOTO MUNICIPAL</Text>
            <Text style={styles.traceStatus}>{route.traceStatus}</Text>
          </View>
          <Text accessibilityRole="header" style={styles.routeTitle}>{route.title}</Text>
          <Text style={styles.location}>{route.municipality}</Text>
          <Text style={styles.status}>{route.statusLabel}</Text>
          <Text style={styles.statusDetail}>{route.statusDetail}</Text>
          <View style={styles.notice}>
            <Text style={styles.noticeTitle}>Sin navegación GPS</Text>
            <Text style={styles.noticeBody}>{route.gpsNotice}</Text>
            <Text style={styles.noticeBody}>{route.officialDataNotice}</Text>
          </View>
          <View style={styles.actionRow}>
            <Text style={styles.actionText}>Leer ficha y fuentes</Text>
            <Text accessible={false} style={styles.actionArrow}>→</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: spacing[20], paddingTop: spacing[12], paddingBottom: spacing[32] },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  headerCopy: { flex: 1 },
  eyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: colors.ink, fontSize: typography.title, lineHeight: 30, fontWeight: '900', marginTop: spacing[4] },
  intro: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: spacing[20] },
  routeCard: {
    marginTop: spacing[20],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing[20],
  },
  cardHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  pilotBadge: { color: colors.white, backgroundColor: colors.olive900, borderRadius: radius.pill, paddingHorizontal: spacing[12], paddingVertical: spacing[8], fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  traceStatus: { color: colors.olive700, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  routeTitle: { color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '900', marginTop: spacing[16] },
  location: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: spacing[4] },
  status: { color: colors.olive700, fontSize: 12, lineHeight: 18, fontWeight: '900', marginTop: spacing[16] },
  statusDetail: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  notice: { marginTop: spacing[16], borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.earth, backgroundColor: colors.limestone, padding: spacing[12] },
  noticeTitle: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '900' },
  noticeBody: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
  actionRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[12] },
  actionText: { color: colors.olive900, fontSize: 14, lineHeight: 20, fontWeight: '900', textDecorationLine: 'underline' },
  actionArrow: { color: colors.olive900, fontSize: 20, fontWeight: '900' },
});
