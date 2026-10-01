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
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.hero}>
          <View style={styles.heroTopRow}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Volver"
              accessibilityHint="Regresa a la lista de rutas."
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Text style={styles.backText}>←</Text>
            </Pressable>
            <Text style={styles.heroKicker}>{information.qaLabel}</Text>
          </View>
          <View style={styles.heroIdentity}>
            <View style={styles.statusPill}>
              <View style={styles.statusDot} />
              <Text style={styles.statusPillText}>{information.traceStatus.toUpperCase()}</Text>
            </View>
            <Text style={styles.heroTitle}>{information.title}</Text>
            <Text style={styles.heroLocation}>{information.municipality}</Text>
            <View style={styles.heroRule} />
            <Text style={styles.heroCaption}>Información de ruta · sin navegación GPS</Text>
          </View>
        </View>

        <View style={styles.municipalStatusCard}>
          <Text style={styles.provenanceKicker}>ESTADO · FUENTE MUNICIPAL</Text>
          <Text style={styles.statusTitle}>{information.statusLabel}</Text>
          <Text style={styles.body}>{information.statusDetail}</Text>
          <Text style={styles.statusFootnote}>{information.officialDataNotice}</Text>
        </View>

        <View testID="municipal-sources-card" style={styles.sourcesCard}>
          <Text style={styles.sectionKicker}>FUENTES Y PROCEDENCIA</Text>
          <Text style={styles.sourcesTitle}>Origen de la información</Text>
          <Text style={styles.sourcesIntro}>
            Los datos municipales y las referencias de terceros se presentan por separado.
          </Text>

          <View testID="official-source-card" style={styles.officialSourceCard}>
            <View style={styles.sourcePanelHeader}>
              <View style={styles.sourcePanelHeaderCopy}>
                <Text style={styles.sourcePanelKicker}>DATOS OFICIALES</Text>
                <Text style={styles.sourcePanelTitle}>Ayuntamiento</Text>
              </View>
              <Text style={styles.sourceBadge}>OFICIAL</Text>
            </View>
            <Text style={styles.endpointLabel}>NOMBRE PUBLICADO</Text>
            <Text style={styles.endpointName}>{information.title}</Text>
            <Text style={[styles.endpointLabel, styles.sourceSectionSpacing]}>EXTREMOS INDICADOS</Text>
            <View style={styles.endpointRow}>
              <View style={styles.endpointMarker}>
                <View style={styles.endpointDot} />
              </View>
              <View style={styles.endpointCopy}>
                <Text style={styles.endpointLabel}>EXTREMO MUNICIPAL A</Text>
                <Text style={styles.endpointName}>{information.endpoints[0]}</Text>
              </View>
            </View>
            <View style={styles.directionRow}>
              <View style={styles.directionRule} />
              <View
                accessible
                accessibilityLabel="El Ayuntamiento indica ambos sentidos"
                style={styles.directionPill}
              >
                <Text accessible={false} style={styles.directionArrow}>↕</Text>
                <Text style={styles.directionPillText}>AMBOS SENTIDOS</Text>
              </View>
              <View style={styles.directionRule} />
            </View>
            <View style={styles.endpointRow}>
              <View style={[styles.endpointMarker, styles.endpointMarkerEnd]}>
                <View style={[styles.endpointDot, styles.endpointDotEnd]} />
              </View>
              <View style={styles.endpointCopy}>
                <Text style={styles.endpointLabel}>EXTREMO MUNICIPAL B</Text>
                <Text style={styles.endpointName}>{information.endpoints[1]}</Text>
              </View>
            </View>
            <Text style={styles.directionNote}>{information.directionNote}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Abrir aviso municipal original: ${information.officialSource.label}`}
              accessibilityHint="Abre la publicación original del Ayuntamiento en el navegador del dispositivo."
              style={styles.sourceLink}
              onPress={() => void openSource(information.officialSource.url)}
            >
              <Text style={styles.sourceLinkText}>Abrir aviso municipal original ↗</Text>
              <Text accessible={false} style={styles.sourceArrow}>↗</Text>
            </Pressable>
          </View>

          <View testID="community-source-card" style={styles.communityCard}>
            <View style={styles.communityHeader}>
              <View style={styles.communityHeadingCopy}>
                <Text style={styles.communityKicker}>REFERENCIA COMUNITARIA</Text>
                <Text style={styles.communityTitle}>{information.communityReference.label}</Text>
              </View>
              <Text style={styles.communityBadge}>NO OFICIAL</Text>
            </View>
            <Text style={styles.communityNote}>{information.communityReference.note}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={information.communityReference.sourceLabel}
              accessibilityHint="Abre Wikiloc como referencia comunitaria no oficial en el navegador del dispositivo."
              style={styles.inlineSourceLink}
              onPress={() => void openSource(information.communityReference.sourceUrl)}
            >
              <Text style={styles.inlineSourceText}>Abrir ficha de Wikiloc · referencia no oficial ↗</Text>
            </Pressable>
          </View>
        </View>

        <View testID="personal-gallery-section" style={styles.section}>
          <View style={styles.sectionHeading}>
            <View style={styles.sectionHeadingCopy}>
              <Text style={styles.sectionKicker}>TUS IMÁGENES</Text>
              <Text style={styles.sectionTitle}>Galería personal</Text>
            </View>
            <Text style={styles.localBadge}>SOLO LOCAL</Text>
          </View>
          <View testID="gallery-privacy-notice" style={styles.galleryPrivacyNotice}>
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
                <Text style={styles.sectionKicker}>CARTOGRAFÍA BASE</Text>
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

        <View style={styles.otherSourcesCard}>
          <Text style={styles.sectionKicker}>OTRAS REFERENCIAS</Text>
          <Text style={styles.sourcesTitle}>Cartografía y licencias</Text>
          {information.sourceLinks.filter((source) => source.id !== 'municipal').map((source) => (
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
  scrollView: { backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[32] },
  hero: {
    minHeight: 360,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[16],
    paddingBottom: spacing[32],
    justifyContent: 'space-between',
  },
  heroTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[12] },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  heroKicker: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  heroIdentity: { marginTop: spacing[32] },
  statusPill: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.aoveGold,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  statusDot: { width: 7, height: 7, borderRadius: radius.pill, backgroundColor: colors.aoveGold },
  statusPillText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.7 },
  heroTitle: { color: colors.white, fontSize: typography.display, lineHeight: 39, fontWeight: '900', marginTop: spacing[16] },
  heroLocation: { color: colors.limestone, fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: spacing[8] },
  heroRule: { width: 52, height: 2, backgroundColor: colors.aoveGold, marginTop: spacing[20] },
  heroCaption: { color: colors.aoveGold, fontSize: 11, lineHeight: 17, fontWeight: '800', marginTop: spacing[12] },
  municipalStatusCard: {
    marginHorizontal: spacing[16],
    marginTop: -spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderLeftWidth: 4,
    borderColor: colors.border,
    borderLeftColor: colors.olive700,
    padding: spacing[20],
    backgroundColor: colors.white,
    ...shadow.card,
  },
  provenanceKicker: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  statusTitle: { color: colors.ink, fontSize: 17, lineHeight: 22, fontWeight: '900', marginTop: spacing[8] },
  body: { color: colors.ink, fontSize: 15, lineHeight: 21, marginTop: spacing[8] },
  statusFootnote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[12], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  section: { marginTop: spacing[32] },
  sectionHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], marginHorizontal: spacing[20] },
  sectionHeadingCopy: { flex: 1 },
  sectionKicker: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  sectionTitle: { color: colors.ink, fontSize: typography.section, lineHeight: 26, fontWeight: '900', marginTop: spacing[4] },
  sourceBadge: { color: colors.olive900, fontSize: 10, fontWeight: '900', letterSpacing: 0.5, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  officialSourceCard: { marginTop: spacing[16], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderLeftWidth: 4, borderLeftColor: colors.olive700 },
  sourcePanelHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], marginBottom: spacing[16] },
  sourcePanelHeaderCopy: { flex: 1 },
  sourcePanelKicker: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  sourcePanelTitle: { color: colors.ink, fontSize: 15, fontWeight: '900', marginTop: spacing[4] },
  sourceSectionSpacing: { marginTop: spacing[16] },
  endpointRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[12] },
  endpointMarker: { width: 28, height: 28, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.limestone, alignItems: 'center', justifyContent: 'center' },
  endpointMarkerEnd: { backgroundColor: colors.limestone },
  endpointDot: { width: 10, height: 10, borderRadius: radius.pill, backgroundColor: colors.olive700 },
  endpointDotEnd: { backgroundColor: colors.aoveGold },
  endpointCopy: { flex: 1 },
  endpointLabel: { color: colors.muted, fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  endpointName: { color: colors.ink, fontSize: 15, lineHeight: 21, fontWeight: '900', marginTop: spacing[4] },
  directionRow: { flexDirection: 'row', alignItems: 'center', gap: spacing[8], marginVertical: spacing[12] },
  directionRule: { flex: 1, height: 1, backgroundColor: colors.border },
  directionPill: { flexDirection: 'row', alignItems: 'center', gap: spacing[4], borderRadius: radius.pill, backgroundColor: colors.olive900, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  directionArrow: { color: colors.aoveGold, fontSize: 15, lineHeight: 16, fontWeight: '900' },
  directionPillText: { color: colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },
  directionNote: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '800', marginTop: spacing[16], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  communityCard: { marginTop: spacing[16], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.warmBackground, borderWidth: 1, borderLeftWidth: 4, borderColor: colors.border, borderLeftColor: colors.aoveGold },
  communityHeader: { flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  communityHeadingCopy: { flex: 1, minWidth: 180 },
  communityKicker: { color: colors.earth, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  communityTitle: { color: colors.olive900, fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: spacing[4] },
  communityBadge: { color: colors.white, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, borderRadius: radius.pill, backgroundColor: colors.earth, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  communityNote: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  inlineSourceLink: { alignSelf: 'flex-start', marginTop: spacing[12], paddingVertical: spacing[4] },
  inlineSourceText: { color: colors.olive900, fontSize: 13, fontWeight: '900', textDecorationLine: 'underline' },
  localBadge: { color: colors.olive900, fontSize: 10, fontWeight: '900', letterSpacing: 0.8, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  galleryPrivacyNotice: { marginHorizontal: spacing[16], marginTop: spacing[12], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive700, backgroundColor: colors.white, padding: spacing[16] },
  galleryPrivacyTitle: { color: colors.olive900, fontSize: 12, fontWeight: '900' },
  galleryPrivacyBody: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  galleryPickerNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  galleryProvenance: { marginHorizontal: spacing[20], marginTop: spacing[16], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[12] },
  galleryStatus: { color: colors.olive900, fontSize: 12, lineHeight: 17, fontWeight: '900', letterSpacing: 0.6, textAlign: 'center', marginTop: spacing[12] },
  galleryBody: { color: colors.ink, fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: spacing[8] },
  mapHeading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], marginHorizontal: spacing[20] },
  mapHeadingCopy: { flex: 1 },
  mapAreaLabel: { color: colors.olive700, fontSize: 11, fontWeight: '800', marginTop: spacing[4] },
  mapBadge: { color: colors.olive900, fontSize: 10, fontWeight: '900', letterSpacing: 0.6, borderRadius: radius.pill, backgroundColor: colors.limestone, paddingHorizontal: spacing[8], paddingVertical: spacing[4] },
  mapNote: { color: colors.ink, fontSize: 13, lineHeight: 19, marginHorizontal: spacing[20], marginTop: spacing[8] },
  mapA11yFrame: { marginTop: spacing[4] },
  nonNavigationNotice: { color: colors.olive900, fontSize: 12, lineHeight: 18, fontWeight: '800', marginHorizontal: spacing[20] },
  sourcesCard: { marginHorizontal: spacing[16], marginTop: spacing[32], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  otherSourcesCard: { marginHorizontal: spacing[16], marginTop: spacing[32], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  sourcesTitle: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: spacing[4] },
  sourcesIntro: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  sourceLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[8], paddingTop: spacing[8] },
  sourceLinkText: { flex: 1, color: colors.olive900, fontSize: 13, lineHeight: 18, fontWeight: '800', textDecorationLine: 'underline' },
  sourceArrow: { color: colors.olive700, fontSize: 17, fontWeight: '900' },
  footerNotice: { marginHorizontal: spacing[16], marginTop: spacing[16], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.olive900 },
  footerTitle: { color: colors.aoveGold, fontSize: 13, fontWeight: '900' },
  footerBody: { color: colors.white, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  mutedBody: { color: colors.ink, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  notFound: { flex: 1, padding: spacing[24], justifyContent: 'center', alignItems: 'center' },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
