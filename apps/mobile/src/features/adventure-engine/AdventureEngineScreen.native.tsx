import { evaluateOfflinePackage, type OfflinePackageState } from '@magina-aventura/offline-sync';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentRouteMapRepository } from '../routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../routes/route-utils';
import { RouteMap } from '../../map/RouteMap';
import { expoRoutePackagePort } from '../../offline/expo-route-package-port';
import { colors, radius, spacing } from '../../theme/tokens';

interface AdventureEngineScreenProps {
  slug?: string;
}

type OfflineState = OfflinePackageState | 'unavailable' | 'error';

const offlineLabel: Record<OfflineState, string> = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
  unavailable: 'No disponible',
  error: 'Error de lectura',
};

/**
 * Native fallback: MapLibre remains the authoritative map adapter. Babylon is
 * intentionally web-only until a native 3D renderer is selected for Expo.
 */
export default function AdventureEngineScreen({ slug }: AdventureEngineScreenProps) {
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';
  const [offlineState, setOfflineState] = useState<OfflineState>('unavailable');
  const [testDataVisible] = useState(true);

  useEffect(() => {
    if (!route) return;
    let active = true;

    async function loadPackageState() {
      try {
        const manifest = await developmentRouteMapRepository.getOfflineManifest(routeSlug);
        if (!manifest) {
          if (active) setOfflineState('unavailable');
          return;
        }
        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);
        if (active) setOfflineState(evaluateOfflinePackage(installed, manifest));
      } catch {
        if (active) setOfflineState('error');
      }
    }

    void loadPackageState();
    return () => {
      active = false;
    };
  }, [routeSlug]);

  if (!route) return null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.eyebrow}>AVENTURA MÁGINA ENGINE</Text>
          <Text style={styles.title}>{route.title}</Text>
          <Text style={styles.subtitle}>{route.municipalityName} · {route.distanceKm} km</Text>
          {testDataVisible ? <Text style={styles.testBadge}>TEST DATA · desarrollo no verificado</Text> : null}
        </View>

        <RouteMap payload={null} mapStyle={{}} developmentMode />

        <View style={styles.statusCard}>
          <Text style={styles.cardEyebrow}>OFFLINE ADVENTURE MANAGER</Text>
          <Text style={styles.cardTitle}>Paquete de ruta</Text>
          <Text style={styles.cardBody}>{offlineLabel[offlineState]}. Esta pantalla reutiliza el evaluador y el puerto de almacenamiento offline existentes.</Text>
        </View>

        <View style={styles.grid}>
          <View style={styles.metric}><Text style={styles.metricValue}>{route.rewardPreview.xp}</Text><Text style={styles.metricLabel}>XP previsto</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{route.rewardPreview.discoveries}</Text><Text style={styles.metricLabel}>descubrimientos</Text></View>
          <View style={styles.metric}><Text style={styles.metricValue}>{route.elevationGainM} m</Text><Text style={styles.metricLabel}>desnivel</Text></View>
        </View>

        <Pressable style={styles.disabledButton} disabled>
          <Text style={styles.disabledButtonText}>Babylon 3D / AR disponible en Web</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: spacing[40] },
  header: { marginBottom: spacing[12] },
  eyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: { color: colors.ink, fontSize: 26, fontWeight: '900', marginTop: spacing[4] },
  subtitle: { color: colors.muted, fontSize: 13, marginTop: spacing[4] },
  testBadge: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', marginTop: spacing[8], letterSpacing: 0.7 },
  statusCard: { borderRadius: radius.lg, padding: spacing[16], backgroundColor: colors.olive900, marginTop: spacing[4] },
  cardEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  cardTitle: { color: colors.white, fontSize: 18, fontWeight: '900', marginTop: spacing[4] },
  cardBody: { color: colors.limestone, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
  grid: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[12] },
  metric: { flex: 1, borderRadius: radius.md, padding: spacing[12], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  metricValue: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: spacing[4] },
  disabledButton: { marginTop: spacing[12], borderRadius: radius.md, padding: spacing[12], alignItems: 'center', backgroundColor: colors.limestone },
  disabledButtonText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
});
