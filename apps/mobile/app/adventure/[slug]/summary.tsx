import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { colors, radius, spacing } from '../../../src/theme/tokens';
 import { activityRuntime } from '../../../src/activity/activity-runtime';

export default function ActivitySummaryScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return null;
  }

  const finished = activityRuntime.current();
  const snapshot = finished?.snapshot;
  const distanceKm = (snapshot?.validDistanceMeters ?? 0) / 1000;
  const elapsedSeconds = snapshot?.totalElapsedSeconds ?? 0;
  const elapsedHours = Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedDisplay = `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AVENTURA FINALIZADA</Text>
          <Text style={styles.title}>{route.title}</Text>
          <Text style={styles.subtitle}>Recorrido guardado · {route.municipalityName}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{elapsedDisplay}</Text>
            <Text style={styles.statLabel}>horas</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{finished?.session.lastProcessedSequence ?? 0}</Text>
            <Text style={styles.statLabel}>muestras GPS</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resumen de esta prueba</Text>
          <Text style={styles.subtitle}>
            Los datos mostrados proceden de la sesión GPS real. Las recompensas y colecciones se activarán cuando el Game Kit vuelva a entrar en el roadmap.
          </Text>
        </View>

      </ScrollView>

      <View style={styles.footer}>
        <Pressable 
          style={styles.primaryButton} 
          onPress={() => router.push('/profile' as any)}
        >
          <Text style={styles.primaryButtonText}>Ver mi Pasaporte</Text>
        </Pressable>
        <Pressable 
          style={styles.secondaryButton} 
          onPress={() => router.push('/')}
        >
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  scrollContent: { padding: spacing[20], paddingBottom: 120 },
  header: { alignItems: 'center', marginTop: spacing[32], marginBottom: spacing[32] },
  eyebrow: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: spacing[8] },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: spacing[4] },
  subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  statsCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[20], borderWidth: 1, borderColor: colors.border, marginBottom: spacing[32], justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center' },
  statValue: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  section: { marginBottom: spacing[32] },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginBottom: spacing[16] },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.limestone, padding: spacing[20], borderTopWidth: 1, borderTopColor: colors.border },
  primaryButton: { backgroundColor: colors.olive900, borderRadius: radius.md, paddingVertical: spacing[16], alignItems: 'center', marginBottom: spacing[12] },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  secondaryButton: { backgroundColor: 'transparent', borderRadius: radius.md, paddingVertical: spacing[12], alignItems: 'center' },
  secondaryButtonText: { color: colors.olive900, fontSize: 14, fontWeight: '800' },
});
