import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { presentActiveAdventure } from '../../src/features/adventure/active-adventure-presenter';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { colors, radius, spacing } from '../../src/theme/tokens';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return null;
  }

  const presentation = presentActiveAdventure(route);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.map}>
        <View style={styles.gridOne} />
        <View style={styles.gridTwo} />
        <View style={styles.routeLineA} />
        <View style={styles.routeLineB} />
        <View style={styles.userRadius} />
        <View style={styles.userDot} />
        <View style={styles.mapModeBadge}>
          <Text style={styles.mapModeText}>VISTA DEMO</Text>
        </View>
      </View>

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View style={styles.routeCopy}>
            <Text style={styles.routeName}>{presentation.routeTitle}</Text>
            <Text style={styles.routePlace}>{presentation.place}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>{presentation.progress}</Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricValue}>{presentation.distance}</Text>
            <Text style={styles.metricLabel}>Distancia</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>{presentation.elapsed}</Text>
            <Text style={styles.metricLabel}>Tiempo</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>{presentation.elevation}</Text>
            <Text style={styles.metricLabel}>Desnivel</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.exitButton} onPress={() => router.back()}>
        <Text style={styles.exitButtonText}>×</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>{presentation.modeLabel}</Text>
        <Text style={styles.bottomTitle}>Estado de la aventura</Text>
        <View style={styles.objectiveRow}>
          <View style={styles.objectiveIcon}>
            <Text style={styles.objectiveIconText}>⌖</Text>
          </View>
          <View style={styles.objectiveCopy}>
            <Text style={styles.objectiveName}>{presentation.objectiveTitle}</Text>
            <Text style={styles.objectiveDistance}>{presentation.objectiveMeta}</Text>
          </View>
        </View>

        <View style={styles.rewardPreview}>
          <Text style={styles.rewardPreviewLabel}>RECOMPENSA DE LA RUTA</Text>
          <Text style={styles.rewardPreviewValue}>{presentation.rewardPreview}</Text>
        </View>

        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton} onPress={() => router.back()}>
            <Text style={styles.actionButtonText}>← Preparación</Text>
          </Pressable>
          <View style={styles.disabledPrimaryButton}>
            <Text style={styles.disabledPrimaryText}>GPS pendiente</Text>
          </View>
          <View style={styles.disabledButton}>
            <Text style={styles.disabledButtonText}>SOS · demo</Text>
          </View>
        </View>

        <Pressable
          style={styles.summaryButton}
          onPress={() =>
            router.push({
              pathname: '/adventure-summary/[slug]',
              params: { slug: route.slug },
            })
          }
        >
          <Text style={styles.summaryButtonText}>Ver resumen demo</Text>
          <Text style={styles.summaryButtonArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  map: { flex: 1, overflow: 'hidden', backgroundColor: colors.limestone },
  gridOne: { position: 'absolute', left: 0, right: 0, top: '44%', height: 1, backgroundColor: colors.border },
  gridTwo: { position: 'absolute', top: 0, bottom: 0, left: '48%', width: 1, backgroundColor: colors.border },
  routeLineA: { position: 'absolute', width: 280, height: 8, borderRadius: radius.pill, backgroundColor: colors.olive700, left: -10, top: '54%', transform: [{ rotate: '-22deg' }] },
  routeLineB: { position: 'absolute', width: 230, height: 8, borderRadius: radius.pill, backgroundColor: colors.olive700, right: -55, top: '42%', transform: [{ rotate: '27deg' }] },
  userRadius: { position: 'absolute', width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: colors.sky, backgroundColor: 'rgba(143,184,200,0.13)', left: '50%', top: '50%', marginLeft: -75, marginTop: -75 },
  userDot: { position: 'absolute', width: 24, height: 24, borderRadius: 12, backgroundColor: colors.olive900, borderWidth: 5, borderColor: colors.white, left: '50%', top: '50%', marginLeft: -12, marginTop: -12 },
  mapModeBadge: { position: 'absolute', top: 210, left: spacing[20], borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  mapModeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  topHud: { position: 'absolute', top: spacing[12], left: spacing[16], right: spacing[16], borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[16], borderWidth: 1, borderColor: colors.border },
  topHudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[12] },
  routeCopy: { flex: 1 },
  routeName: { color: colors.ink, fontSize: 17, fontWeight: '900' },
  routePlace: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressBadge: { borderRadius: radius.pill, backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  progressText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[16], paddingTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border },
  metricValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  exitButton: { position: 'absolute', top: 154, right: spacing[20], width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  exitButtonText: { color: colors.ink, fontSize: 26, fontWeight: '700' },
  bottomCard: { position: 'absolute', left: spacing[16], right: spacing[16], bottom: spacing[16], borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[20], borderWidth: 1, borderColor: colors.border },
  bottomEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  bottomTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: spacing[8] },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[12] },
  objectiveIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  objectiveIconText: { color: colors.olive700, fontSize: 24, fontWeight: '900' },
  objectiveCopy: { flex: 1 },
  objectiveName: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  objectiveDistance: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 3 },
  rewardPreview: { marginTop: spacing[16], paddingTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border },
  rewardPreviewLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  rewardPreviewValue: { color: colors.olive900, fontSize: 14, fontWeight: '900', marginTop: spacing[4] },
  actionRow: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[16] },
  actionButton: { flex: 1.2, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.warmBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing[8] },
  actionButtonText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  disabledPrimaryButton: { flex: 1.2, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.olive900, opacity: 0.52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8] },
  disabledPrimaryText: { color: colors.white, fontSize: 11, fontWeight: '900', textAlign: 'center' },
  disabledButton: { flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.warmBackground, opacity: 0.62, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing[8] },
  disabledButtonText: { color: colors.muted, fontSize: 11, fontWeight: '800', textAlign: 'center' },
  summaryButton: { minHeight: 48, marginTop: spacing[12], borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  summaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  summaryButtonArrow: { color: colors.aoveGold, fontSize: 20, fontWeight: '900' },
});
