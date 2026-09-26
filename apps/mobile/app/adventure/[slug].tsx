import React, { useEffect, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentRouteMapRepository } from '../../src/features/routes/development-route-map-repository';
import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { RouteMap } from '../../src/map/RouteMap';
import type { EnhancedRoutePayload } from '../../src/map/map-layers';
import { colors, radius, spacing } from '../../src/theme/tokens';

export default function ActiveAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';

  const [mapPayload, setMapPayload] = useState<EnhancedRoutePayload | null>(null);

  useEffect(() => {
    if (!routeSlug) return;
    let active = true;

    async function loadMapData() {
      try {
        const payload = await developmentRouteMapRepository.getMapPayload(routeSlug);
        if (active && payload) {
          setMapPayload(payload as EnhancedRoutePayload);
        }
      } catch {
        if (active) setMapPayload(null);
      }
    }

    void loadMapData();
    return () => {
      active = false;
    };
  }, [routeSlug]);

  if (!route) {
    return null;
  }

  const nextPoi = mapPayload?.pois?.[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <View style={styles.mapContainer}>
        <RouteMap
          payload={mapPayload}
          developmentMode={route.developmentFixture}
          showLayerControls={true}
          height={600}
        />
      </View>

      <View style={styles.topHud}>
        <View style={styles.topHudHeader}>
          <View>
            <Text style={styles.routeName}>{route.title}</Text>
            <Text style={styles.routePlace}>{route.municipalityName}</Text>
          </View>
          <View style={styles.progressBadge}>
            <Text style={styles.progressText}>25 %</Text>
          </View>
        </View>
        <View style={styles.metrics}>
          <View>
            <Text style={styles.metricValue}>2.1 km</Text>
            <Text style={styles.metricLabel}>Distancia</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>00:38</Text>
            <Text style={styles.metricLabel}>Tiempo</Text>
          </View>
          <View>
            <Text style={styles.metricValue}>+140 m</Text>
            <Text style={styles.metricLabel}>Desnivel</Text>
          </View>
        </View>
      </View>

      <Pressable style={styles.exitButton} onPress={() => router.back()}>
        <Text style={styles.exitButtonText}>✕</Text>
      </Pressable>

      <View style={styles.bottomCard}>
        <Text style={styles.bottomEyebrow}>MODO SIMULADO · SEGUIMIENTO EN VIVO</Text>
        <Text style={styles.bottomTitle}>Siguiente objetivo</Text>
        <View style={styles.objectiveRow}>
          <View style={styles.objectiveIcon}>
            <Text style={styles.objectiveIconText}>
              {nextPoi?.category === 'flora'
                ? '🌿'
                : nextPoi?.category === 'olive'
                  ? '🫒'
                  : nextPoi?.category === 'heritage'
                    ? '🏰'
                    : '📍'}
            </Text>
          </View>
          <View style={styles.objectiveCopy}>
            <Text style={styles.objectiveName}>
              {nextPoi?.name ?? 'Descubrimiento de prueba'}
            </Text>
            <Text style={styles.objectiveDistance}>
              140 m · {nextPoi?.category ? nextPoi.category.toUpperCase() : 'POIs'}
            </Text>
          </View>
        </View>
        <View style={styles.actionRow}>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>⚑ Ruta</Text>
          </Pressable>
          <Pressable
            style={styles.pauseButton}
            onPress={() =>
              router.push({
                pathname: '/adventure/[slug]/summary',
                params: { slug: route.slug },
              })
            }
          >
            <Text style={styles.pauseButtonText}>Ⅱ Pausar / Terminar</Text>
          </Pressable>
          <Pressable style={styles.actionButton}>
            <Text style={styles.actionButtonText}>! SOS</Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  mapContainer: { flex: 1, marginHorizontal: -spacing[20], marginTop: -spacing[12] },
  topHud: {
    position: 'absolute',
    top: spacing[12],
    left: spacing[16],
    right: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing[16],
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 4,
  },
  topHudHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  routeName: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  routePlace: { color: colors.muted, fontSize: 11, marginTop: 2 },
  progressBadge: { borderRadius: radius.pill, backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  progressText: { color: colors.white, fontSize: 12, fontWeight: '900' },
  metrics: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing[12], paddingTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border },
  metricValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 10, marginTop: 2 },
  exitButton: {
    position: 'absolute',
    top: 154,
    right: spacing[20],
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  exitButtonText: { color: colors.ink, fontSize: 18, fontWeight: '900' },
  bottomCard: {
    position: 'absolute',
    left: spacing[16],
    right: spacing[16],
    bottom: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    padding: spacing[20],
    borderWidth: 1,
    borderColor: colors.border,
    elevation: 6,
  },
  bottomEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  bottomTitle: { color: colors.ink, fontSize: 13, fontWeight: '800', marginTop: spacing[8] },
  objectiveRow: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[12] },
  objectiveIcon: { width: 48, height: 48, borderRadius: radius.md, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  objectiveIconText: { fontSize: 22 },
  objectiveCopy: { flex: 1 },
  objectiveName: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  objectiveDistance: { color: colors.olive700, fontSize: 12, fontWeight: '800', marginTop: 3 },
  actionRow: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[16] },
  actionButton: { flex: 1, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.warmBackground, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border },
  actionButtonText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  pauseButton: { flex: 1.2, minHeight: 44, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  pauseButtonText: { color: colors.white, fontSize: 12, fontWeight: '900' },
});
