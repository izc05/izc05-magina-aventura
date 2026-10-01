import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { adelfalDeCuadrosInformation as route } from '../../src/features/routes/adelfal-de-cuadros-information';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

export default function AdelfalDeCuadrosOfficialRouteScreen() {
  const router = useRouter();

  async function openSource() {
    try {
      await Linking.openURL(route.officialSource.url);
    } catch {
      Alert.alert('Fuente no disponible', 'No se pudo abrir la ficha oficial de la Junta.');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al catálogo público de rutas"
            accessibilityHint="Regresa al catálogo público de Sierra Mágina."
            style={styles.backButton}
            onPress={() => router.replace('/routes')}
          >
            <Text accessible={false} style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>{route.pilotLabel}</Text>
            <Text accessibilityRole="header" style={styles.title}>{route.title}</Text>
            <Text style={styles.location}>{route.municipality}</Text>
          </View>
        </View>

        <View testID="adelfal-official-facts" style={styles.factsCard}>
          <Text style={styles.sectionKicker}>DATOS DE LA FICHA OFICIAL</Text>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Trazado</Text>
            <Text style={styles.factValue}>{route.facts.routeType}</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Distancia de ida</Text>
            <Text style={styles.factValue}>{route.facts.outwardDistanceMeters} m</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Duración</Text>
            <Text style={styles.factValue}>{route.facts.durationMinutes} min</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Dificultad</Text>
            <Text style={styles.factValue}>{route.facts.difficulty}</Text>
          </View>
          <View style={styles.factRow}>
            <Text style={styles.factLabel}>Tipo de camino</Text>
            <Text style={styles.factValue}>{route.facts.pathType}</Text>
          </View>
          <View style={[styles.factRow, styles.lastFactRow]}>
            <Text style={styles.factLabel}>Sombra</Text>
            <Text style={styles.factValue}>{route.facts.shade}</Text>
          </View>
        </View>

        <View testID="adelfal-dated-status" style={styles.statusCard}>
          <Text style={styles.sectionKicker}>AVISO PUBLICADO POR LA JUNTA · {route.noticeDate}</Text>
          <Text accessibilityRole="header" style={styles.statusTitle}>{route.publishedStatus}</Text>
          <Text style={styles.statusContext}>{route.statusContext}</Text>
          <Text style={styles.operationalNotice}>{route.operationalNotice}</Text>
        </View>

        <View testID="adelfal-source-card" style={styles.sourceCard}>
          <Text style={styles.sectionKicker}>PROCEDENCIA</Text>
          <Text style={styles.sourceLabel}>{route.officialSource.label}</Text>
          <Text style={styles.sourceNote}>
            La ficha y sus datos se atribuyen a la Junta de Andalucía; el estado indicado conserva la fecha del aviso.
          </Text>
          <Pressable
            testID="adelfal-source-link"
            accessibilityRole="link"
            accessibilityLabel="Abrir ficha oficial de Adelfal de Cuadros en la Junta de Andalucía"
            accessibilityHint="Abre la ficha original de Ventana del Visitante en el navegador del dispositivo."
            style={styles.sourceButton}
            onPress={() => void openSource()}
          >
            <Text style={styles.sourceButtonText}>Abrir ficha oficial de la Junta</Text>
            <Text accessible={false} style={styles.sourceArrow}>↗</Text>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: spacing[20], paddingTop: spacing[12], paddingBottom: spacing[32] },
  header: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing[12] },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  headerCopy: { flex: 1, paddingTop: spacing[4] },
  eyebrow: { color: colors.olive700, fontSize: 10, lineHeight: 15, fontWeight: '900', letterSpacing: 0.7 },
  title: { color: colors.ink, fontSize: typography.title, lineHeight: 30, fontWeight: '900', marginTop: spacing[4] },
  location: { color: colors.muted, fontSize: 13, lineHeight: 19, fontWeight: '700', marginTop: spacing[4] },
  factsCard: {
    marginTop: spacing[24],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[20],
  },
  sectionKicker: { color: colors.olive700, fontSize: 10, lineHeight: 15, fontWeight: '900', letterSpacing: 0.8 },
  factRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[12],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  lastFactRow: { borderBottomWidth: 0 },
  factLabel: { color: colors.muted, fontSize: 13, lineHeight: 19 },
  factValue: { color: colors.ink, fontSize: 14, lineHeight: 20, fontWeight: '900', textAlign: 'right' },
  statusCard: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.earth,
    backgroundColor: colors.limestone,
    padding: spacing[20],
  },
  statusTitle: { color: colors.olive900, fontSize: 14, lineHeight: 21, fontWeight: '900', marginTop: spacing[8] },
  statusContext: { color: colors.ink, fontSize: 13, lineHeight: 20, marginTop: spacing[8] },
  operationalNotice: { color: colors.ink, fontSize: 13, lineHeight: 20, fontWeight: '800', marginTop: spacing[12] },
  sourceCard: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing[20],
  },
  sourceLabel: { color: colors.ink, fontSize: 15, lineHeight: 22, fontWeight: '900', marginTop: spacing[8] },
  sourceNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  sourceButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[16],
  },
  sourceButtonText: { color: colors.white, fontSize: 13, lineHeight: 19, fontWeight: '900' },
  sourceArrow: { color: colors.white, fontSize: 17, fontWeight: '900' },
});
