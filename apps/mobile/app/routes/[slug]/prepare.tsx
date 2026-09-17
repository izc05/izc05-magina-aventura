import { evaluateOfflinePackage } from '@magina-aventura/offline-sync';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../../src/activity/activity-runtime';
import type { LocationPermissionState } from '../../../src/activity/location-provider';
import { BrandMark } from '../../../src/components/branding/BrandMark';
import { developmentRouteMapRepository } from '../../../src/features/routes/development-route-map-repository';
import {
  presentPreparation,
  type PrepareOfflineState,
  type ReadinessTone,
} from '../../../src/features/routes/prepare-presenter';
import { durationLabel } from '../../../src/features/routes/route-utils';
import { useRouteBySlug } from '../../../src/features/routes/use-route-catalog';
import { expoRoutePackagePort } from '../../../src/offline/expo-route-package-port';
import { colors, radius, shadow, spacing, typography } from '../../../src/theme/tokens';

export default function PrepareRouteAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = useRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';
  const [offlineState, setOfflineState] = useState<PrepareOfflineState>('unavailable');
  const [permissions, setPermissions] = useState<LocationPermissionState>();
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadState() {
      try {
        const permissionState = await activityRuntime.getPermissionState();
        if (active) setPermissions(permissionState);
      } catch {
        if (active) setPermissions(undefined);
      }

      if (!routeSlug) return;

      try {
        const manifest = await developmentRouteMapRepository.getOfflineManifest(routeSlug);
        if (!active) return;
        if (!manifest) {
          setOfflineState('unavailable');
          return;
        }

        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);
        if (active) setOfflineState(evaluateOfflinePackage(installed, manifest));
      } catch {
        if (active) setOfflineState('error');
      }
    }

    void loadState();
    return () => {
      active = false;
    };
  }, [routeSlug]);

  const presentation = useMemo(
    () => presentPreparation(offlineState, permissions),
    [offlineState, permissions],
  );

  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centered}>
          <BrandMark size={74} framed inverse />
          <Text style={styles.notFoundTitle}>Ruta no disponible</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const currentRoute = route;

  async function prepareAndStart() {
    if (busy) return;
    setBusy(true);
    setErrorMessage(null);

    try {
      let nextPermissions = await activityRuntime.getPermissionState();
      if (
        !nextPermissions.servicesEnabled ||
        !nextPermissions.foregroundGranted ||
        !nextPermissions.backgroundGranted
      ) {
        nextPermissions = await activityRuntime.requestPermissions();
        setPermissions(nextPermissions);
      }

      if (!nextPermissions.servicesEnabled) {
        setErrorMessage('Activa la ubicación del teléfono y vuelve a intentarlo.');
        return;
      }
      if (!nextPermissions.foregroundGranted) {
        setErrorMessage('Necesitamos permiso de ubicación para registrar la aventura.');
        return;
      }
      if (!nextPermissions.backgroundGranted) {
        setErrorMessage('Activa “Permitir siempre” para registrar con la pantalla bloqueada.');
        return;
      }

      const payload = await developmentRouteMapRepository.getMapPayload(currentRoute.slug);
      const routeLine = payload?.line.geometry.coordinates ?? [];

      await activityRuntime.start(currentRoute, routeLine);
      router.replace({ pathname: '/adventure/[slug]', params: { slug: currentRoute.slug } });
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : 'No se pudo iniciar el GPS.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.sun} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <BrandMark size={54} inverse />
          <Text style={styles.eyebrow}>ANTES DE SALIR</Text>
          <Text style={styles.title}>Prepara tu aventura</Text>
          <Text style={styles.routeName}>{currentRoute.title}</Text>
          <Text style={styles.routePlace}>{currentRoute.municipalityNames.join(", ")}</Text>
        </View>

        <View style={styles.summaryCard}>
          <Metric value={`${(currentRoute.distanceKm ?? 0).toFixed(1).replace('.', ',')} km`} label="Distancia" />
          <Metric value={`+${currentRoute.elevationGainM} m`} label="Desnivel" />
          <Metric value={durationLabel(currentRoute.durationMinutes ?? 0)} label="Duración" />
        </View>

        <Text style={styles.sectionEyebrow}>ANTES DE EMPEZAR</Text>
        <Text style={styles.sectionTitle}>¿Estamos listos?</Text>
        <Text style={styles.sectionBody}>
          Revisamos ubicación, seguimiento con la pantalla bloqueada y disponibilidad sin conexión antes de iniciar el recorrido.
        </Text>

        <View style={styles.readinessCard}>
          {presentation.checks.map((check) => (
            <View key={check.id} style={styles.readinessRow}>
              <View style={styles.readinessLeft}>
                <View style={[styles.dot, dotStyle(check.tone)]} />
                <Text style={styles.readinessLabel}>{check.label}</Text>
              </View>
              <Text style={[styles.readinessState, stateStyle(check.tone)]}>{check.state}</Text>
            </View>
          ))}
        </View>

        <View style={styles.infoCard}>
          <Text style={styles.infoEyebrow}>PREPARADA PARA ZONAS SIN COBERTURA</Text>
          <Text style={styles.infoTitle}>El recorrido no depende de Internet</Text>
          <Text style={styles.infoBody}>
            Durante la aventura, las posiciones se guardan primero en el teléfono. Si pierdes cobertura, el seguimiento puede continuar. Cuando exista un trazado oficial verificado podremos usarlo también para progreso y avisos de salida de ruta; si no existe, la app no inventará el recorrido.
          </Text>
        </View>

        {errorMessage ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          style={({ pressed }) => [styles.startButton, (pressed || busy) && styles.startButtonPressed]}
          onPress={() => void prepareAndStart()}
        >
          <View>
            <Text style={styles.startButtonText}>
              {busy ? 'Preparando GPS…' : presentation.canStartGps ? 'Iniciar aventura' : 'Preparar GPS e iniciar'}
            </Text>
            <Text style={styles.startButtonCaption}>
              {presentation.canStartGps ? 'GPS listo · seguimiento con pantalla bloqueada' : 'Te pediremos solo los permisos necesarios'}
            </Text>
          </View>
          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </View>
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

function dotStyle(tone: ReadinessTone) {
  if (tone === 'ready') return styles.dotReady;
  if (tone === 'review') return styles.dotReview;
  return styles.dotPending;
}

function stateStyle(tone: ReadinessTone) {
  if (tone === 'ready') return styles.stateReady;
  if (tone === 'review') return styles.stateReview;
  return styles.statePending;
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: 132 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing[24] },
  hero: {
    minHeight: 290,
    backgroundColor: colors.olive900,
    padding: spacing[20],
    paddingTop: spacing[16],
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute', right: 34, top: 48, width: 82, height: 82,
    borderRadius: 41, backgroundColor: colors.aoveGold, opacity: 0.92,
  },
  backButton: {
    position: 'absolute', left: spacing[16], top: spacing[16], width: 44, height: 44,
    borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center',
  },
  backText: { color: colors.olive900, fontSize: 31, lineHeight: 31 },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.6, marginTop: spacing[20] },
  title: { color: colors.white, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  routeName: { color: colors.limestone, fontSize: 16, fontWeight: '800', marginTop: spacing[12] },
  routePlace: { color: colors.limestone, fontSize: 12, opacity: 0.8, marginTop: 2 },
  summaryCard: {
    marginHorizontal: spacing[20], marginTop: -22, borderRadius: radius.lg,
    backgroundColor: colors.white, flexDirection: 'row', padding: spacing[16], ...shadow.card,
  },
  metric: { flex: 1, alignItems: 'center' },
  metricValue: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 9, marginTop: 4 },
  sectionEyebrow: { marginTop: spacing[32], marginHorizontal: spacing[20], color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 1.3 },
  sectionTitle: { marginHorizontal: spacing[20], marginTop: 4, color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  sectionBody: { marginHorizontal: spacing[20], marginTop: spacing[8], color: colors.muted, fontSize: 13, lineHeight: 19 },
  readinessCard: {
    margin: spacing[20], marginBottom: 0, borderRadius: radius.lg, backgroundColor: colors.white,
    borderWidth: 1, borderColor: colors.border, overflow: 'hidden', ...shadow.card,
  },
  readinessRow: {
    minHeight: 62, paddingHorizontal: spacing[16], flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  readinessLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: spacing[12] },
  dotReady: { backgroundColor: colors.olive700 },
  dotReview: { backgroundColor: colors.aoveGold },
  dotPending: { backgroundColor: '#B5AA98' },
  readinessLabel: { color: colors.ink, fontSize: 13, fontWeight: '800' },
  readinessState: { fontSize: 10, fontWeight: '900' },
  stateReady: { color: colors.olive900 },
  stateReview: { color: colors.earth },
  statePending: { color: colors.muted },
  infoCard: { margin: spacing[20], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  infoEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  infoTitle: { color: colors.white, fontSize: 17, fontWeight: '900', marginTop: spacing[8] },
  infoBody: { color: colors.limestone, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  errorCard: { marginHorizontal: spacing[20], borderRadius: radius.md, backgroundColor: colors.goldWash, padding: spacing[16] },
  errorText: { color: colors.earth, fontSize: 12, fontWeight: '800', lineHeight: 18 },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.white, padding: spacing[16], borderTopWidth: 1, borderTopColor: colors.border },
  startButton: { minHeight: 68, borderRadius: radius.lg, backgroundColor: colors.olive900, paddingHorizontal: spacing[20], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startButtonPressed: { opacity: 0.75 },
  startButtonText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  startButtonCaption: { color: colors.limestone, fontSize: 10, marginTop: 3 },
  startArrow: { color: colors.aoveGold, fontSize: 25, fontWeight: '900' },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.ink, fontWeight: '800' },
  notFoundTitle: { color: colors.ink, fontSize: 21, fontWeight: '900', marginTop: spacing[20] },
});


