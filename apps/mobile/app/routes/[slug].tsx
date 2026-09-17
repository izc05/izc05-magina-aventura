import type {
  OfflineRoutePackageManifest,
  RouteMapPayload,
} from '@magina-aventura/contracts';
import {
  evaluateOfflinePackage,
  resolvePmtilesUri,
  type OfflinePackageState,
} from '@magina-aventura/offline-sync';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentRouteMapRepository } from '../../src/features/routes/development-route-map-repository';
import { presentRouteDetail } from '../../src/features/routes/route-detail-presenter';
import { useRouteBySlug } from '../../src/features/routes/use-route-catalog';
import { RouteMap } from '../../src/map/RouteMap';
import { materializeMapStyle } from '../../src/map/map-style';
import { expoRoutePackagePort } from '../../src/offline/expo-route-package-port';
import { downloadRoutePackage } from '../../src/offline/route-package-store';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

type RouteOfflineUiState =
  | OfflinePackageState
  | 'unavailable'
  | 'downloading'
  | 'error';

const offlineStatusCopy: Record<RouteOfflineUiState, string> = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
  unavailable: 'No disponible',
  downloading: 'Descargando',
  error: 'Error de descarga',
};

async function materializeRouteMapStyle(
  manifest: OfflineRoutePackageManifest,
  localUri?: string,
): Promise<Record<string, unknown>> {
  const response = await fetch(manifest.map.styleTemplateUrl);

  if (!response.ok) {
    throw new Error(`Unable to load route map style (${response.status})`);
  }

  const styleJson = await response.text();
  return materializeMapStyle(
    styleJson,
    resolvePmtilesUri(manifest, localUri),
  );
}

