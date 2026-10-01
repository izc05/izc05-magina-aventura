import { evaluateOfflinePackage, type OfflinePackageState } from '@magina-aventura/offline-sync';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentRouteMapRepository } from '../../../src/features/routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { routePresentationViewModel } from '../../../src/features/routes/route-presentation-view-model';
import { expoRoutePackagePort } from '../../../src/offline/expo-route-package-port';
import { colors, radius, spacing, typography } from '../../../src/theme/tokens';
import { useAuth } from '../../../src/context/AuthContext';

type PrepareOfflineState = OfflinePackageState | 'unavailable' | 'error';

const offlineCopy: Record<PrepareOfflineState, string> = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
  unavailable: 'No disponible',
  error: 'Error de lectura',
};

export default function PrepareRouteAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';
  const presentation = route
    ? routePresentationViewModel(
        route,
        route.developmentFixture ? 'development-simulation' : 'unverified',
      )
    : null;
  const [offlineState, setOfflineState] = useState<PrepareOfflineState>('unavailable');

  useEffect(() => {
    if (!routeSlug) return;

    if (presentation?.showVerifiedOfflinePackage !== true) {
      setOfflineState('unavailable');
      return;
    }

    let active = true;

    async function loadOfflineState() {
      try {
        const manifest = await developmentRouteMapRepository.getOfflineManifest(routeSlug);

        if (!active) return;

        if (!manifest) {
          setOfflineState('unavailable');
          return;
        }

        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);

        if (active) {
          setOfflineState(evaluateOfflinePackage(installed, manifest));
        }
      } catch {
        if (active) setOfflineState('error');
      }
    }

    void loadOfflineState();

    return () => {
      active = false;
    };
  }, [presentation?.showVerifiedOfflinePackage, routeSlug]);

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

  const readinessRows = [
    ['Contenido y mapa', presentation?.preparationLabel ?? 'En preparación'],
    ['Tracking GPS', presentation?.canCaptureTechnicalGps ? 'Técnico · métricas reales' : 'Pendiente'],
    ['Ruta offline', offlineCopy[offlineState]],
    ['Checkpoints', presentation?.checkpointStatusLabel ?? 'Sin datos verificados'],
  ] as const;

  const offlineReady = offlineState === 'ready';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.eyebrow}>QA · CAPTURA GPS</Text>
        <Text style={styles.title}>Prueba técnica GPS</Text>
        <Text style={styles.routeName}>{presentation?.title ?? 'Contenido en preparación'}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Contenido y mapa en preparación</Text>
          <Text style={styles.noticeBody}>
            {presentation?.technicalGpsNotice ?? 'No hay una ruta y un checkpoint verificados para iniciar una aventura física.'}
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
              : offlineState === 'unavailable'
                ? 'No hay un paquete cartográfico verificado asociado.'
                : 'Vuelve a la ficha de la ruta para descargar o actualizar el paquete antes de salir.'}
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={[styles.startButton, !presentation?.canCaptureTechnicalGps && styles.disabledButton]}
          accessibilityRole="button"
          accessibilityLabel={user ? 'Iniciar captura GPS técnica' : 'Iniciar sesión para guardar datos GPS'}
          accessibilityHint={user ? 'Inicia una captura GPS personal.' : 'Te pedirá iniciar sesión o crear una cuenta antes de guardar datos GPS.'}
          accessibilityState={{ disabled: !presentation?.canCaptureTechnicalGps || authLoading }}
          disabled={!presentation?.canCaptureTechnicalGps || authLoading}
          onPress={() => {
            if (!user) {
              router.push({ pathname: '/login', params: { returnTo: 'adventure', slug: route.slug } });
              return;
            }
            router.push({ pathname: '/adventure/[slug]', params: { slug: route.slug } });
          }}
        >
          <Text style={styles.startButtonText}>
            {user ? 'Iniciar captura GPS técnica' : 'Inicia sesión para guardar GPS'}
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
  readinessState: { color: colors.olive700, fontSize: 12, fontWeight: '900' },
  offlineCard: { marginTop: spacing[24], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  offlineEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  offlineTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: spacing[8] },
  offlineBody: { color: colors.limestone, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[20], backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  startButton: { minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing[20], backgroundColor: colors.olive900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  disabledButton: { opacity: 0.45 },
  startButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  startArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  notFoundBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
