import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  getMunicipalRouteInformationBySlug,
  municipalRouteInformationViewModel,
} from '../../src/features/routes/municipal-route-information';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

export default function MunicipalRouteInformationScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getMunicipalRouteInformationBySlug(slug);
  const information = route ? municipalRouteInformationViewModel() : null;

  if (!route || !information) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.title}>Información no disponible</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const sourceUrl = information.sourceUrl;

  async function openMunicipalNotice() {
    try {
      await Linking.openURL(sourceUrl);
    } catch {
      Alert.alert('Aviso no disponible', 'No se pudo abrir la publicación municipal.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Volver"
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.eyebrow}>FICHA INFORMATIVA · BEDMAR Y GARCÍEZ</Text>
        <Text style={styles.title}>{information.title}</Text>
        <Text style={styles.location}>{information.municipality}</Text>

        <View style={styles.statusCard}>
          <Text style={styles.cardEyebrow}>{information.statusLabel.toUpperCase()}</Text>
          <Text style={styles.body}>{information.statusDetail}</Text>
        </View>

        <View style={styles.noticeCard}>
          <Text style={styles.noticeTitle}>Ruta en preparación para GPS</Text>
          <Text style={styles.noticeBody}>{information.gpsNotice}</Text>
          <Text style={styles.noticeFootnote}>{information.nonNavigationNotice}</Text>
        </View>

        <View style={styles.factsCard}>
          <Text style={styles.sectionTitle}>Información publicada</Text>
          <Text style={styles.body}>{information.endpoints[0]}</Text>
          <Text style={styles.endpointSeparator}>↕</Text>
          <Text style={styles.body}>{information.endpoints[1]}</Text>
          <Text style={styles.directionNote}>{information.directionNote}</Text>
        </View>

        <Pressable
          accessibilityRole="button"
          style={styles.sourceButton}
          onPress={() => void openMunicipalNotice()}
        >
          <View style={styles.sourceCopy}>
            <Text style={styles.sourceEyebrow}>FUENTE PRIMARIA</Text>
            <Text style={styles.sourceTitle}>{information.sourceLabel}</Text>
            <Text style={styles.sourceBody}>Abrir publicación oficial del Ayuntamiento</Text>
          </View>
          <Text style={styles.sourceArrow}>↗</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: spacing[32] },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[24],
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  eyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.2 },
  title: {
    color: colors.ink,
    fontSize: typography.display,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  location: { color: colors.muted, fontSize: 13, marginTop: spacing[8] },
  statusCard: {
    marginTop: spacing[24],
    borderRadius: radius.lg,
    padding: spacing[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardEyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  body: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: spacing[8] },
  noticeCard: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    padding: spacing[20],
    backgroundColor: colors.olive900,
  },
  noticeTitle: { color: colors.white, fontSize: 17, fontWeight: '900' },
  noticeBody: { color: colors.aoveGold, fontSize: 14, lineHeight: 20, fontWeight: '900', marginTop: spacing[8] },
  noticeFootnote: { color: colors.limestone, fontSize: 12, lineHeight: 18, marginTop: spacing[12] },
  factsCard: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    padding: spacing[20],
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sectionTitle: { color: colors.ink, fontSize: 16, fontWeight: '900' },
  endpointSeparator: { color: colors.olive700, fontSize: 18, fontWeight: '900', marginTop: spacing[4] },
  directionNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[12] },
  sourceButton: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    padding: spacing[20],
    backgroundColor: colors.limestone,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
  },
  sourceCopy: { flex: 1 },
  sourceEyebrow: { color: colors.olive700, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  sourceTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: spacing[4] },
  sourceBody: { color: colors.muted, fontSize: 11, marginTop: spacing[4] },
  sourceArrow: { color: colors.olive900, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], justifyContent: 'center', alignItems: 'center' },
  secondaryButton: {
    marginTop: spacing[20],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
  },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
