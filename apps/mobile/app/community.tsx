import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { AdventureLandscape } from '../src/components/visuals/AdventureLandscape';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>PERSONAS · TERRITORIO · EXPERIENCIAS</Text>
          <Text style={styles.title}>Comunidad</Text>
          <Text style={styles.subtitle}>Un espacio para descubrir Mágina a través de las personas que la recorren y la cuidan.</Text>
        </View>

        <View style={styles.segmented}>
          {['Actividad', 'Personas', 'Retos'].map((item, index) => (
            <View key={item} style={[styles.segment, index === 0 && styles.segmentActive]}>
              <Text style={[styles.segmentText, index === 0 && styles.segmentTextActive]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.heroCard}>
          <AdventureLandscape variant="detail" />
          <View style={styles.heroCopy}>
            <View style={styles.communityIcon}>
              <View style={styles.personLeft} />
              <View style={styles.personRight} />
              <View style={styles.peopleBody} />
            </View>
            <Text style={styles.heroEyebrow}>PRÓXIMAMENTE</Text>
            <Text style={styles.heroTitle}>Comparte Mágina</Text>
            <Text style={styles.heroBody}>Publicaciones, fotos, reseñas y avisos útiles aparecerán aquí cuando estén vinculados a personas reales. Hasta entonces no mostramos usuarios ni actividad ficticia.</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>La comunidad servirá para</Text>
        <View style={styles.valuesRow}>
          <ValueCard glyph="□" title="Compartir" body="Fotos y experiencias reales de ruta" />
          <ValueCard glyph="!" title="Avisar" body="Incidencias y cambios útiles en el terreno" />
        </View>
        <View style={styles.valuesRow}>
          <ValueCard glyph="⌖" title="Descubrir" body="Lugares, recorridos y rincones del territorio" />
          <ValueCard glyph="♡" title="Cuidar" body="Buenas prácticas y respeto por Sierra Mágina" />
        </View>

        <View style={styles.noteCard}>
          <View style={styles.noteBadge}><Text style={styles.noteBadgeText}>✓</Text></View>
          <View style={styles.noteCopy}>
            <Text style={styles.noteTitle}>Primero, contenido real</Text>
            <Text style={styles.noteBody}>La actividad social se mostrará solo cuando proceda de cuentas, rutas y publicaciones reales.</Text>
          </View>
        </View>
      </ScrollView>
      <PrimaryTabBar active="Comunidad" />
    </SafeAreaView>
  );
}

function ValueCard({ glyph, title, body }: { glyph: string; title: string; body: string }) {
  return (
    <View style={styles.valueCard}>
      <View style={styles.valueIcon}><Text style={styles.valueGlyph}>{glyph}</Text></View>
      <Text style={styles.valueTitle}>{title}</Text>
      <Text style={styles.valueBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingHorizontal: spacing[20], paddingBottom: 126 },
  heading: { marginTop: spacing[8], marginBottom: spacing[16] },
  eyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  title: { color: colors.ink, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  subtitle: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.oliveWash,
    borderRadius: radius.pill,
    padding: 4,
    marginBottom: spacing[20],
  },
  segment: { flex: 1, minHeight: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.white, ...shadow.card },
  segmentText: { color: colors.olive700, fontSize: 11, fontWeight: '800' },
  segmentTextActive: { color: colors.olive900 },
  heroCard: {
    minHeight: 252,
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.olive900,
    padding: spacing[24],
    justifyContent: 'flex-end',
  },
  heroCopy: { zIndex: 2, alignItems: 'center' },
  communityIcon: { width: 74, height: 64, position: 'relative', marginBottom: spacing[12] },
  personLeft: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.aoveGold, left: 9, top: 2 },
  personRight: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.limestone, right: 9, top: 2 },
  peopleBody: { position: 'absolute', width: 68, height: 30, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 3, borderBottomWidth: 0, borderColor: colors.white, bottom: 0, left: 3 },
  heroEyebrow: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.4 },
  heroTitle: { color: colors.white, fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 3 },
  heroBody: { color: colors.limestone, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: spacing[8], maxWidth: 330 },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900', marginTop: spacing[24] },
  valuesRow: { flexDirection: 'row', gap: spacing[12], marginTop: spacing[12] },
  valueCard: { flex: 1, minHeight: 146, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: spacing[16] },
  valueIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.oliveWash, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[12] },
  valueGlyph: { color: colors.olive900, fontSize: 15, fontWeight: '900' },
  valueTitle: { color: colors.olive900, fontSize: 14, fontWeight: '900' },
  valueBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing[4] },
  noteCard: { flexDirection: 'row', alignItems: 'center', marginTop: spacing[20], borderRadius: radius.lg, backgroundColor: colors.limestone, padding: spacing[16] },
  noteBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center' },
  noteBadgeText: { color: colors.white, fontWeight: '900', fontSize: 17 },
  noteCopy: { flex: 1, marginLeft: spacing[12] },
  noteTitle: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  noteBody: { color: colors.muted, fontSize: 10, lineHeight: 15, marginTop: 2 },
});
