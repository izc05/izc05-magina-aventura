import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { developmentRoutes } from '../src/features/routes/fixtures';
import { RouteMap } from '../src/map/RouteMap';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

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

export default function MapScreen() {
  const route = developmentRoutes[0];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <View>
          <Text style={styles.eyebrow}>SIERRA MÁGINA</Text>
          <Text style={styles.title}>Mapa</Text>
        </View>
        <View style={styles.layersButton}><Text style={styles.layersGlyph}>▱</Text></View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.mapFrame}>
          <RouteMap payload={null} mapStyle={mapStyle} developmentMode />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filters}>
          {['Rutas', 'POI', 'Refugios', 'Agua', 'Aparcamientos'].map((item, index) => (
            <View key={item} style={[styles.filter, index === 0 && styles.filterActive]}>
              <Text style={[styles.filterText, index === 0 && styles.filterTextActive]}>{item}</Text>
            </View>
          ))}
        </ScrollView>

        <View style={styles.infoCard}>
          <View style={styles.marker}><Text style={styles.markerText}>⌖</Text></View>
          <View style={styles.infoCopy}>
            <Text style={styles.infoKicker}>PRIMERA RUTA DEL CANDIDATE</Text>
            <Text style={styles.infoTitle}>{route?.title ?? 'Catálogo en preparación'}</Text>
            {route ? (
              <Text style={styles.infoBody}>Inicio de desarrollo: {route.startLatitude.toFixed(3)}, {route.startLongitude.toFixed(3)} · {route.municipalityName}</Text>
            ) : (
              <Text style={styles.infoBody}>No hay rutas disponibles todavía.</Text>
            )}
          </View>
        </View>

        {route ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/routes/[slug]', params: { slug: route.slug } })}
            style={styles.primaryButton}
          >
            <Text style={styles.primaryButtonText}>Abrir ficha de ruta</Text>
          </Pressable>
        ) : null}

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Mapa general en construcción</Text>
          <Text style={styles.noticeBody}>La pestaña ya usa la superficie MapLibre real. Los tracks y POI se mostrarán aquí cuando el catálogo territorial verificado esté conectado; las fichas y la aventura GPS conservan el motor existente.</Text>
        </View>
      </ScrollView>

      <PrimaryTabBar active="Mapa" />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  header: { backgroundColor: colors.olive900, paddingHorizontal: spacing[20], paddingTop: spacing[16], paddingBottom: spacing[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.8 },
  title: { color: colors.white, fontSize: typography.title, fontWeight: '900', marginTop: 2 },
  layersButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: 'rgba(255,255,255,0.12)', alignItems: 'center', justifyContent: 'center' },
  layersGlyph: { color: colors.white, fontSize: 22, fontWeight: '900' },
  content: { paddingBottom: 126 },
  mapFrame: { marginTop: spacing[4] },
  filters: { gap: spacing[8], paddingHorizontal: spacing[20], paddingVertical: spacing[16] },
  filter: { paddingHorizontal: spacing[12], paddingVertical: spacing[8], borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  filterActive: { backgroundColor: colors.olive900, borderColor: colors.olive900 },
  filterText: { color: colors.ink, fontSize: 11, fontWeight: '800' },
  filterTextActive: { color: colors.white },
  infoCard: { marginHorizontal: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: spacing[16], flexDirection: 'row', alignItems: 'center' },
  marker: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.oliveWash, alignItems: 'center', justifyContent: 'center' },
  markerText: { color: colors.olive900, fontSize: 22, fontWeight: '900' },
  infoCopy: { flex: 1, marginLeft: spacing[12] },
  infoKicker: { color: colors.aoveGold, fontSize: 8, fontWeight: '900', letterSpacing: 1.2 },
  infoTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: 2 },
  infoBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: 3 },
  primaryButton: { marginHorizontal: spacing[20], marginTop: spacing[12], minHeight: 52, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  primaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  notice: { marginHorizontal: spacing[20], marginTop: spacing[16], borderRadius: radius.lg, backgroundColor: colors.limestone, padding: spacing[16] },
  noticeTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  noticeBody: { color: colors.muted, fontSize: 11, lineHeight: 17, marginTop: spacing[4] },
});
