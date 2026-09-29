import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { colors, radius, spacing } from '../../../src/theme/tokens';

function numberParam(value: string | string[] | undefined): number {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = Number(raw);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatElapsed(totalSeconds: number): string {
  const safe = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(safe / 3600);
  const minutes = Math.floor((safe % 3600) / 60);
  const seconds = safe % 60;

  return [hours, minutes, seconds]
    .map((value) => value.toString().padStart(2, '0'))
    .join(':');
}

export default function ActivitySummaryScreen() {
  const params = useLocalSearchParams<{
    slug?: string;
    distanceMeters?: string;
    elapsedSeconds?: string;
    elevationGainMeters?: string;
    discoveryCount?: string;
  }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(params.slug);

  if (!route) {
    return null;
  }

  const distanceKm = numberParam(params.distanceMeters) / 1000;
  const elapsedSeconds = numberParam(params.elapsedSeconds);
  const elevationGainMeters = numberParam(params.elevationGainMeters);
  const discoveryCount = Math.max(0, Math.floor(numberParam(params.discoveryCount)));

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>¡AVENTURA COMPLETADA!</Text>
          <Text style={styles.title}>{route.title}</Text>
          <Text style={styles.subtitle}>Resumen real de esta sesión en {route.municipalityName}</Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distanceKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{formatElapsed(elapsedSeconds)}</Text>
            <Text style={styles.statLabel}>tiempo</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>+{Math.round(elevationGainMeters)}</Text>
            <Text style={styles.statLabel}>m</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Descubrimientos</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoValue}>{discoveryCount}</Text>
            <Text style={styles.infoText}>desbloqueados durante esta sesión</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Progresión</Text>
          <View style={styles.pendingCard}>
            <Text style={styles.pendingTitle}>Recompensas pendientes de integración</Text>
            <Text style={styles.pendingBody}>
              XP, insignias y colección no se simulan en este resumen. Se conectarán al sistema
              persistente de progresión cuando el gate de actividad física esté cerrado.
            </Text>
          </View>
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
  scrollContent: { padding: spacing[20], paddingBottom: 160 },
  header: { alignItems: 'center', marginTop: spacing[32], marginBottom: spacing[32] },
  eyebrow: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.5, marginBottom: spacing[8] },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900', textAlign: 'center', marginBottom: spacing[4] },
  subtitle: { color: colors.muted, fontSize: 14, textAlign: 'center' },
  statsCard: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[20], borderWidth: 1, borderColor: colors.border, marginBottom: spacing[32], justifyContent: 'space-around', alignItems: 'center' },
  statItem: { alignItems: 'center', flex: 1 },
  statValue: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: 2 },
  statDivider: { width: 1, height: 30, backgroundColor: colors.border },
  section: { marginBottom: spacing[28] },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900', marginBottom: spacing[12] },
  infoCard: { flexDirection: 'row', alignItems: 'baseline', gap: spacing[8], backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[20], borderWidth: 1, borderColor: colors.border },
  infoValue: { color: colors.olive900, fontSize: 28, fontWeight: '900' },
  infoText: { color: colors.muted, fontSize: 13, fontWeight: '700', flex: 1 },
  pendingCard: { backgroundColor: colors.white, borderRadius: radius.lg, padding: spacing[20], borderWidth: 1, borderColor: colors.border },
  pendingTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  pendingBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.limestone, padding: spacing[20], borderTopWidth: 1, borderTopColor: colors.border },
  primaryButton: { backgroundColor: colors.olive900, borderRadius: radius.md, paddingVertical: spacing[16], alignItems: 'center', marginBottom: spacing[12] },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  secondaryButton: { backgroundColor: 'transparent', borderRadius: radius.md, paddingVertical: spacing[12], alignItems: 'center' },
  secondaryButtonText: { color: colors.olive900, fontSize: 14, fontWeight: '800' },
});
