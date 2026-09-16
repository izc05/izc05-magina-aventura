import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../src/activity/activity-runtime';
import { presentActiveAdventure } from '../../src/features/adventure/active-adventure-presenter';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

export default function AdventureSummaryScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const [trackCount, setTrackCount] = useState(0);
  const state = activityRuntime.current();

  useEffect(() => {
    let active = true;
    void activityRuntime.loadTrack().then((track) => {
      if (active) setTrackCount(track.length);
    });
    return () => {
      active = false;
    };
  }, []);

  const presentation = useMemo(
    () => (route ? presentActiveAdventure(route, state) : null),
    [route, state],
  );

  if (!route || !presentation) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Resumen no disponible</Text>
          <Text style={styles.notFoundBody}>
            No encontramos una actividad asociada a esta ruta en el dispositivo.
          </Text>
          <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const isRealFinished = state?.session.state === 'FINISHED';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {isRealFinished ? 'ACTIVIDAD GUARDADA' : 'RESUMEN LOCAL'}
            </Text>
          </View>
          <Text style={styles.eyebrow}>MÁGINA AVENTURA</Text>
          <Text style={styles.title}>
            {isRealFinished ? 'Aventura completada' : 'Resumen disponible'}
          </Text>
          <Text style={styles.routeTitle}>{route.title}</Text>
          <Text style={styles.place}>{route.municipalityName}</Text>
        </View>

        <View style={styles.metricsCard}>
          <Metric value={presentation.distance} label="Distancia real" />
          <Metric value={presentation.elapsed} label="Tiempo" />
          <Metric value={presentation.elevation} label="Desnivel +" />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionEyebrow}>REGISTRO DE LA AVENTURA</Text>
          <Text style={styles.sectionTitle}>{trackCount} puntos GPS guardados</Text>
          <Text style={styles.sectionBody}>
            El recorrido está guardado en este teléfono. Puedes terminar la aventura incluso sin cobertura y conservar sus datos hasta que la sincronización esté disponible.
          </Text>
        </View>

        <View style={styles.statusGrid}>
          <StatusCard label="Estado" value={isRealFinished ? 'Finalizada' : 'Recuperada'} />
          <StatusCard label="Guardado" value="En este teléfono" />
          <StatusCard label="Recompensa" value="Pendiente" />
        </View>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardEyebrow}>RECOMPENSA PREVISTA</Text>
          <Text style={styles.rewardValue}>{presentation.rewardPreview}</Text>
          <Text style={styles.rewardBody}>
            La recompensa queda pendiente hasta que el recorrido pueda validarse. Así evitamos duplicados y mantenemos el progreso de cada aventura fiable.
          </Text>
        </View>

        <Pressable style={styles.primaryButton} onPress={() => router.replace('/')}>
          <Text style={styles.primaryButtonText}>Volver al inicio</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function StatusCard({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.statusCard}>
      <Text style={styles.statusLabel}>{label}</Text>
      <Text style={styles.statusValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[40] },
  hero: { minHeight: 300, overflow: 'hidden', backgroundColor: colors.olive900, padding: spacing[24], justifyContent: 'flex-end' },
  sun: { position: 'absolute', width: 126, height: 126, borderRadius: 63, backgroundColor: colors.aoveGold, right: 26, top: 38, opacity: 0.9 },
  badge: { position: 'absolute', top: spacing[20], left: spacing[20], borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  badgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  eyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.white, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  routeTitle: { color: colors.white, fontSize: 18, fontWeight: '800', marginTop: spacing[12] },
  place: { color: colors.limestone, fontSize: 13, marginTop: spacing[4] },
  metricsCard: { marginHorizontal: spacing[20], marginTop: -24, padding: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, flexDirection: 'row', ...shadow.card },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: spacing[4] },
  section: { paddingHorizontal: spacing[20], marginTop: spacing[32] },
  sectionEyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900', marginTop: spacing[4] },
  sectionBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  statusGrid: { flexDirection: 'row', gap: spacing[8], paddingHorizontal: spacing[20], marginTop: spacing[20] },
  statusCard: { flex: 1, minHeight: 88, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: spacing[12] },
  statusLabel: { color: colors.muted, fontSize: 9, fontWeight: '800' },
  statusValue: { color: colors.ink, fontSize: 12, fontWeight: '900', marginTop: spacing[8] },
  rewardCard: { marginHorizontal: spacing[20], marginTop: spacing[20], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  rewardEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  rewardValue: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: spacing[8] },
  rewardBody: { color: colors.limestone, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  primaryButton: { marginHorizontal: spacing[20], marginTop: spacing[24], minHeight: 58, borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  primaryButtonArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900', textAlign: 'center' },
  notFoundBody: { color: colors.muted, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: spacing[8] },
});
