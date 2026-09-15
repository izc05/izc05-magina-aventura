import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDevelopmentRouteBySlug } from '../../src/features/routes/route-utils';
import { colors, radius, spacing, typography } from '../../src/theme/tokens';

const preparationItems = [
  ['◎', 'Ubicación', 'Se solicitará acceso preciso y en segundo plano.'],
  ['↓', 'Ruta offline', 'Track, checkpoints y datos esenciales antes de salir.'],
  ['▰', 'Batería', 'Recomendaremos carga suficiente para toda la actividad.'],
  ['!', 'Seguridad', 'La navegación digital no sustituye la preparación de montaña.'],
] as const;

export default function PrepareAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return null;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content}>
        <Pressable style={styles.backButton} onPress={() => router.back()}>
          <Text style={styles.backText}>←</Text>
        </Pressable>

        <Text style={styles.eyebrow}>ANTES DE SALIR</Text>
        <Text style={styles.title}>Prepara tu aventura</Text>
        <Text style={styles.routeName}>{route.title} · {route.municipality}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Modo de desarrollo</Text>
          <Text style={styles.noticeBody}>
            Esta pantalla define el flujo final. Los permisos GPS, descarga offline y validaciones reales entrarán con el motor de actividad.
          </Text>
        </View>

        <View style={styles.list}>
          {preparationItems.map(([icon, heading, copy]) => (
            <View key={heading} style={styles.item}>
              <View style={styles.iconBox}><Text style={styles.icon}>{icon}</Text></View>
              <View style={styles.itemCopy}>
                <Text style={styles.itemTitle}>{heading}</Text>
                <Text style={styles.itemBody}>{copy}</Text>
              </View>
              <Text style={styles.pending}>○</Text>
            </View>
          ))}
        </View>

        <View style={styles.offlineCard}>
          <Text style={styles.offlineEyebrow}>PAQUETE DE RUTA</Text>
          <Text style={styles.offlineTitle}>Preparado para funcionar sin cobertura</Text>
          <Text style={styles.offlineBody}>
            La versión final descargará geometría oficial, checkpoints, descubrimientos necesarios, seguridad y cartografía del corredor.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.startButton}
          onPress={() => router.push({ pathname: '/adventure/[slug]', params: { slug: route.slug } })}
        >
          <Text style={styles.startButtonText}>Iniciar aventura simulada</Text>
          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: 120 },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center', marginBottom: spacing[24] },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  eyebrow: { color: colors.olive700, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  routeName: { color: colors.muted, fontSize: 14, marginTop: spacing[8] },
  notice: { marginTop: spacing[24], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.limestone },
  noticeTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  noticeBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  list: { marginTop: spacing[20], gap: spacing[12] },
  item: { minHeight: 88, borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', alignItems: 'center', padding: spacing[16] },
  iconBox: { width: 46, height: 46, borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center', marginRight: spacing[12] },
  icon: { color: colors.aoveGold, fontSize: 20, fontWeight: '900' },
  itemCopy: { flex: 1 },
  itemTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  itemBody: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing[4] },
  pending: { color: colors.olive700, fontSize: 20, marginLeft: spacing[8] },
  offlineCard: { marginTop: spacing[24], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  offlineEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  offlineTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: spacing[8] },
  offlineBody: { color: colors.limestone, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[20], backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  startButton: { minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing[20], backgroundColor: colors.olive900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  startArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
});
