import { StatusBar } from 'expo-status-bar';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { PrimaryTabBar } from '../src/components/navigation/PrimaryTabBar';
import { colors, radius, spacing, typography } from '../src/theme/tokens';

export default function CommunityScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />

        <View style={styles.heading}>
          <Text style={styles.eyebrow}>PERSONAS · TERRITORIO · EXPERIENCIAS</Text>
          <Text style={styles.title}>Comunidad</Text>
          <Text style={styles.subtitle}>Un espacio para compartir rutas y descubrimientos cuando el módulo social se incorpore al candidate.</Text>
        </View>

        <View style={styles.segmented}>
          {['Actividad', 'Personas', 'Retos'].map((item, index) => (
            <View key={item} style={[styles.segment, index === 0 && styles.segmentActive]}>
              <Text style={[styles.segmentText, index === 0 && styles.segmentTextActive]}>{item}</Text>
            </View>
          ))}
        </View>

        <View style={styles.heroCard}>
          <View style={styles.communityIcon}>
            <View style={styles.personLeft} />
            <View style={styles.personRight} />
            <View style={styles.peopleBody} />
          </View>
          <Text style={styles.heroTitle}>Comunidad sin contenido ficticio</Text>
          <Text style={styles.heroBody}>Esta pantalla ya forma parte de la navegación real. Mostrará publicaciones, fotos, reseñas e incidencias cuando conectemos la capa social existente, sin rellenarla con usuarios o estadísticas inventadas.</Text>
        </View>

        <View style={styles.valuesRow}>
          <ValueCard title="Comparte" body="Fotos y experiencias de ruta" />
          <ValueCard title="Ayuda" body="Avisos útiles para otros senderistas" />
        </View>
        <View style={styles.valuesRow}>
          <ValueCard title="Descubre" body="Lugares y recorridos del territorio" />
          <ValueCard title="Cuida" body="Respeto por senderos y comunidades" />
        </View>
      </ScrollView>
      <PrimaryTabBar active="Comunidad" />
    </SafeAreaView>
  );
}

function ValueCard({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.valueCard}>
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
  segmented: { flexDirection: 'row', backgroundColor: colors.oliveWash, borderRadius: radius.pill, padding: 4, marginBottom: spacing[20] },
  segment: { flex: 1, minHeight: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  segmentActive: { backgroundColor: colors.white },
  segmentText: { color: colors.olive700, fontSize: 11, fontWeight: '800' },
  segmentTextActive: { color: colors.olive900 },
  heroCard: { borderRadius: radius.xl, backgroundColor: colors.olive900, padding: spacing[24], alignItems: 'center' },
  communityIcon: { width: 74, height: 64, position: 'relative', marginBottom: spacing[16] },
  personLeft: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.aoveGold, left: 9, top: 2 },
  personRight: { position: 'absolute', width: 20, height: 20, borderRadius: 10, borderWidth: 3, borderColor: colors.limestone, right: 9, top: 2 },
  peopleBody: { position: 'absolute', width: 68, height: 30, borderTopLeftRadius: 34, borderTopRightRadius: 34, borderWidth: 3, borderBottomWidth: 0, borderColor: colors.white, bottom: 0, left: 3 },
  heroTitle: { color: colors.white, fontSize: 20, fontWeight: '900', textAlign: 'center' },
  heroBody: { color: colors.limestone, fontSize: 12, lineHeight: 19, textAlign: 'center', marginTop: spacing[8] },
  valuesRow: { flexDirection: 'row', gap: spacing[12], marginTop: spacing[12] },
  valueCard: { flex: 1, minHeight: 112, borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: spacing[16] },
  valueTitle: { color: colors.olive900, fontSize: 14, fontWeight: '900' },
  valueBody: { color: colors.muted, fontSize: 11, lineHeight: 16, marginTop: spacing[4] },
});
