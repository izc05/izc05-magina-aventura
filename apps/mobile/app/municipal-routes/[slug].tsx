import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  getMunicipalRouteInformationBySlug,
  municipalRouteInformationViewModel,
} from '../../src/features/routes/municipal-route-information';
import { PersonalRouteGallery } from '../../src/features/routes/PersonalRouteGallery';
import { RouteMap } from '../../src/map/RouteMap';
import { createBaseMapReferenceProps } from '../../src/map/map-reference';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

export default function MunicipalRouteInformationScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getMunicipalRouteInformationBySlug(slug);
  const information = route ? municipalRouteInformationViewModel() : null;

  if (!route || !information) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.notFound}>
          <Text style={styles.title}>Información no disponible</Text>
          <Text style={styles.mutedBody}>No encontramos esta ficha de ruta.</Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver a rutas"
            style={styles.secondaryButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.secondaryButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  async function openSource(url: string) {
    try {
      await Linking.openURL(url);
    } catch {
      Alert.alert('Fuente no disponible', 'No se pudo abrir el enlace externo.');
    }
  }

  const contextMapProps = createBaseMapReferenceProps();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            accessibilityHint="Regresa a la lista de rutas."
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.heroMeta}>
            <Text style={styles.eyebrow}>{information.qaLabel}</Text>
            <View style={styles.preparingBadge}>
              <Text style={styles.preparingBadgeText}>{information.traceStatus.toUpperCase()}</Text>
            </View>
          </View>
          <Text style={styles.heroTitle}>{information.title}</Text>
          <Text style={styles.heroLocation}>{information.municipality}</Text>
          <Text style={styles.heroCaption}>Ficha informativa · sin navegación GPS</Text>
        </View>

        <View style={styles.statusCard}>
          <Text style={styles.cardEyebrow}>{information.statusLabel.toUpperCase()}</Text>
          <Text style={styles.body}>{information.statusDetail}</Text>
          <Text style={styles.statusFootnote}>{information.officialDataNotice}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recorrido anunciado</Text>
          <View style={styles.endpointsCard}>
            <View style={styles.endpointRow}>
              <View style={styles.endpointDot} />
              <View style={styles.endpointCopy}>
                <Text style={styles.endpointLabel}>Un extremo</Text>
                <Text style={styles.endpointName}>{information.endpoints[0]}</Text>
              </View>
            </View>
            <Text accessibilityLabel="El Ayuntamiento indica ambos sentidos" style={styles.directionArrow}>↕</Text>
            <View style={styles.endpointRow}>
              <View style={[styles.endpointDot, styles.endpointDotEnd]} />
              <View style={styles.endpointCopy}>
                <Text style={styles.endpointLabel}>Otro extremo</Text>
                <Text style={styles.endpointName}>{information.endpoints[1]}</Text>
              </View>
            </View>
            <Text style={styles.directionNote}>{information.directionNote}</Text>
          </View>
        </View>

        <View style={styles.communityCard}>
          <View style={styles.communityHeader}>
            <Text style={styles.communityTitle}>{information.communityReference.label}</Text>
            <Text style={styles.communityBadge}>NO OFICIAL</Text>
          </View>
          <View style={styles.communityStats}>
            <View style={styles.communityStat}>
              <Text style={styles.communityValue}>{information.communityReference.distance}</Text>
              <Text style={styles.communityLabel}>Distancia del registro</Text>
            </View>
            <View style={styles.communityStat}>
              <Text style={styles.communityValue}>{information.communityReference.elevationGain}</Text>
              <Text style={styles.communityLabel}>Desnivel del registro</Text>
            </View>
          </View>
          <Text style={styles.communityTrackType}>{information.communityReference.recordedRouteType}</Text>
          <Text style={styles.communityNote}>{information.communityReference.note}</Text>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={information.communityReference.sourceLabel}
            accessibilityHint="Abre una fuente externa con datos comunitarios no verificados."
            style={styles.inlineSourceLink}
            onPress={() => void openSource(information.communityReference.sourceUrl)}
          >
            <Text style={styles.inlineSourceText}>Ver fuente comunitaria en Wikiloc ↗</Text>
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Galería personal</Text>
          <View style={styles.galleryPrivacyNotice}>
            <Text style={styles.galleryPrivacyTitle}>Solo en este dispositivo</Text>
            <Text style={styles.galleryPrivacyBody}>
              Tus fotos se guardan en el almacenamiento privado de esta app. No se publican ni se sincronizan.
              Aquí solo aparecen imágenes que tú eliges; no mostramos fotos comunitarias ni contenido online.
            </Text>
            <Text style={styles.galleryPickerNote}>
              Se abre el selector de fotos del sistema. La app no pide acceso general a toda tu fototeca ni descarga imágenes online.
            </Text>
          </View>
          <PersonalRouteGallery routeSlug={route.slug} />
          <View style={styles.galleryProvenance}>
            <Text style={styles.galleryStatus}>{information.gallery.statusLabel}</Text>
            <Text style={styles.galleryBody}>{information.gallery.body}</Text>
          </View>
        </View>

        {information.showContextMap ? (
          <View style={styles.section}>
            <View style={styles.mapHeading}>
              <View style={styles.mapHeadingCopy}>
                <Text style={styles.sectionTitle}>{information.contextMap.title}</Text>
                <Text style={styles.mapAreaLabel}>{information.contextMap.areaLabel}</Text>
              </View>
              <Text style={styles.mapBadge}>SOLO CONTEXTO</Text>
            </View>
            <Text style={styles.mapNote}>{information.contextMap.note}</Text>
            <View
              accessible
              accessibilityRole="image"
              accessibilityLabel={information.contextMap.accessibilityLabel}
              style={styles.mapA11yFrame}
            >
              <RouteMap {...contextMapProps} height={228} />
            </View>
            <Text style={styles.nonNavigationNotice}>{information.nonNavigationNotice}</Text>
          </View>
        ) : null}

        <View style={styles.sourcesCard}>
          <Text style={styles.sectionTitle}>Fuentes y licencias</Text>
          <Text style={styles.sourcesIntro}>Hechos municipales y referencias externas se mantienen separados.</Text>
          {information.sourceLinks.map((source) => (
            <Pressable
              key={source.id}
              accessibilityRole="link"
              accessibilityLabel={`Abrir fuente: ${source.label}`}
              accessibilityHint="Abre una página externa."
              style={styles.sourceLink}
              onPress={() => void openSource(source.url)}
            >
              <Text style={styles.sourceLinkText}>{source.label}</Text>
              <Text accessible={false} style={styles.sourceArrow}>↗</Text>
            </Pressable>
          ))}
        </View>

        <View style={styles.footerNotice}>
          <Text style={styles.footerTitle}>{information.traceStatus}</Text>
          <Text style={styles.footerBody}>{information.gpsNotice}</Text>
          <Text style={styles.footerBody}>No se muestran perfil, checkpoints, recompensas ni progreso porque no hay datos verificados para esta ficha.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[32] },
  hero: {
    minHeight: 290,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[20],
    paddingBottom: spacing[24],
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[20],
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  heroMeta: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: spacing[8] },
  eyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  preparingBadge: { borderRadius: radius.pill, borderWidth: 1, borderColor: colors.aoveGold, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  preparingBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  heroTitle: { color: colors.white, fontSize: typography.display, fontWeight: '900', marginTop: spacing[12], maxWidth: 360 },
  heroLocation: { color: colors.limestone, fontSize: 13, fontWeight: '700', marginTop: spacing[8] },
  heroCaption: { color: colors.aoveGold, fontSize: 11, fontWeight: '800', marginTop: spacing[12] },
  statusCard: { marginHorizontal: spacing[20], marginTop: spacing[16], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  cardEyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: spacing[8] },
  statusFootnote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  section: { marginTop: spacing[24] },
  sectionTitle: { color: colors.ink, fontSize: 18, fontWeight: '900', marginHorizontal: spacing[20] },
  endpointsCard: { marginHorizontal: spacing[20], marginTop: spacing[12], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  endpointDot: { width: 12, height: 12, borderRadius: radius.pill, backgroundColor: colors.olive700, borderWidth: 3, borderColor: colors.limestone },
  endpointDotEnd: { backgroundColor: colors.aoveGold },
  endpointCopy: { flex: 1 },
  endpointLabel: { color: colors.muted, fontSize: 10, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.8 },
  endpointName: { color: colors.ink, fontSize: 15, fontWeight: '900', lineHeight: 21, marginTop: spacing[4] },
  directionArrow: { color: colors.olive700, fontSize: 22, fontWeight: '900', marginLeft: spacing[4], marginVertical: spacing[4] },
  directionNote: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: spacing[16] },
  communityCard: { marginHorizontal: spacing[20], marginTop: spacing[20], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.limestone, borderWidth: 1, borderColor: colors.border },
  communityHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  communityTitle: { color: colors.olive900, fontSize: 13, fontWeight: '900' },
  communityBadge: { color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, borderRadius: radius.pill, backgroundColor: colors.white, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  communityStats: { flexDirection: 'row', gap: spacing[8], marginTop: spacing[16] },
  communityStat: { flex: 1, minHeight: 68, borderRadius: radius.md, backgroundColor: colors.white, padding: spacing[12], justifyContent: 'center' },
  communityValue: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  communityLabel: { color: colors.muted, fontSize: 10, lineHeight: 14, marginTop: spacing[4] },
  communityTrackType: { color: colors.olive900, fontSize: 11, fontWeight: '900', marginTop: spacing[12] },
  communityNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  inlineSourceLink: { alignSelf: 'flex-start', marginTop: spacing[12], paddingVertical: spacing[4] },
  inlineSourceText: { color: colors.olive900, fontSize: 12, fontWeight: '900', textDecorationLine: 'underline' },
  galleryPrivacyNotice: { marginHorizontal: spacing[20], marginTop: spacing[12], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive700, backgroundColor: colors.limestone, padding: spacing[16] },
  galleryPrivacyTitle: { color: colors.olive900, fontSize: 12, fontWeight: '900' },
  galleryPrivacyBody: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  galleryPickerNote: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing[8] },
  galleryProvenance: { marginHorizontal: spacing[20], marginTop: spacing[16], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  galleryStatus: { color: colors.olive900, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center', marginTop: spacing[12] },
  galleryBody: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing[8] },
  mapHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], marginRight: spacing[20] },
  mapHeadingCopy: { flex: 1 },
  mapAreaLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', marginHorizontal: spacing[20], marginTop: spacing[4] },
  mapBadge: { color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  mapNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginHorizontal: spacing[20], marginTop: spacing[8] },
  mapA11yFrame: { marginTop: spacing[4] },
  nonNavigationNotice: { color: colors.olive900, fontSize: 11, lineHeight: 17, fontWeight: '800', marginHorizontal: spacing[20] },
  sourcesCard: { marginHorizontal: spacing[20], marginTop: spacing[24], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  sourcesIntro: { color: colors.muted, fontSize: 12, lineHeight: 18, marginHorizontal: spacing[20], marginTop: spacing[8] },
  sourceLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[8], paddingTop: spacing[8] },
  sourceLinkText: { flex: 1, color: colors.olive900, fontSize: 12, lineHeight: 17, fontWeight: '800', textDecorationLine: 'underline' },
  sourceArrow: { color: colors.olive700, fontSize: 17, fontWeight: '900' },
  footerNotice: { marginHorizontal: spacing[20], marginTop: spacing[16], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.olive900 },
  footerTitle: { color: colors.aoveGold, fontSize: 13, fontWeight: '900' },
  footerBody: { color: colors.white, fontSize: 11, lineHeight: 17, marginTop: spacing[8] },
  mutedBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  notFound: { flex: 1, padding: spacing[24], justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
