import { Redirect, useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../../src/activity/activity-runtime';
import { routePresentationViewModel } from '../../../src/features/routes/route-presentation-view-model';
import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { colors, radius, spacing } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/context/AuthContext';

export default function ActivitySummaryScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return <Redirect href="/" />;
  }

  const presentation = routePresentationViewModel(
    route,
    route.developmentFixture ? 'development-simulation' : 'unverified',
  );
  const technicalGpsQa = presentation.mode === 'technical-gps-qa';
  const currentActivity = user ? activityRuntime.current(user.id) : null;
  const finished = currentActivity?.session.state === 'FINISHED' ? currentActivity : null;
  const snapshot = finished?.snapshot;
  const distanceKm = snapshot ? snapshot.validDistanceMeters / 1000 : null;
  const elapsedSeconds = snapshot?.totalElapsedSeconds ?? null;
  const elapsedHours = elapsedSeconds === null ? null : Math.floor(elapsedSeconds / 3600);
  const elapsedMinutes = elapsedSeconds === null ? null : Math.floor((elapsedSeconds % 3600) / 60);
  const elapsedDisplay = elapsedHours === null || elapsedMinutes === null
    ? '—'
    : `${String(elapsedHours).padStart(2, '0')}:${String(elapsedMinutes).padStart(2, '0')}`;

  if (isLoading || !user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.guestGate}>
          <Text accessibilityRole="header" style={styles.title}>
            {isLoading ? 'Comprobando tu sesión…' : 'Resumen GPS personal'}
          </Text>
          <Text style={styles.subtitle}>
            Inicia sesión para consultar los datos GPS guardados. Las fichas públicas siguen disponibles sin cuenta.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión para consultar el resumen GPS"
            accessibilityState={{ disabled: isLoading }}
            disabled={isLoading}
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/login', params: { returnTo: 'summary', slug: route.slug } })}
          >
            <Text style={styles.primaryButtonText}>Iniciar sesión o registrarse</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a rutas públicas"
            style={styles.secondaryButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.secondaryButtonText}>Volver a rutas públicas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>
            {finished
              ? technicalGpsQa ? 'SESIÓN TÉCNICA GPS FINALIZADA' : 'AVENTURA FINALIZADA'
              : 'NO HAY ACTIVIDAD FINALIZADA'}
          </Text>
          <Text style={styles.title}>{presentation.title}</Text>
          <Text style={styles.subtitle}>
            {!finished
              ? 'No hay una captura GPS finalizada para mostrar.'
              : technicalGpsQa
                ? 'Métricas reales de GPS · sin ruta ni checkpoints verificados'
                : `Recorrido guardado · ${presentation.municipalityName ?? 'contenido en preparación'}`}
          </Text>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{distanceKm === null ? '—' : distanceKm.toFixed(2)}</Text>
            <Text style={styles.statLabel}>km GPS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{elapsedDisplay}</Text>
            <Text style={styles.statLabel}>tiempo GPS</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{finished?.session.lastProcessedSequence ?? '—'}</Text>
            <Text style={styles.statLabel}>muestras GPS</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {technicalGpsQa ? 'Captura técnica del dispositivo' : 'Resumen de la actividad'}
          </Text>
          <Text style={styles.subtitle}>
            {!finished
              ? 'Solo se muestran métricas después de finalizar una captura GPS.'
              : technicalGpsQa
                ? 'La distancia, el tiempo y las muestras proceden del motor GPS. No representan una ruta verificada ni generan recompensas.'
                : 'Los datos de actividad se muestran sin atribuir recompensas no verificadas.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable style={styles.primaryButton} onPress={() => router.push('/profile' as any)}>
          <Text style={styles.primaryButtonText}>Ver mi Pasaporte</Text>
        </Pressable>
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/')}>
          <Text style={styles.secondaryButtonText}>Volver al inicio</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  guestGate: { flex: 1, justifyContent: 'center', padding: spacing[20] },
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
  footer: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.limestone, padding: spacing[20], borderTopWidth: 1, borderTopColor: colors.border },
  primaryButton: { backgroundColor: colors.olive900, borderRadius: radius.md, paddingVertical: spacing[16], alignItems: 'center', marginBottom: spacing[12] },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '800' },
  secondaryButton: { backgroundColor: 'transparent', borderRadius: radius.md, paddingVertical: spacing[12], alignItems: 'center' },
  secondaryButtonText: { color: colors.olive900, fontSize: 14, fontWeight: '800' },
});
