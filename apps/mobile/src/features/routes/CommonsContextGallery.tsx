import { Alert, Image, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { CC_BY_SA_4_0_URL, commonsContextPhotos } from './commons-context-assets';

async function openSource(url: string) {
  try {
    await Linking.openURL(url);
  } catch {
    Alert.alert('Fuente no disponible', 'No se pudo abrir el enlace externo.');
  }
}

export function CommonsContextGallery() {
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
        <Text style={styles.warningBody}>
          Estas imágenes muestran el paraje de la Cueva del Agua del río Cuadros, fotografiado en 2014. No muestran el trazado ni son fotos del sendero fluvial inaugurado recientemente. No son evidencia de checkpoints ni del estado actual.
        </Text>
      </View>

      <View style={styles.photoGrid}>
        {commonsContextPhotos.map((photo) => (
          <View key={photo.id} testID={`commons-photo-${photo.id}`} style={styles.photoCard}>
            <Image
              source={photo.source}
              resizeMode="cover"
              accessible
              accessibilityRole="image"
              accessibilityLabel={photo.accessibilityLabel}
              style={styles.photo}
            />
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
          accessibilityLabel="Licencia de las fotografías: Creative Commons Atribución-CompartirIgual 4.0 Internacional (CC BY-SA 4.0)"
          accessibilityHint="Abre el texto oficial de la licencia Creative Commons."
          style={styles.licenseLink}
          onPress={() => void openSource(CC_BY_SA_4_0_URL)}
        >
          <Text style={styles.licenseLinkText}>Licencia: CC BY-SA 4.0 · Atribución-CompartirIgual 4.0 Internacional</Text>
          <Text accessible={false} style={styles.linkArrow}>↗</Text>
        </Pressable>
      </View>
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
  photo: { width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.limestone },
  photoTitle: { color: colors.ink, fontSize: 10, lineHeight: 14, fontWeight: '900', marginHorizontal: spacing[8], marginTop: spacing[8] },
  author: { color: colors.ink, fontSize: 10, lineHeight: 15, fontWeight: '700', marginHorizontal: spacing[8], marginTop: spacing[4] },
  sourceLink: { minHeight: 40, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[4], marginHorizontal: spacing[8], borderTopWidth: 1, borderTopColor: colors.border, marginTop: spacing[4] },
  sourceLinkText: { flex: 1, color: colors.olive900, fontSize: 10, lineHeight: 14, fontWeight: '900', textDecorationLine: 'underline' },
  linkArrow: { color: colors.olive700, fontSize: 14, fontWeight: '900' },
  attribution: { gap: spacing[4], borderTopWidth: 1, borderTopColor: colors.border, paddingTop: spacing[8] },
  attributionTitle: { color: colors.olive900, fontSize: 11, lineHeight: 16, fontWeight: '900' },
  attributionBody: { color: colors.ink, fontSize: 11, lineHeight: 16 },
  licenseLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing[8] },
  licenseLinkText: { flex: 1, color: colors.olive900, fontSize: 11, lineHeight: 16, fontWeight: '900', textDecorationLine: 'underline' },
});
