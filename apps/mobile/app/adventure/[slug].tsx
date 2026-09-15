import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { colors, radius, spacing } from '../../src/theme/tokens';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return null;
  }

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
        <View style={[styles.discovery, styles.discoveryOne]}><Text style={styles.discoveryText}>🌿</Text></View>
        <View style={[styles.discovery, styles.discoveryTwo]}><Text style={styles.discoveryText}>🏛</Text></View>
        <View style={[styles.discovery, styles.discoveryThree]}><Text style={styles.discoveryText}>🫒</Text></View>
      </View>

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View>
            <Text style={styles.routeName}>{route.title}</Text>
            <Text style={styles.routePlace}>{route.municipalityName}</Text>
          </View>
          <View style={styles.progressBadge}><Text style={styles.progressText}>0 %</Text></View>
        </View>
        <View style={styles.metrics}>
          <View><Text style={styles.metricValue}>0.0 km</Text><Text style={styles.metricLabel}>Distancia</Text></View>
          <View><Text style={styles.metricValue}>00:00</Text><Text style={styles.metricLabel}>Tiempo</Text></View>
          <View><Text style={styles.metricValue}>+0 m</Text><Text style={styles.metricLabel}>Desnivel</Text></View>
        </View>
      </View>

      <Pressable style={styles.exitButton} onPress={() => router.back()}>
        <Text style={styles.exitButtonText}>×</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>MODO SIMULADO · GPS EN PLAN 04</Text>
        <Text style={styles.bottomTitle}>Siguiente objetivo</Text>
        <View style={styles.objectiveRow}>
          <View style={styles.objectiveIcon}><Text style={styles.objectiveIconText}>🌿</Text></View>
          <View style={styles.objectiveCopy}>
            <Text style={styles.objectiveName}>Descubrimiento de prueba</Text>
            <Text style={styles.objectiveDistance}>140 m · Flora</Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton}><Text style={styles.actionButtonText}>⚑ Ruta</Text></Pressable>
          <Pressable style={styles.pauseButton}><Text style={styles.pauseButtonText}>Ⅱ Pausar</Text></Pressable>
          <Pressable style={styles.actionButton}><Text style={styles.actionButtonText}>! SOS</Text></Pressable>
        </View>
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
  discovery: { position: 'absolute', width: 52, height: 52, borderRadius: 26, backgroundColor: colors.white, borderWidth: 3, borderColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  discoveryOne: { left: '23%', top: '39%' },
  discoveryTwo: { right: '20%', top: '29%' },
  discoveryThree: { right: '18%', top: '57%' },
  discoveryText: { fontSize: 22 },
  topHud: { position: 'absolute', top: spacing[12], left: spacing[16], right: spacing[16], borderRadius: radius.lg, backgroundColor: colors.white, padding: spacing[16], borderWidth: 1, borderColor: colors.border },
  topHudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
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
  objectiveIconText: { fontSize: 22 },
  objectiveCopy: { flex: 1 },
  objectiveName: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  objectiveDistance: { color: colors.olive700, fontSize: 12, fontWeight: '800', marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[16] },
  actionButton: { flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.warmBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  actionButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  pauseButton: { flex: 1.2, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  pauseButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
});
