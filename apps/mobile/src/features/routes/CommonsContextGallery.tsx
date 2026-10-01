import { useState } from 'react';
import {
  Alert,
  Image,
  Linking,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { CC_BY_SA_4_0_URL, commonsContextPhotos } from './commons-context-assets';

const CONTEXT_WARNING = 'paraje Cueva del Agua/Río Cuadros, fotos de 2014; no documentan la senda nueva ni validan el trazado';
const LICENSE_LABEL = 'Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)';

async function openSource(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Fuente no disponible', 'No se pudo abrir el enlace externo.');
  }
}

export function CommonsContextGallery() {
  const [selectedPhotoId, setSelectedPhotoId] = useState<string | null>(null);
  const selectedPhotoIndex = commonsContextPhotos.findIndex((photo) => photo.id === selectedPhotoId);
  const selectedPhoto = selectedPhotoIndex >= 0 ? commonsContextPhotos[selectedPhotoIndex] ?? null : null;
  const photoCount = commonsContextPhotos.length;

  const showAdjacentPhoto = (offset: number) => {
    if (selectedPhotoIndex < 0 || photoCount === 0) return;
    const nextIndex = (selectedPhotoIndex + offset + photoCount) % photoCount;
    const nextPhoto = commonsContextPhotos[nextIndex];
    if (nextPhoto) setSelectedPhotoId(nextPhoto.id);
  };

  return (
    <View testID="commons-context-gallery-section" style={styles.section}>
      <View style={styles.heading}>
        <View style={styles.headingCopy}>
          <Text style={styles.kicker}>PARAJE · ARCHIVO FOTOGRÁFICO</Text>
          <Text accessibilityRole="header" style={styles.title}>Río Cuadros / Cueva del Agua (2014)</Text>
        </View>
        <Text style={styles.badge}>2014</Text>
      </View>

      <View testID="commons-photo-context-warning" style={styles.contextWarning}>
        <Text style={styles.warningTitle}>Imágenes de contexto histórico</Text>
        <Text accessibilityLabel={CONTEXT_WARNING} style={styles.warningBody}>{CONTEXT_WARNING}</Text>
      </View>

      <View style={styles.photoGrid}>
        {commonsContextPhotos.map((photo) => (
          <View key={photo.id} testID={`commons-photo-${photo.id}`} style={styles.photoCard}>
            <Pressable
              testID={`commons-photo-open-${photo.id}`}
              accessibilityRole="button"
              accessibilityLabel={`Ampliar ${photo.fileName}. Fotografía de ${photo.author}, Cueva del Agua del río Cuadros, 2014.`}
              accessibilityHint="Abre la imagen completa sin recortar, con atribución, licencia y navegación entre las dos fotos."
              style={styles.photoImageButton}
              onPress={() => setSelectedPhotoId(photo.id)}
            >
              <Image
                accessible={false}
                source={photo.source}
                resizeMode="contain"
                style={styles.photo}
              />
            </Pressable>
            <Text style={styles.photoTitle}>{photo.fileName}</Text>
            <Text style={styles.author}>Autor: {photo.author}</Text>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={`Abrir en Wikimedia Commons: ${photo.fileName}`}
              accessibilityHint="Abre la página de origen de esta fotografía en Wikimedia Commons."
              style={styles.sourceLink}
              onPress={() => void openSource(photo.sourcePageUrl)}
            >
              <Text style={styles.sourceLinkText}>Ver página Commons</Text>
              <Text accessible={false} style={styles.linkArrow}>↗</Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View testID="commons-photo-license-attribution" style={styles.attribution}>
        <Text style={styles.attributionTitle}>Atribución y licencia de ambas fotografías</Text>
        <Text style={styles.attributionBody}>
          Veinticuatro de Jahén · Wikimedia Commons. Originales sin modificaciones ni recortes.
        </Text>
        <Pressable
          accessibilityRole="link"
          accessibilityLabel={`Licencia de las fotografías: ${LICENSE_LABEL}`}
          accessibilityHint="Abre el texto oficial de la licencia Creative Commons."
          style={styles.licenseLink}
          onPress={() => void openSource(CC_BY_SA_4_0_URL)}
        >
          <Text style={styles.licenseLinkText}>Licencia: CC BY-SA 4.0 · Atribución-CompartirIgual 4.0 Internacional</Text>
          <Text accessible={false} style={styles.linkArrow}>↗</Text>
        </Pressable>
      </View>

      <Modal
        testID="commons-photo-viewer-modal"
        visible={selectedPhoto !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedPhotoId(null)}
      >
        <View
          style={styles.viewerBackdrop}
          accessibilityViewIsModal
          importantForAccessibility="yes"
          onAccessibilityEscape={() => setSelectedPhotoId(null)}
        >
          <SafeAreaView style={styles.viewerSafeArea}>
            {selectedPhoto ? (
              <ScrollView
                testID="commons-photo-viewer-content"
                contentContainerStyle={styles.viewerContent}
                showsVerticalScrollIndicator
              >
                <View style={styles.viewerHeader}>
                  <View style={styles.viewerHeading}>
                    <Text accessibilityRole="header" style={styles.viewerTitle}>Fotografía ampliada</Text>
                    <Text style={styles.viewerCounter}>Foto {selectedPhotoIndex + 1} de {photoCount}</Text>
                  </View>
                  <Pressable
                    testID="commons-photo-viewer-close"
                    accessibilityRole="button"
                    accessibilityLabel="Cerrar visor ampliado"
                    accessibilityHint="Cierra la fotografía y vuelve a la galería."
                    style={styles.viewerCloseButton}
                    onPress={() => setSelectedPhotoId(null)}
                  >
                    <Text style={styles.viewerCloseText}>Cerrar</Text>
                  </Pressable>
                </View>

                <Image
                  testID="commons-photo-viewer-image"
                  accessible
                  accessibilityRole="image"
                  accessibilityLabel={`${selectedPhoto.fileName}, de ${selectedPhoto.author}, fotografía de 2014 en la Cueva del Agua del río Cuadros. Imagen completa, sin recorte.`}
                  source={selectedPhoto.source}
                  resizeMode="contain"
                  style={styles.viewerImage}
                />

                <View style={styles.viewerNavigation}>
                  <Pressable
                    testID="commons-photo-viewer-previous"
                    accessibilityRole="button"
                    accessibilityLabel={`Ver foto anterior: ${commonsContextPhotos[(selectedPhotoIndex - 1 + photoCount) % photoCount]?.fileName ?? ''}`}
                    style={styles.viewerNavigationButton}
                    onPress={() => showAdjacentPhoto(-1)}
                  >
                    <Text style={styles.viewerNavigationText}>Foto anterior</Text>
                  </Pressable>
                  <Pressable
                    testID="commons-photo-viewer-next"
                    accessibilityRole="button"
                    accessibilityLabel={`Ver foto siguiente: ${commonsContextPhotos[(selectedPhotoIndex + 1) % photoCount]?.fileName ?? ''}`}
                    style={styles.viewerNavigationButton}
                    onPress={() => showAdjacentPhoto(1)}
                  >
                    <Text style={styles.viewerNavigationText}>Foto siguiente</Text>
                  </Pressable>
                </View>

                <View testID="commons-photo-viewer-attribution" style={styles.viewerAttribution}>
                  <Text style={styles.viewerAttributionTitle}>Atribución completa</Text>
                  <Text style={styles.viewerAttributionBody}>
                    «{selectedPhoto.fileName}», de {selectedPhoto.author}, en Wikimedia Commons. Licencia {LICENSE_LABEL}.
                  </Text>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Página de Wikimedia Commons para ${selectedPhoto.fileName}`}
                    accessibilityHint="Abre la página original de esta fotografía y su ficha de procedencia."
                    style={styles.viewerLink}
                    onPress={() => void openSource(selectedPhoto.sourcePageUrl)}
                  >
                    <Text style={styles.viewerLinkText}>Abrir página de Wikimedia Commons</Text>
                    <Text accessible={false} style={styles.linkArrow}>↗</Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="link"
                    accessibilityLabel={`Abrir licencia ${LICENSE_LABEL}`}
                    accessibilityHint="Abre el texto oficial de la licencia de esta fotografía."
                    style={styles.viewerLink}
                    onPress={() => void openSource(CC_BY_SA_4_0_URL)}
                  >
                    <Text style={styles.viewerLinkText}>Ver licencia CC BY-SA 4.0</Text>
                    <Text accessible={false} style={styles.linkArrow}>↗</Text>
                  </Pressable>
                </View>

                <View testID="commons-photo-viewer-warning" style={styles.viewerWarning}>
                  <Text style={styles.viewerWarningTitle}>Aviso de procedencia</Text>
                  <Text accessibilityLabel={CONTEXT_WARNING} style={styles.viewerWarningBody}>{CONTEXT_WARNING}</Text>
                </View>
              </ScrollView>
            ) : null}
          </SafeAreaView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: spacing[24], marginHorizontal: spacing[16], padding: spacing[12], gap: spacing[12], borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white },
  heading: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[8] },
  headingCopy: { flex: 1 },
  kicker: { color: colors.olive700, fontSize: 9, lineHeight: 14, fontWeight: '900', letterSpacing: 0.8 },
  title: { color: colors.ink, fontSize: typography.body, lineHeight: 21, fontWeight: '900', marginTop: spacing[4] },
  badge: { overflow: 'hidden', color: colors.olive900, backgroundColor: colors.limestone, borderRadius: radius.pill, paddingHorizontal: spacing[8], paddingVertical: spacing[4], fontSize: 9, fontWeight: '900' },
  contextWarning: { gap: spacing[4], borderRadius: radius.md, borderWidth: 1, borderColor: colors.earth, backgroundColor: colors.limestone, padding: spacing[12] },
  warningTitle: { color: colors.olive900, fontSize: 12, lineHeight: 17, fontWeight: '900' },
  warningBody: { color: colors.ink, fontSize: 12, lineHeight: 18 },
  photoGrid: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[8] },
  photoCard: { flex: 1, minWidth: 0, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.warmBackground },
  photoImageButton: { width: '100%', minHeight: 48 },
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.limestone },
  photoTitle: { color: colors.ink, fontSize: 10, lineHeight: 14, fontWeight: '900', marginHorizontal: spacing[8], marginTop: spacing[8] },
  author: { color: colors.ink, fontSize: 10, lineHeight: 15, fontWeight: '700', marginHorizontal: spacing[8], marginTop: spacing[4] },
  sourceLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4], marginHorizontal: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[4] },
  sourceLinkText: { flex: 1, color: colors.olive900, fontSize: 10, lineHeight: 14, fontWeight: '900', textDecorationLine: 'underline' },
  linkArrow: { color: colors.olive700, fontSize: 14, fontWeight: '900' },
  attribution: { gap: spacing[4], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[8] },
  attributionTitle: { color: colors.olive900, fontSize: 11, lineHeight: 16, fontWeight: '900' },
  attributionBody: { color: colors.ink, fontSize: 11, lineHeight: 16 },
  licenseLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  licenseLinkText: { flex: 1, color: colors.olive900, fontSize: 11, lineHeight: 16, fontWeight: '900', textDecorationLine: 'underline' },
  viewerBackdrop: { flex: 1, backgroundColor: colors.ink },
  viewerSafeArea: { flex: 1 },
  viewerContent: { flexGrow: 1, padding: spacing[16], gap: spacing[12] },
  viewerHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[12] },
  viewerHeading: { flex: 1, gap: spacing[4] },
  viewerTitle: { color: colors.white, fontSize: 18, lineHeight: 24, fontWeight: '900' },
  viewerCounter: { color: colors.white, fontSize: 12, lineHeight: 18 },
  viewerCloseButton: { minWidth: 76, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, borderWidth: 1, borderColor: colors.white, paddingHorizontal: spacing[12] },
  viewerCloseText: { color: colors.white, fontSize: 13, lineHeight: 18, fontWeight: '900' },
  viewerImage: { width: '100%', height: 300, backgroundColor: colors.ink },
  viewerNavigation: { flexDirection: 'row', gap: spacing[8] },
  viewerNavigationButton: { flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', borderRadius: radius.md, backgroundColor: colors.olive700, paddingHorizontal: spacing[8] },
  viewerNavigationText: { color: colors.white, fontSize: 12, lineHeight: 18, fontWeight: '900' },
  viewerAttribution: { gap: spacing[4], borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.olive900, padding: spacing[12] },
  viewerAttributionTitle: { color: colors.white, fontSize: 14, lineHeight: 20, fontWeight: '900' },
  viewerAttributionBody: { color: colors.white, fontSize: 12, lineHeight: 18 },
  viewerLink: { minHeight: 48, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8], borderTopWidth: 1, borderTopColor: colors.border },
  viewerLinkText: { flex: 1, color: colors.white, fontSize: 12, lineHeight: 18, fontWeight: '900', textDecorationLine: 'underline' },
  viewerWarning: { gap: spacing[4], borderRadius: radius.md, borderWidth: 1, borderColor: colors.earth, backgroundColor: colors.limestone, padding: spacing[12] },
  viewerWarningTitle: { color: colors.olive900, fontSize: 12, lineHeight: 17, fontWeight: '900' },
  viewerWarningBody: { color: colors.ink, fontSize: 13, lineHeight: 19 },
});
