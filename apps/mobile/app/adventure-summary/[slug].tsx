import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { presentAdventureSummary } from '../../src/features/adventure/adventure-summary-presenter';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

export default function AdventureSummaryScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Resumen no disponible</Text>
          <Text style={styles.notFoundBody}>No encontramos esta versión de la ruta.</Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const summary = presentAdventureSummary(route);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.mountainBack} />
          <View style={styles.mountainFront} />
          <View style={styles.demoBadge}>
            <Text style={styles.demoBadgeText}>RESUMEN DEMO</Text>
          </View>
          <Text style={styles.eyebrow}>MÁGINA AVENTURA</Text>
          <Text style={styles.title}>{summary.title}</Text>
          <Text style={styles.routeTitle}>{summary.routeTitle}</Text>
          <Text style={styles.place}>{summary.place}</Text>
        </View>

        <View style={styles.metricsCard}>
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{summary.distance}</Text>
            <Text style={styles.metricLabel}>Distancia</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{summary.elapsed}</Text>
            <Text style={styles.metricLabel}>Tiempo</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.metric}>
            <Text style={styles.metricValue}>{summary.elevation}</Text>
            <Text style={styles.metricLabel}>Desnivel</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>ACTIVIDAD REGISTRADA</Text>
          <Text style={styles.sectionTitle}>Todavía no guardamos una actividad real</Text>
          <Text style={styles.sectionBody}>
            Esta pantalla permite probar el cierre completo de la experiencia antes de conectar el motor GPS y la validación de actividad.
          </Text>
        </View>

        <View style={styles.recordedGrid}>
          <View style={styles.recordedCard}>
            <Text style={styles.recordedIcon}>✦</Text>
            <Text style={styles.recordedValue}>{summary.xpRecorded}</Text>
            <Text style={styles.recordedLabel}>Progreso de cuenta</Text>
          </View>
          <View style={styles.recordedCard}>
            <Text style={styles.recordedIcon}>●</Text>
            <Text style={styles.recordedValue}>{summary.olivesRecorded}</Text>
            <Text style={styles.recordedLabel}>Saldo de recompensas</Text>
          </View>
        </View>

        <View style={styles.targetCard}>
          <Text style={styles.targetEyebrow}>RECOMPENSA OBJETIVO DE LA RUTA</Text>
          <Text style={styles.targetValue}>{summary.targetReward}</Text>
          <Text style={styles.targetBody}>
            Se concederá únicamente cuando exista una actividad real validada por las reglas del motor de aventura.
          </Text>
        </View>

        <View style={styles.notice}>
          <Text style={styles.noticeIcon}>i</Text>
          <Text style={styles.noticeText}>{summary.note}</Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>

        <Pressable
          style={styles.secondaryButton}
          onPress={() =>
            router.replace({
              pathname: '/routes/[slug]',
              params: { slug: route.slug },
            })
          }
        >
          <Text style={styles.secondaryButtonText}>Ver de nuevo la ruta</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[40] },
  hero: { minHeight: 310, overflow: 'hidden', backgroundColor: colors.olive900, padding: spacing[24], justifyContent: 'flex-end' },
  sun: { position: 'absolute', width: 128, height: 128, borderRadius: 64, backgroundColor: colors.aoveGold, right: 24, top: 34, opacity: 0.9 },
  mountainBack: { position: 'absolute', width: 360, height: 180, borderRadius: 54, backgroundColor: colors.olive700, right: -120, bottom: -75, transform: [{ rotate: '17deg' }] },
  mountainFront: { position: 'absolute', width: 330, height: 160, borderRadius: 54, backgroundColor: colors.olive500, left: -105, bottom: -88, transform: [{ rotate: '-13deg' }] },
  demoBadge: { position: 'absolute', top: spacing[20], left: spacing[20], borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  demoBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  eyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.white, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  routeTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: spacing[12] },
  place: { color: colors.limestone, fontSize: 13, marginTop: spacing[4] },
  metricsCard: { marginHorizontal: spacing[20], marginTop: -24, padding: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', ...shadow.card },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: spacing[4] },
  divider: { width: 1, height: 38, backgroundColor: colors.border, marginHorizontal: spacing[8] },
  section: { paddingHorizontal: spacing[20], marginTop: spacing[32] },
  sectionEyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900', marginTop: spacing[4] },
  sectionBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  recordedGrid: { flexDirection: 'row', gap: spacing[12], paddingHorizontal: spacing[20], marginTop: spacing[20] },
  recordedCard: { flex: 1, minHeight: 132, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: spacing[16] },
  recordedIcon: { color: colors.aoveGold, fontSize: 20, fontWeight: '900' },
  recordedValue: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: spacing[12] },
  recordedLabel: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: spacing[4] },
  targetCard: { marginHorizontal: spacing[20], marginTop: spacing[20], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  targetEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  targetValue: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: spacing[8] },
  targetBody: { color: colors.limestone, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  notice: { flexDirection: 'row', alignItems: 'center', gap: spacing[12], marginHorizontal: spacing[20], marginTop: spacing[20], padding: spacing[16], borderRadius: radius.md, backgroundColor: colors.limestone },
  noticeIcon: { width: 28, height: 28, borderRadius: 14, backgroundColor: colors.olive900, color: colors.white, textAlign: 'center', textAlignVertical: 'center', fontWeight: '900' },
  noticeText: { flex: 1, color: colors.ink, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  primaryButton: { marginHorizontal: spacing[20], marginTop: spacing[24], minHeight: 58, borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  primaryButtonArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  secondaryButton: { marginHorizontal: spacing[20], marginTop: spacing[12], minHeight: 50, borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.olive900, fontSize: 14, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  notFoundBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
});
