import React, { useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { mockRoutePayload } from '../src/features/routes/development-route-map-repository';
import { developmentRoutes } from '../src/features/routes/fixtures';
import { RouteMap } from '../src/map/RouteMap';
import {
  MAP_THEMES,
  getMapTheme,
} from '../src/map/map-theme';
import {
  defaultLayerVisibility,
  type MapLayerVisibility,
  type MapThemeId,
} from '../src/map/map-layers';
import { ElevationProfile } from '../src/components/ui/ElevationProfile';
import { RouteCard } from '../src/components/ui/RouteCard';
import { HeroTerritory } from '../src/components/ui/HeroTerritory';
import { DifficultyChip } from '../src/components/ui/DifficultyChip';
import { CollectionCard } from '../src/components/progression/CollectionCard';
import { XPRewardCard } from '../src/components/progression/XPRewardCard';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

export default function ThemeTesterScreen() {
  const router = useRouter();
  const [selectedThemeId, setSelectedThemeId] = useState<MapThemeId>('olive');
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>(
    defaultLayerVisibility,
  );
  const [activeTab, setActiveTab] = useState<'map' | 'elevation' | 'components' | 'tokens'>('map');

  const theme = getMapTheme(selectedThemeId);
  const route = developmentRoutes[0]!;

  const poiCount = mockRoutePayload.pois?.length ?? 0;
  const elevationData = mockRoutePayload.elevationProfile ?? [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backIcon}>←</Text>
        </Pressable>
        <View>
          <Text style={styles.headerEyebrow}>ESTUDIO VISUAL Y DE CAPAS</Text>
          <Text style={styles.headerTitle}>Probador de Tema Visual</Text>
        </View>
      </View>

      <View style={styles.tabBar}>
        <Pressable
          style={[styles.tab, activeTab === 'map' && styles.tabActive]}
          onPress={() => setActiveTab('map')}
        >
          <Text style={[styles.tabText, activeTab === 'map' && styles.tabTextActive]}>
            🗺️ Mapa & Capas
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'elevation' && styles.tabActive]}
          onPress={() => setActiveTab('elevation')}
        >
          <Text style={[styles.tabText, activeTab === 'elevation' && styles.tabTextActive]}>
            📈 Altimetría
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'components' && styles.tabActive]}
          onPress={() => setActiveTab('components')}
        >
          <Text style={[styles.tabText, activeTab === 'components' && styles.tabTextActive]}>
            🧩 Componentes
          </Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === 'tokens' && styles.tabActive]}
          onPress={() => setActiveTab('tokens')}
        >
          <Text style={[styles.tabText, activeTab === 'tokens' && styles.tabTextActive]}>
            🎨 Paleta
          </Text>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {activeTab === 'map' ? (
          <View>
            <Text style={styles.sectionHeader}>Selección de Tema Cartográfico</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.themeScroll}>
              {(Object.keys(MAP_THEMES) as MapThemeId[]).map((tId) => {
                const itemTheme = MAP_THEMES[tId];
                const isSelected = tId === selectedThemeId;
                return (
                  <Pressable
                    key={tId}
                    style={[
                      styles.themeCard,
                      isSelected && styles.themeCardSelected,
                    ]}
                    onPress={() => setSelectedThemeId(tId)}
                  >
                    <View
                      style={[
                        styles.themePreviewHeader,
                        { backgroundColor: itemTheme.backgroundColor },
                      ]}
                    >
                      <View
                        style={[
                          styles.themePreviewTrack,
                          { backgroundColor: itemTheme.trackColor },
                        ]}
                      />
                      <View
                        style={[
                          styles.themePreviewDot,
                          { backgroundColor: itemTheme.checkpointColor },
                        ]}
                      />
                    </View>
                    <Text style={styles.themeCardName}>{itemTheme.name}</Text>
                    <Text style={styles.themeCardDesc} numberOfLines={2}>
                      {itemTheme.description}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>

            <View style={styles.mapContainer}>
              <RouteMap
                payload={mockRoutePayload}
                themeId={selectedThemeId}
                layerVisibility={layerVisibility}
                showLayerControls={true}
                onThemeChange={setSelectedThemeId}
                onLayerVisibilityChange={setLayerVisibility}
                height={320}
              />
            </View>

            <View style={styles.infoCard}>
              <Text style={styles.infoCardTitle}>Detalles de las Capas Activas</Text>
              <Text style={styles.infoCardBody}>
                • Track oficial: 8.7 km · {mockRoutePayload.line.geometry.coordinates.length} puntos de geometría.{'\n'}
                • Checkpoints: {mockRoutePayload.checkpoints.length} puntos verificados.{'\n'}
                • Descubrimientos (POIs): {poiCount} puntos categorizados (Flora, Olivares, Patrimonio, Paisaje).{'\n'}
                • Delimitación: Parque Natural Sierra Mágina.{'\n'}
                • Posición senderista simulada en tiempo real.
              </Text>
            </View>
          </View>
        ) : null}

        {activeTab === 'elevation' ? (
          <View>
            <Text style={styles.sectionHeader}>Perfil Altimétrico Interactivo</Text>
            <ElevationProfile
              data={elevationData}
              theme={theme}
              selectedDistanceKm={3.8}
            />

            <View style={styles.elevationStatsGrid}>
              <View style={styles.gridStat}>
                <Text style={styles.gridStatValue}>412 m</Text>
                <Text style={styles.gridStatLabel}>Desnivel Positivo</Text>
              </View>
              <View style={styles.gridStat}>
                <Text style={styles.gridStatValue}>1.052 m</Text>
                <Text style={styles.gridStatLabel}>Cota Máxima</Text>
              </View>
              <View style={styles.gridStat}>
                <Text style={styles.gridStatValue}>640 m</Text>
                <Text style={styles.gridStatLabel}>Cota Mínima</Text>
              </View>
              <View style={styles.gridStat}>
                <Text style={styles.gridStatValue}>5.4 %</Text>
                <Text style={styles.gridStatLabel}>Pendiente Media</Text>
              </View>
            </View>
          </View>
        ) : null}

        {activeTab === 'components' ? (
          <View style={styles.componentsStack}>
            <Text style={styles.sectionHeader}>Hero Territory</Text>
            <HeroTerritory
              kicker="HERO COMPONENT"
              title={`Camina. Descubre.\nConquista Mágina.`}
              body="Prueba de renderizado con los tokens del tema visual de Mágina Aventura."
            />

            <Text style={styles.sectionHeader}>Route Card</Text>
            <RouteCard route={route} onPress={() => {}} />

            <Text style={styles.sectionHeader}>Difficulty Chips</Text>
            <View style={styles.chipRow}>
              <DifficultyChip difficulty="easy" />
              <DifficultyChip difficulty="moderate" />
              <DifficultyChip difficulty="hard" />
            </View>

            <Text style={styles.sectionHeader}>Progression Cards</Text>
            <View style={styles.progressionGrid}>
              <CollectionCard
                emoji="🌿"
                name="Oleastro Centenario"
                family="Flora de Mágina"
                collected={true}
              />
              <CollectionCard
                emoji="🦅"
                name="Águila Real"
                family="Fauna Protegida"
                collected={false}
              />
            </View>

            <XPRewardCard
              xp={750}
              reason="Sendero de Cuadros completado"
            />
          </View>
        ) : null}

        {activeTab === 'tokens' ? (
          <View>
            <Text style={styles.sectionHeader}>Paleta de Colores de la Marca</Text>
            <View style={styles.colorGrid}>
              {Object.entries(colors).map(([key, hex]) => (
                <View key={key} style={styles.colorTile}>
                  <View style={[styles.colorSwatch, { backgroundColor: hex }]} />
                  <Text style={styles.colorKey}>{key}</Text>
                  <Text style={styles.colorHex}>{hex}</Text>
                </View>
              ))}
            </View>

            <Text style={styles.sectionHeader}>Tokens de Tipografía y Espaciado</Text>
            <View style={styles.infoCard}>
              <Text style={styles.typographySampleDisplay}>Display (32px)</Text>
              <Text style={styles.typographySampleTitle}>Title (24px)</Text>
              <Text style={styles.typographySampleSection}>Section (20px)</Text>
              <Text style={styles.typographySampleBody}>Body text standard (16px)</Text>
              <Text style={styles.typographySampleCaption}>Caption / Eyebrow (13px)</Text>
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.olive900 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[16],
    gap: spacing[16],
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: { color: colors.white, fontSize: 20, fontWeight: '900' },
  headerEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.4 },
  headerTitle: { color: colors.white, fontSize: 20, fontWeight: '900' },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  tab: {
    flex: 1,
    paddingVertical: spacing[8],
    alignItems: 'center',
    borderRadius: radius.sm,
  },
  tabActive: { backgroundColor: colors.olive700 },
  tabText: { color: colors.muted, fontSize: 11, fontWeight: '700' },
  tabTextActive: { color: colors.white, fontWeight: '900' },
  content: {
    backgroundColor: colors.warmBackground,
    padding: spacing[20],
    paddingBottom: spacing[40],
    minHeight: '100%',
  },
  sectionHeader: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
    marginTop: spacing[16],
    marginBottom: spacing[12],
  },
  themeScroll: { marginBottom: spacing[16] },
  themeCard: {
    width: 160,
    padding: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.white,
    marginRight: spacing[12],
    borderWidth: 2,
    borderColor: colors.border,
  },
  themeCardSelected: { borderColor: colors.olive900, backgroundColor: colors.white },
  themePreviewHeader: {
    height: 40,
    borderRadius: radius.sm,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginBottom: spacing[8],
  },
  themePreviewTrack: { width: '80%', height: 4, borderRadius: 2 },
  themePreviewDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    position: 'absolute',
    borderWidth: 1.5,
    borderColor: colors.white,
  },
  themeCardName: { fontSize: 12, fontWeight: '900', color: colors.ink },
  themeCardDesc: { fontSize: 10, color: colors.muted, marginTop: 2 },
  mapContainer: { marginHorizontal: -spacing[20] },
  infoCard: {
    backgroundColor: colors.white,
    padding: spacing[16],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginTop: spacing[16],
  },
  infoCardTitle: { fontSize: 14, fontWeight: '900', color: colors.ink },
  infoCardBody: { fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: spacing[4] },
  elevationStatsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[12],
    marginTop: spacing[12],
  },
  gridStat: {
    width: '47%',
    backgroundColor: colors.white,
    padding: spacing[16],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  gridStatValue: { fontSize: 18, fontWeight: '900', color: colors.olive900 },
  gridStatLabel: { fontSize: 11, color: colors.muted, marginTop: 2 },
  componentsStack: { gap: spacing[12] },
  chipRow: { flexDirection: 'row', gap: spacing[8] },
  progressionGrid: { flexDirection: 'row', justifyContent: 'space-between' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[12] },
  colorTile: {
    width: '29%',
    backgroundColor: colors.white,
    padding: spacing[8],
    borderRadius: radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  colorSwatch: { width: 36, height: 36, borderRadius: 18, marginBottom: spacing[8] },
  colorKey: { fontSize: 11, fontWeight: '900', color: colors.ink },
  colorHex: { fontSize: 10, color: colors.muted },
  typographySampleDisplay: { fontSize: typography.display, fontWeight: '900', color: colors.ink },
  typographySampleTitle: { fontSize: typography.title, fontWeight: '900', color: colors.olive900, marginTop: spacing[8] },
  typographySampleSection: { fontSize: typography.section, fontWeight: '800', color: colors.earth, marginTop: spacing[4] },
  typographySampleBody: { fontSize: typography.body, color: colors.ink, marginTop: spacing[4] },
  typographySampleCaption: { fontSize: typography.caption, color: colors.muted, marginTop: spacing[4] },
});
