import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { developmentRoutes } from '../src/features/routes/fixtures';
import { RouteMap } from '../src/map/RouteMap';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

const mapStyle = {
  version: 8,
  sources: {},
  layers: [
    {
      id: 'territory-background',
      type: 'background',
      paint: { 'background-color': '#DCE4D5' },
    },
  ],
};

const filters = ['Rutas', 'POI', 'Refugios', 'Agua', 'Aparcamientos'] as const;

export default function MapScreen() {
  const route = developmentRoutes[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />

      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>EXPLORA EL TERRITORIO</Text>
          <Text style={styles.title}>Mapa de Sierra Mágina</Text>
        </View>
        <View style={styles.layersButton}>
          <Text style={styles.layersGlyph}>▱</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapStage}>
          <RouteMap payload={null} mapStyle={mapStyle} developmentMode layout="screen" />

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filters}
            style={styles.filtersScroller}
          >
            {filters.map((item, index) => (
              <View key={item} style={[styles.filter, index === 0 && styles.filterActive]}>
                <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{item}</Text>
              </View>
            ))}
          </ScrollView>

          <View style={styles.positionButton}>
            <Text style={styles.positionGlyph}>⌖</Text>
          </View>
        </View>

        <View style={styles.routeSheet}>
          <View style={styles.sheetHandle} />
          <View style={styles.routeRow}>
            <View style={styles.marker}>
              <Text style={styles.markerText}>△</Text>
            </View>
            <View style={styles.infoCopy}>
              <Text style={styles.infoKicker}>RUTA DISPONIBLE EN EL CANDIDATE</Text>
              <Text style={styles.infoTitle}>{route?.title ?? 'Catálogo en preparación'}</Text>
              {route ? (
                <Text style={styles.infoBody}>
                  {route.municipalityName} · inicio {route.startLatitude.toFixed(3)}, {route.startLongitude.toFixed(3)}
                </Text>
              ) : (
                <Text style={styles.infoBody}>No hay rutas disponibles todavía.</Text>
              )}
            </View>
          </View>

          {route ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${route.title}`}
              onPress={() => router.push({ pathname: '/routes/[slug]', params: { slug: route.slug } })}
              style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
            >
              <View>
                <Text style={styles.primaryButtonText}>Ver ficha de ruta</Text>
                <Text style={styles.primaryButtonCaption}>Detalles, seguridad, offline y GPS</Text>
              </View>
              <Text style={styles.primaryButtonArrow}>→</Text>
            </Pressable>
          ) : null}
        </View>

        <View style={styles.notice}>
          <View style={styles.noticeIcon}><Text style={styles.noticeIconText}>i</Text></View>
          <View style={styles.noticeCopy}>
            <Text style={styles.noticeTitle}>Mapa general preparado para datos reales</Text>
            <Text style={styles.noticeBody}>
              Esta pestaña ya usa MapLibre. Los tracks, POI, refugios, agua y aparcamientos aparecerán cuando el catálogo territorial verificado se conecte; no mostramos geometrías inventadas.
            </Text>
          </View>
        </View>
      </ScrollView>

      <PrimaryTabBar active="Mapa" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  header: {
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[12],
    paddingBottom: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.white, fontSize: typography.title, fontWeight: '900', marginTop: 2 },
  layersButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  layersGlyph: { color: colors.white, fontSize: 22, fontWeight: '900' },
  content: { paddingBottom: 126 },
  mapStage: { height: 430, position: 'relative', backgroundColor: colors.limestone },
  filtersScroller: { position: 'absolute', top: spacing[16], left: 0, right: 0 },
  filters: { gap: spacing[8], paddingHorizontal: spacing[16] },
  filter: {
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(250,249,246,0.94)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.72)',
  },
  filterActive: { backgroundColor: colors.olive900, borderColor: colors.olive900 },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  positionButton: {
    position: 'absolute',
    right: spacing[16],
    bottom: 74,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'rgba(250,249,246,0.96)',
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  positionGlyph: { color: colors.olive900, fontSize: 23, fontWeight: '900' },
  routeSheet: {
    marginTop: -42,
    marginHorizontal: spacing[16],
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    padding: spacing[20],
    borderWidth: 1,
    borderColor: colors.border,
    ...shadow.card,
  },
  sheetHandle: {
    width: 42,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: spacing[16],
  },
  routeRow: { flexDirection: 'row', alignItems: 'center' },
  marker: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.oliveWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  markerText: { color: colors.olive900, fontSize: 22, fontWeight: '900' },
  infoCopy: { flex: 1, marginLeft: spacing[12] },
  infoKicker: { color: colors.aoveGold, fontSize: 8, fontWeight: '900', letterSpacing: 1.1 },
  infoTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginTop: 2 },
  infoBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  primaryButton: {
    minHeight: 62,
    marginTop: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  primaryButtonPressed: { opacity: 0.8 },
  primaryButtonText: { color: colors.white, fontSize: 14, fontWeight: '900' },
  primaryButtonCaption: { color: colors.limestone, fontSize: 9, marginTop: 3 },
  primaryButtonArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notice: {
    marginHorizontal: spacing[20],
    marginTop: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.limestone,
    padding: spacing[16],
    flexDirection: 'row',
  },
  noticeIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noticeIconText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  noticeCopy: { flex: 1, marginLeft: spacing[12] },
  noticeTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  noticeBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: spacing[4] },
});