export default function RouteDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = useRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';

  const configuredStyle = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const baseMapStyle = configuredStyle ?? (__DEV__ ? 'https://demotiles.maplibre.org/style.json' : null);

  const [mapPayload, setMapPayload] = useState<RouteMapPayload | null>(null);
  const [offlineManifest, setOfflineManifest] = useState<OfflineRoutePackageManifest | null>(null);
  const [offlineState, setOfflineState] = useState<RouteOfflineUiState>('unavailable');
  const [mapStyle, setMapStyle] = useState<string | Record<string, unknown> | null>(baseMapStyle);

  useEffect(() => {
    if (!routeSlug) return;

    let active = true;

    async function loadRouteMapState() {
      try {
        const [payload, manifest] = await Promise.all([
          developmentRouteMapRepository.getMapPayload(routeSlug),
          developmentRouteMapRepository.getOfflineManifest(routeSlug),
        ]);

        if (!active) return;

        setMapPayload(payload);
        setOfflineManifest(manifest);

        if (!manifest) {
          setOfflineState('unavailable');
          setMapStyle(baseMapStyle);
          return;
        }

        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);
        const packageState = evaluateOfflinePackage(installed, manifest);

        if (!active) return;

        setOfflineState(packageState);

        try {
          const materializedStyle = await materializeRouteMapStyle(
            manifest,
            packageState === 'ready' ? installed?.localUri : undefined,
          );

          if (active) setMapStyle(materializedStyle);
        } catch {
          if (active) setMapStyle(baseMapStyle);
        }
      } catch {
        if (!active) return;
        setMapPayload(null);
        setOfflineManifest(null);
        setOfflineState('unavailable');
        setMapStyle(baseMapStyle);
      }
    }

    void loadRouteMapState();

    return () => {
      active = false;
    };
  }, [baseMapStyle, routeSlug]);

  async function handleOfflineDownload() {
    if (!offlineManifest) return;

    setOfflineState('downloading');

    try {
      await downloadRoutePackage(expoRoutePackagePort, offlineManifest);
      const installed = await expoRoutePackagePort.readMetadata(offlineManifest.routeId);
      const packageState = evaluateOfflinePackage(installed, offlineManifest);
      setOfflineState(packageState);

      if (packageState === 'ready' && installed) {
        try {
          setMapStyle(
            await materializeRouteMapStyle(offlineManifest, installed.localUri),
          );
        } catch {
          // The verified package remains installed even if the style template
          // cannot be refreshed at this moment. Keep the current map style.
        }
      }
    } catch {
      setOfflineState('error');
    }
  }

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

  const detail = presentRouteDetail(route);
  const canDownloadOffline =
    offlineManifest !== null &&
    offlineState !== 'ready' &&
    offlineState !== 'downloading';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.mountainBack} />
          <View style={styles.mountainFront} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          {(route.developmentFixture ?? false) ? (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DATOS DE DESARROLLO</Text>
            </View>
          ) : null}
          <View style={styles.heroCopy}>
            <Text style={styles.municipality}>{route.municipalityNames.join(", ").toUpperCase()}</Text>
            <Text style={styles.title}>{route.title}</Text>
            <Text style={styles.difficulty}>{detail.difficulty}</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{detail.distance}</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{detail.elevation}</Text>
            <Text style={styles.statLabel}>Desnivel</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{detail.duration}</Text>
            <Text style={styles.statLabel}>Duración</Text>
          </View>
        </View>

        {mapStyle ? (
          <RouteMap
            payload={mapPayload}
            mapStyle={mapStyle}
            developmentMode={route.developmentFixture ?? false}
          />
        ) : (
          <View style={styles.mapUnavailable}>
            <Text style={styles.mapUnavailableTitle}>Mapa no configurado</Text>
            <Text style={styles.mapUnavailableBody}>
              La cartografía verificada aún no está disponible para esta ruta.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Tu aventura</Text>
        <Text style={styles.body}>{(route as any).description ?? ""}</Text>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardEyebrow}>RECOMPENSAS DE ESTA AVENTURA</Text>
          <Text style={styles.rewardTitle}>{detail.rewardHeadline}</Text>
          <Text style={styles.rewardBody}>{detail.discoveries}</Text>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Seguridad</Text>
          {((route.safetyHeadline ? [route.safetyHeadline] : []) as string[]).map((note) => (
            <Text key={note} style={styles.safetyNote}>• {note}</Text>
          ))}
        </View>

        <View style={styles.infoGrid}>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>◫</Text>
            <Text style={styles.infoTitle}>Track oficial</Text>
            <Text style={styles.infoCopy}>
              {mapPayload ? `Geometría v${mapPayload.geometryVersion}` : 'Pendiente de verificar'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>◇</Text>
            <Text style={styles.infoTitle}>Offline</Text>
            <Text style={styles.infoCopy}>{offlineStatusCopy[offlineState]}</Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>◎</Text>
            <Text style={styles.infoTitle}>Checkpoints</Text>
            <Text style={styles.infoCopy}>
              {mapPayload ? `${mapPayload.checkpoints.length} verificados` : 'Sin datos verificados'}
            </Text>
          </View>
          <View style={styles.infoCard}>
            <Text style={styles.infoIcon}>!</Text>
            <Text style={styles.infoTitle}>Seguridad</Text>
            <Text style={styles.infoCopy}>Revisar antes de salir</Text>
          </View>
        </View>

        {offlineManifest ? (
          <View style={styles.offlineActionCard}>
            <View style={styles.offlineActionCopy}>
              <Text style={styles.offlineActionEyebrow}>PAQUETE OFFLINE</Text>
              <Text style={styles.offlineActionTitle}>{offlineStatusCopy[offlineState]}</Text>
              <Text style={styles.offlineActionBody}>
                Cartografía PMTiles versionada para esta geometría de ruta.
              </Text>
            </View>
            {canDownloadOffline ? (
              <Pressable style={styles.offlineButton} onPress={() => void handleOfflineDownload()}>
                <Text style={styles.offlineButtonText}>
                  {offlineState === 'stale' ? 'Actualizar' : offlineState === 'error' ? 'Reintentar' : 'Descargar'}
                </Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/routes/[slug]/prepare',
              params: { slug: route.slug },
            })
          }
        >
          <Text style={styles.primaryButtonText}>Preparar aventura</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[40] },
  hero: { height: 330, overflow: 'hidden', backgroundColor: colors.olive900, padding: spacing[20], justifyContent: 'flex-end' },
  sun: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: colors.aoveGold, right: 28, top: 42, opacity: 0.92 },
  mountainBack: { position: 'absolute', width: 360, height: 180, borderRadius: 50, backgroundColor: colors.olive700, right: -120, bottom: -65, transform: [{ rotate: '18deg' }] },
  mountainFront: { position: 'absolute', width: 320, height: 150, borderRadius: 50, backgroundColor: colors.olive500, left: -100, bottom: -80, transform: [{ rotate: '-12deg' }] },
  backButton: { position: 'absolute', top: spacing[16], left: spacing[16], width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  devBadge: { position: 'absolute', top: spacing[20], right: spacing[16], borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  devBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  heroCopy: { maxWidth: 320 },
  municipality: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.white, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  difficulty: { color: colors.limestone, fontSize: 14, fontWeight: '700', marginTop: spacing[8] },
  statsCard: { marginHorizontal: spacing[20], marginTop: -24, padding: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', ...shadow.card },
  stat: { flex: 1 },
  statValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  divider: { width: 1, height: 36, backgroundColor: colors.border, marginHorizontal: spacing[8] },
  mapUnavailable: { margin: spacing[20], padding: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  mapUnavailableTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  mapUnavailableBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900', marginHorizontal: spacing[20] },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginHorizontal: spacing[20], marginTop: spacing[8] },
  rewardCard: { margin: spacing[20], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.olive900 },
  rewardEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  rewardTitle: { color: colors.white, fontSize: 20, fontWeight: '900', marginTop: spacing[8] },
  rewardBody: { color: colors.limestone, fontSize: 13, marginTop: spacing[8] },
  safetyCard: { marginHorizontal: spacing[20], marginBottom: spacing[20], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  safetyTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  safetyNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[16], gap: spacing[8] },
  infoCard: { width: '48%', borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  infoIcon: { color: colors.olive700, fontSize: 20, fontWeight: '900' },
  infoTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: spacing[8] },
  infoCopy: { color: colors.muted, fontSize: 11, marginTop: spacing[4] },
  offlineActionCard: { marginHorizontal: spacing[20], marginTop: spacing[20], padding: spacing[16], borderRadius: radius.lg, backgroundColor: colors.limestone, flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  offlineActionCopy: { flex: 1 },
  offlineActionEyebrow: { color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  offlineActionTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: spacing[4] },
  offlineActionBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing[4] },
  offlineButton: { borderRadius: radius.md, backgroundColor: colors.olive900, paddingHorizontal: spacing[16], paddingVertical: spacing[12] },
  offlineButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  primaryButton: { marginHorizontal: spacing[20], marginTop: spacing[24], minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing[20], backgroundColor: colors.olive900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  primaryButtonArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  notFoundBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
