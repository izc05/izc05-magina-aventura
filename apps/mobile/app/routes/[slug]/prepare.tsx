import { evaluateOfflinePackage, type OfflinePackageState } from '@magina-aventura/offline-sync';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { activityRuntime } from '../../../src/activity/activity-runtime';
import type { LocationPermissionState } from '../../../src/activity/location-provider';
import { developmentRouteMapRepository } from '../../../src/features/routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { expoRoutePackagePort } from '../../../src/offline/expo-route-package-port';
import { colors, radius, spacing, typography } from '../../../src/theme/tokens';

type PrepareOfflineState = OfflinePackageState | 'unavailable' | 'error';

const offlineCopy: Record<PrepareOfflineState, string> = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
  unavailable: 'No disponible',
  error: 'Error de lectura',
};

function permissionCopy(
  permissions: LocationPermissionState | null,
): [string, string] {
  if (!permissions) return ['Comprobando…', 'Comprobando…'];
  if (!permissions.servicesEnabled) return ['GPS desactivado', 'No disponible'];

  return [
    permissions.foregroundGranted ? 'Activa' : 'Pendiente',
    permissions.backgroundGranted
      ? 'Activo'
      : permissions.foregroundGranted
        ? 'Solo primer plano'
        : 'Pendiente',
  ];
}

export default function PrepareRouteAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';
  const [offlineState, setOfflineState] = useState<PrepareOfflineState>('unavailable');
  const [permissions, setPermissions] = useState<LocationPermissionState | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [requestingPermissions, setRequestingPermissions] = useState(false);

  useEffect(() => {
    if (!routeSlug) return;

    let active = true;

    async function loadReadiness() {
      try {
        const [permissionState, manifest] = await Promise.all([
          activityRuntime.getPermissionState(),
          developmentRouteMapRepository.getOfflineManifest(routeSlug),
        ]);

        if (!active) return;
        setPermissions(permissionState);

        if (!manifest) {
          setOfflineState('unavailable');
          return;
        }

        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);

        if (active) {
          setOfflineState(evaluateOfflinePackage(installed, manifest));
        }
      } catch {
        if (active) {
          setOfflineState('error');
          setPermissionError('No hemos podido comprobar el estado del GPS.');
        }
      }
    }

    void loadReadiness();

    return () => {
      active = false;
    };
  }, [routeSlug]);

  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Ruta no disponible</Text>
          <Text style={styles.notFoundBody}>No encontramos esta versión de la ruta.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const [foregroundCopy, backgroundCopy] = permissionCopy(permissions);
  const offlineReady = offlineState === 'ready';

  async function continueWithGps() {
    setRequestingPermissions(true);
    setPermissionError(null);

    try {
      const nextPermissions = await activityRuntime.requestPermissions();
      setPermissions(nextPermissions);

      if (!nextPermissions.servicesEnabled) {
        setPermissionError('Activa la ubicación/GPS del teléfono antes de comenzar.');
        return;
      }

      if (!nextPermissions.foregroundGranted) {
        setPermissionError('Necesitamos permiso de ubicación para registrar la aventura.');
        return;
      }

      router.push({
        pathname: '/adventure/[slug]',
        params: { slug: routeSlug },
      });
    } catch (error) {
      setPermissionError(
        error instanceof Error
          ? error.message
          : 'No se han podido preparar los permisos de ubicación.',
      );
    } finally {
      setRequestingPermissions(false);
    }
  }

  const readinessRows = [
    ['Ubicación', foregroundCopy],
    ['GPS en segundo plano', backgroundCopy],
    ['Ruta offline', offlineCopy[offlineState]],
    ['Seguridad', 'Revisada para QA'],
  ] as const;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.eyebrow}>ANTES DE SALIR</Text>
        <Text style={styles.title}>Prepara tu aventura</Text>
        <Text style={styles.routeName}>{route.title} · {route.municipalityName}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Comprobaciones previas</Text>
          <Text style={styles.noticeBody}>
            Esta build ya comprueba los permisos reales del teléfono. Puedes continuar con
            seguimiento solo en primer plano si Android no concede el permiso en segundo plano.
          </Text>
        </View>

        <View style={styles.readinessCard}>
          {readinessRows.map(([label, state], index) => (
            <View
              key={label}
              style={[
                styles.readinessRow,
                index < readinessRows.length - 1 && styles.readinessDivider,
              ]}
            >
              <Text style={styles.readinessLabel}>{label}</Text>
              <Text style={styles.readinessState}>{state}</Text>
            </View>
          ))}
        </View>

        <View style={styles.offlineCard}>
          <Text style={styles.offlineEyebrow}>PAQUETE DE RUTA</Text>
          <Text style={styles.offlineTitle}>
            {offlineReady ? 'Listo sin conexión' : offlineCopy[offlineState]}
          </Text>
          <Text style={styles.offlineBody}>
            {offlineReady
              ? 'La versión instalada coincide con la geometría y el contenido publicados para esta ruta.'
              : 'Para esta prueba física el paquete offline no bloquea el GPS. Lo validaremos en un gate separado.'}
          </Text>
        </View>

        {permissionError ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorText}>{permissionError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.startButton, requestingPermissions && styles.startButtonDisabled]}
          disabled={requestingPermissions}
          onPress={() => void continueWithGps()}
        >
          <Text style={styles.startButtonText}>
            {requestingPermissions ? 'Preparando GPS…' : 'Activar GPS y comenzar'}
          </Text>
          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: 120 },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[24] },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  eyebrow: { color: colors.olive700, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  routeName: { color: colors.muted, fontSize: 14, marginTop: spacing[8] },
  notice: { marginTop: spacing[24], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.limestone },
  noticeTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  noticeBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  readinessCard: { marginTop: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  readinessRow: { minHeight: 60, paddingHorizontal: spacing[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  readinessLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  readinessState: { color: colors.olive700, fontSize: 12, fontWeight: '900', textAlign: 'right', maxWidth: '45%' },
  offlineCard: { marginTop: spacing[24], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  offlineEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  offlineTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: spacing[8] },
  offlineBody: { color: colors.limestone, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  errorCard: { marginTop: spacing[16], borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.aoveGold, padding: spacing[16] },
  errorText: { color: colors.ink, fontSize: 13, fontWeight: '700' },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[20], backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  startButton: { minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing[20], backgroundColor: colors.olive900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startButtonDisabled: { opacity: 0.65 },
  startButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  startArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  notFoundBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
