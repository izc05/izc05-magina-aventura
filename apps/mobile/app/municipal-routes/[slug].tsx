import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMunicipalRouteInformationBySlug,
  municipalRouteInformationViewModel,
} from '../../src/features/routes/municipal-route-information';
import { PersonalRouteGallery } from '../../src/features/routes/PersonalRouteGallery';
import { CommonsContextGallery } from '../../src/features/routes/CommonsContextGallery';
import { GpxLocalPreviewSection } from '../../src/features/routes/GpxLocalPreviewSection';
import { RouteMap } from '../../src/map/RouteMap';
import { createBaseMapReferenceProps } from '../../src/map/map-reference';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

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
          <Text accessibilityRole="header" style={styles.notFoundTitle}>Información no disponible</Text>
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
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View testID="municipal-route-hero" style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              accessibilityHint="Regresa a la lista de rutas."
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text accessible={false} style={styles.backText}>←</Text>
            </Pressable>
            <View style={styles.heroTopCopy}>
              <Text style={styles.heroKicker}>{information.qaLabel}</Text>
              <Text style={styles.heroOverline}>GUÍA MUNICIPAL · BEDMAR</Text>
            </View>
            <View accessible={false} style={styles.heroSeal}>
              <Text style={styles.heroSealText}>M</Text>
            </View>
          </View>

          <View style={styles.heroIdentity}>
            <Text style={styles.heroEyebrow}>SENDERO FLUVIAL</Text>
            <Text accessibilityRole="header" style={styles.heroTitle}>{information.title}</Text>
            <Text style={styles.heroLocation}>{information.municipality}</Text>
          </View>

          <View
            testID="hero-photo-pending"
            accessible
            accessibilityRole="image"
            accessibilityLabel="Composición geométrica abstracta, no es fotografía ni mapa. La fotografía del sendero está pendiente de permiso o licencia compatible."
            style={styles.heroArtwork}
          >
            <View accessible={false} style={styles.abstractMark}>
              <View style={styles.abstractDisk} />
              <View style={styles.abstractBarOne} />
              <View style={styles.abstractBarTwo} />
              <View style={styles.abstractBarThree} />
            </View>
            <View style={styles.heroArtworkCopy}>
              <Text style={styles.artworkKicker}>FOTOGRAFÍA DEL SENDERO</Text>
              <Text style={styles.artworkTitle}>Pendiente de permiso</Text>
              <Text style={styles.artworkNote}>Motivo abstracto · no es una foto</Text>
            </View>
          </View>

          <View style={styles.heroFooter}>
            <Text style={styles.heroFooterText}>Información municipal</Text>
            <Text style={styles.heroFooterDivider}>·</Text>
            <Text style={styles.heroFooterText}>Sin navegación GPS</Text>
          </View>
        </View>

        <View testID="route-facts-section" style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionKicker}>PUNTO DE PARTIDA Y LLEGADA</Text>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Extremos indicados</Text>
            </View>
            <Text style={styles.municipalBadge}>AYUNTAMIENTO</Text>
          </View>
          <View testID="route-facts-card" style={styles.routeFactsCard}>
            <Text style={styles.factsIntro}>Nombres publicados para el sendero</Text>
            <View style={styles.endpointRow}>
              <View style={styles.endpointMarker}>
                <Text style={styles.endpointMarkerText}>A</Text>
              </View>
              <View style={styles.endpointCopy}>
                <Text style={styles.endpointLabel}>EXTREMO MUNICIPAL A</Text>
                <Text style={styles.endpointName}>{information.endpoints[0]}</Text>
              </View>
            </View>
            <View style={styles.endpointRow}>
              <View style={[styles.endpointMarker, styles.endpointMarkerEnd]}>
                <Text style={[styles.endpointMarkerText, styles.endpointMarkerTextEnd]}>B</Text>
              </View>
              <View style={styles.endpointCopy}>
                <Text style={styles.endpointLabel}>EXTREMO MUNICIPAL B</Text>
                <Text style={styles.endpointName}>{information.endpoints[1]}</Text>
              </View>
            </View>
            <View
              accessible
              accessibilityLabel="El Ayuntamiento indica que puede recorrerse en ambos sentidos."
              style={styles.directionCallout}
            >
              <Text accessible={false} style={styles.directionArrow}>↕</Text>
              <Text style={styles.directionText}>AMBOS SENTIDOS</Text>
            </View>
            <Text style={styles.factsFootnote}>{information.directionNote}</Text>
          </View>
        </View>

        <View testID="municipal-status-card" style={styles.statusCard}>
          <View style={styles.statusCardHeader}>
            <View style={styles.statusDot} />
            <Text style={styles.statusKicker}>ESTADO DE LA INFORMACIÓN</Text>
          </View>
          <Text style={styles.statusTitle}>{information.statusLabel}</Text>
          <Text style={styles.statusBody}>{information.statusDetail}</Text>
          <Text style={styles.statusFootnote}>{information.officialDataNotice}</Text>
        </View>

        <View testID="official-general-hiking-recommendations" style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionKicker}>JUNTA DE ANDALUCÍA · SENDERISMO</Text>
              <Text accessibilityRole="header" style={styles.sectionTitle}>
                {information.generalHikingRecommendations.title}
              </Text>
            </View>
          </View>
          <View testID="official-general-hiking-recommendations-card" style={styles.hikingRecommendationsCard}>
            <Text style={styles.recommendationsAttribution}>
              {information.generalHikingRecommendations.attribution}
            </Text>
            <Text style={styles.recommendationsScopeNote}>
              {information.generalHikingRecommendations.scopeNote}
            </Text>
            <View style={styles.recommendationsList}>
              {information.generalHikingRecommendations.items.map((recommendation) => (
                <Text key={recommendation} style={styles.recommendationItem}>• {recommendation}</Text>
              ))}
            </View>
            <Pressable
              testID="official-general-hiking-recommendations-source-link"
              accessibilityRole="link"
              accessibilityLabel={information.generalHikingRecommendations.sourceLabel}
              accessibilityHint="Abre las recomendaciones generales de senderismo publicadas por la Junta de Andalucía."
              style={styles.sourceLink}
              onPress={() => void openSource(information.generalHikingRecommendations.sourceUrl)}
            >
              <Text style={styles.sourceLinkText}>{information.generalHikingRecommendations.sourceLabel}</Text>
              <Text accessible={false} style={styles.sourceArrow}>↗</Text>
            </Pressable>
          </View>
        </View>

        {information.showContextMap ? (
          <View testID="context-map-section" style={styles.section}>
            <View style={styles.sectionHeading}>
              <View style={styles.sectionHeadingCopy}>
                <Text style={styles.sectionKicker}>ORIENTACIÓN VISUAL</Text>
                <Text accessibilityRole="header" style={styles.sectionTitle}>{information.contextMap.title}</Text>
                <Text style={styles.mapAreaLabel}>{information.contextMap.areaLabel}</Text>
              </View>
              <Text style={styles.contextBadge}>SOLO CONTEXTO</Text>
            </View>
            <Text style={styles.mapNote}>{information.contextMap.note}</Text>
            <View
              testID="context-map-accessible-frame"
              accessible
              accessibilityRole="image"
              accessibilityLabel={information.contextMap.accessibilityLabel}
              style={styles.mapFrame}
            >
              <RouteMap {...contextMapProps} height={228} />
            </View>
            <View testID="non-navigation-notice" style={styles.nonNavigationNotice}>
              <Text style={styles.noticeIcon} accessible={false}>!</Text>
              <Text style={styles.nonNavigationText}>{information.nonNavigationNotice}</Text>
            </View>
          </View>
        ) : null}

        <View testID="municipal-sources-card" style={styles.sourcesSection}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionKicker}>PROCEDENCIA</Text>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Fuentes separadas</Text>
            </View>
            <Text style={styles.sourceCount}>01 OFICIAL · 01 COMUNITARIA</Text>
          </View>
          <Text style={styles.sourcesIntro}>
            Los datos del Ayuntamiento y la referencia comunitaria se identifican por separado; no se mezclan ni se completan entre sí.
          </Text>

          <View testID="official-source-card" style={styles.officialSourceCard}>
            <View style={styles.sourcePanelHeader}>
              <View style={styles.sourceBadgeOfficial}>
                <Text style={styles.sourceBadgeOfficialText}>OFICIAL</Text>
              </View>
              <View style={styles.sourcePanelHeaderCopy}>
                <Text style={styles.sourcePanelKicker}>FUENTE MUNICIPAL</Text>
                <Text accessibilityRole="header" style={styles.sourcePanelTitle}>Ayuntamiento</Text>
              </View>
            </View>
            <Text style={styles.sourceDetailLabel}>PUBLICACIÓN CONSULTADA</Text>
            <Text style={styles.sourceDetail}>{information.officialSource.label}</Text>
            <Text style={styles.sourcePanelNote}>
              Los nombres de los extremos y la indicación de ambos sentidos se atribuyen a la publicación municipal.
            </Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Abrir aviso municipal original: ${information.officialSource.label}`}
              accessibilityHint="Abre la publicación original del Ayuntamiento en el navegador del dispositivo."
              style={styles.sourceLink}
              onPress={() => void openSource(information.officialSource.url)}
            >
              <Text style={styles.sourceLinkText}>Abrir aviso municipal original</Text>
              <Text accessible={false} style={styles.sourceArrow}>↗</Text>
            </Pressable>
          </View>

          <View testID="community-source-card" style={styles.communityCard}>
            <View style={styles.communityHeader}>
              <View style={styles.communityBadge}>
                <Text style={styles.communityBadgeText}>COMUNITARIA</Text>
              </View>
              <Text style={styles.communityKicker}>REFERENCIA EXTERNA</Text>
            </View>
            <Text accessibilityRole="header" style={styles.communityTitle}>{information.communityReference.label}</Text>
            <Text style={styles.communityNote}>{information.communityReference.note}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={information.communityReference.sourceLabel}
              accessibilityHint="Abre Wikiloc como referencia comunitaria no oficial en el navegador del dispositivo."
              style={styles.inlineSourceLink}
              onPress={() => void openSource(information.communityReference.sourceUrl)}
            >
              <Text style={styles.inlineSourceText}>Abrir ficha comunitaria · referencia no oficial</Text>
              <Text accessible={false} style={styles.sourceArrow}>↗</Text>
            </Pressable>
          </View>

          <View testID="other-sources-card" style={styles.otherSourcesCard}>
            <Text style={styles.otherSourcesTitle}>Cartografía y derechos de imagen</Text>
            {information.sourceLinks.filter((source) => source.id !== 'municipal').map((source) => (
              <Pressable
                key={source.id}
                accessibilityRole="link"
                accessibilityLabel={`Abrir fuente: ${source.label}`}
                accessibilityHint="Abre una página externa."
                style={styles.otherSourceLink}
                onPress={() => void openSource(source.url)}
              >
                <Text style={styles.otherSourceLinkText}>{source.label}</Text>
                <Text accessible={false} style={styles.sourceArrow}>↗</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {route.slug === 'sendero-fluvial-cueva-del-agua' ? <CommonsContextGallery /> : null}

        <View testID="personal-gallery-section" style={styles.gallerySection}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionKicker}>FOTOS DE TU RECORRIDO</Text>
              <Text accessibilityRole="header" style={styles.sectionTitle}>Galería personal</Text>
            </View>
            <Text style={styles.localBadge}>SOLO LOCAL</Text>
          </View>
          <View testID="gallery-privacy-notice" style={styles.galleryPrivacyNotice}>
            <Text style={styles.galleryPrivacyTitle}>Tus fotos, en este dispositivo</Text>
            <Text style={styles.galleryPrivacyBody}>
              Aquí solo aparecen imágenes que tú eliges. Se guardan en el almacenamiento privado de esta app: no se publican, no se sincronizan y no mostramos fotos comunitarias ni contenido online.
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

        {route.slug === 'sendero-fluvial-cueva-del-agua' ? <GpxLocalPreviewSection /> : null}

        <View testID="route-status-footer" style={styles.footerNotice}>
          <Text style={styles.footerTitle}>{information.traceStatus}</Text>
          <Text style={styles.footerBody}>{information.gpsNotice}</Text>
          <Text style={styles.footerBody}>
            No se muestran perfil, checkpoints, recompensas ni progreso porque no hay datos verificados para esta ficha.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  scrollView: { backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[32] },
  hero: {
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[16],
    paddingBottom: spacing[20],
    borderBottomLeftRadius: radius.lg,
    borderBottomRightRadius: radius.lg,
  },
  heroTopRow: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  heroTopCopy: { flex: 1 },
  heroKicker: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  heroOverline: { color: colors.limestone, fontSize: 10, fontWeight: '800', letterSpacing: 0.8, marginTop: spacing[4] },
  heroSeal: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.aoveGold,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ rotate: '3deg' }],
  },
  heroSealText: { color: colors.aoveGold, fontSize: 19, fontWeight: '900' },
  heroIdentity: { marginTop: spacing[24] },
  heroEyebrow: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.3 },
  heroTitle: {
    color: colors.white,
    fontSize: typography.display,
    lineHeight: 38,
    letterSpacing: -0.6,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  heroLocation: { color: colors.limestone, fontSize: 14, lineHeight: 20, fontWeight: '700', marginTop: spacing[12] },
  heroArtwork: {
    minHeight: 104,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[16],
    marginTop: spacing[20],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.olive500,
    backgroundColor: colors.olive700,
    padding: spacing[16],
  },
  abstractMark: {
    width: 64,
    height: 64,
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  abstractDisk: { position: 'absolute', width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.aoveGold, top: 8, left: 9 },
  abstractBarOne: { position: 'absolute', width: 54, height: 8, borderRadius: radius.pill, backgroundColor: colors.limestone, bottom: 13, left: 5, transform: [{ rotate: '-18deg' }] },
  abstractBarTwo: { position: 'absolute', width: 34, height: 6, borderRadius: radius.pill, backgroundColor: colors.olive500, top: 11, right: -4, transform: [{ rotate: '52deg' }] },
  abstractBarThree: { position: 'absolute', width: 26, height: 5, borderRadius: radius.pill, backgroundColor: colors.white, bottom: 9, right: 6, transform: [{ rotate: '18deg' }] },
  heroArtworkCopy: { flex: 1 },
  artworkKicker: { color: colors.limestone, fontSize: 9, fontWeight: '900', letterSpacing: 0.9 },
  artworkTitle: { color: colors.white, fontSize: 16, lineHeight: 21, fontWeight: '900', marginTop: spacing[4] },
  artworkNote: { color: colors.limestone, fontSize: 11, lineHeight: 16, marginTop: spacing[4] },
  heroFooter: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginTop: spacing[16] },
  heroFooterText: { color: colors.limestone, fontSize: 10, fontWeight: '800', letterSpacing: 0.3 },
  heroFooterDivider: { color: colors.aoveGold, fontSize: 14, fontWeight: '900' },
  section: { marginTop: spacing[32] },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], marginHorizontal: spacing[20] },
  sectionHeadingCopy: { flex: 1 },
  sectionKicker: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: colors.ink, fontSize: typography.section, lineHeight: 26, fontWeight: '900', marginTop: spacing[4] },
  municipalBadge: { color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.4, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[8], paddingVertical: spacing[8] },
  routeFactsCard: {
    marginHorizontal: spacing[16],
    marginTop: spacing[12],
    padding: spacing[20],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  factsIntro: { color: colors.muted, fontSize: 12, lineHeight: 18, fontWeight: '700', marginBottom: spacing[16] },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12], paddingVertical: spacing[8] },
  endpointMarker: { width: 40, height: 40, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  endpointMarkerEnd: { backgroundColor: colors.earth },
  endpointMarkerText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  endpointMarkerTextEnd: { color: colors.white },
  endpointCopy: { flex: 1 },
  endpointLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  endpointName: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '900', marginTop: spacing[4] },
  directionCallout: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing[8], marginTop: spacing[12], borderRadius: radius.md, backgroundColor: colors.limestone, paddingHorizontal: spacing[12] },
  directionArrow: { color: colors.olive900, fontSize: 21, fontWeight: '900' },
  directionText: { color: colors.olive900, fontSize: 11, fontWeight: '900', letterSpacing: 0.7 },
  factsFootnote: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '700', marginTop: spacing[12] },
  statusCard: { marginHorizontal: spacing[16], marginTop: spacing[20], borderRadius: radius.md, borderLeftWidth: 4, borderLeftColor: colors.olive700, borderWidth: 1, borderColor: colors.border, padding: spacing[16], backgroundColor: colors.white },
  statusCardHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[8] },
  statusDot: { width: 8, height: 8, borderRadius: radius.pill, backgroundColor: colors.olive700 },
  statusKicker: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  statusTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '900', marginTop: spacing[8] },
  statusBody: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: spacing[8] },
  statusFootnote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  hikingRecommendationsCard: { marginHorizontal: spacing[16], marginTop: spacing[12], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.limestone, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.olive700 },
  recommendationsAttribution: { color: colors.olive700, fontSize: 11, lineHeight: 17, fontWeight: '800' },
  recommendationsScopeNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  recommendationsList: { gap: spacing[8], marginTop: spacing[12] },
  recommendationItem: { color: colors.ink, fontSize: 13, lineHeight: 19 },
  mapAreaLabel: { color: colors.olive700, fontSize: 11, fontWeight: '800', marginTop: spacing[4] },
  contextBadge: { color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.5, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[8], paddingVertical: spacing[8] },
  mapNote: { color: colors.ink, fontSize: 13, lineHeight: 19, marginHorizontal: spacing[20], marginTop: spacing[8] },
  mapFrame: { overflow: 'hidden', marginHorizontal: spacing[16], marginTop: spacing[12], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, ...shadow.card },
  nonNavigationNotice: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[8], marginHorizontal: spacing[16], marginTop: spacing[8], borderRadius: radius.md, backgroundColor: colors.limestone, padding: spacing[12] },
  noticeIcon: { width: 20, height: 20, borderRadius: radius.pill, overflow: 'hidden', textAlign: 'center', textAlignVertical: 'center', color: colors.white, backgroundColor: colors.earth, fontSize: 13, fontWeight: '900' },
  nonNavigationText: { flex: 1, color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '700' },
  sourcesSection: { marginTop: spacing[32] },
  sourceCount: { color: colors.muted, fontSize: 8, fontWeight: '900', letterSpacing: 0.3, textAlign: 'right' },
  sourcesIntro: { color: colors.ink, fontSize: 13, lineHeight: 19, marginHorizontal: spacing[20], marginTop: spacing[8] },
  officialSourceCard: { marginHorizontal: spacing[16], marginTop: spacing[16], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.olive700, ...shadow.card },
  sourcePanelHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  sourceBadgeOfficial: { minWidth: 72, minHeight: 40, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[8] },
  sourceBadgeOfficialText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  sourcePanelHeaderCopy: { flex: 1 },
  sourcePanelKicker: { color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  sourcePanelTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '900', marginTop: spacing[4] },
  sourceDetailLabel: { color: colors.muted, fontSize: 9, fontWeight: '900', letterSpacing: 0.8, marginTop: spacing[16] },
  sourceDetail: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '800', marginTop: spacing[4] },
  sourcePanelNote: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  sourceLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[12], paddingTop: spacing[8] },
  sourceLinkText: { flex: 1, color: colors.olive900, fontSize: 13, lineHeight: 18, fontWeight: '900', textDecorationLine: 'underline' },
  sourceArrow: { color: colors.olive700, fontSize: 17, fontWeight: '900' },
  communityCard: { marginHorizontal: spacing[16], marginTop: spacing[12], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.limestone, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.earth },
  communityHeader: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: spacing[8] },
  communityBadge: { minHeight: 32, borderRadius: radius.pill, backgroundColor: colors.earth, justifyContent: 'center', paddingHorizontal: spacing[12] },
  communityBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  communityKicker: { color: colors.earth, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  communityTitle: { color: colors.olive900, fontSize: 16, lineHeight: 22, fontWeight: '900', marginTop: spacing[12] },
  communityNote: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  inlineSourceLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[12], paddingTop: spacing[8] },
  inlineSourceText: { flex: 1, color: colors.olive900, fontSize: 13, lineHeight: 18, fontWeight: '900', textDecorationLine: 'underline' },
  otherSourcesCard: { marginHorizontal: spacing[16], marginTop: spacing[12], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  otherSourcesTitle: { color: colors.ink, fontSize: 14, lineHeight: 19, fontWeight: '900', marginBottom: spacing[4] },
  otherSourceLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[8], paddingTop: spacing[8] },
  otherSourceLinkText: { flex: 1, color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '800', textDecorationLine: 'underline' },
  gallerySection: { marginTop: spacing[32] },
  localBadge: { color: colors.olive900, fontSize: 9, fontWeight: '900', letterSpacing: 0.6, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  galleryPrivacyNotice: { marginHorizontal: spacing[16], marginTop: spacing[12], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive700, backgroundColor: colors.white, padding: spacing[16] },
  galleryPrivacyTitle: { color: colors.olive900, fontSize: 13, fontWeight: '900' },
  galleryPrivacyBody: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  galleryPickerNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  galleryProvenance: { marginHorizontal: spacing[20], marginTop: spacing[16], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  galleryStatus: { color: colors.olive900, fontSize: 11, lineHeight: 17, fontWeight: '900', letterSpacing: 0.5, marginTop: spacing[8] },
  galleryBody: { color: colors.ink, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  footerNotice: { marginHorizontal: spacing[16], marginTop: spacing[24], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.olive900 },
  footerTitle: { color: colors.aoveGold, fontSize: 13, fontWeight: '900' },
  footerBody: { color: colors.white, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  mutedBody: { color: colors.ink, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  notFound: { flex: 1, padding: spacing[24], justifyContent: 'center', alignItems: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12], minHeight: 48, justifyContent: 'center' },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
