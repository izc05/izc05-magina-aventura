import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { colors, radius, spacing, typography } from '../../../src/theme/tokens';

const readinessRows = [
  ['Ubicación', 'Pendiente'],
  ['GPS en segundo plano', 'Pendiente'],
  ['Ruta offline', 'No disponible'],
  ['Seguridad', 'Revisar'],
] as const;

export default function PrepareRouteAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <Text style={styles.notFoundTitle}>Ruta no disponible</Text>
          <Text style={styles.notFoundBody}>No encontramos esta versión de la ruta.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
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
        <Text style={styles.routeName}>{route.title} · {route.municipalityName}</Text>

        <View style={styles.notice}>
          <Text style={styles.noticeTitle}>Comprobaciones previas</Text>
          <Text style={styles.noticeBody}>
            Este flujo quedará conectado al motor GPS, permisos del sistema y paquete offline en las siguientes fases.
          </Text>
        </View>

        <View style={styles.readinessCard}>
          {readinessRows.map(([label, state], index) => (
            <View
              key={label}
              style={[
                styles.readinessRow,
                index < readinessRows.length - 1 && styles.readinessDivider,
              ]}
            >
              <Text style={styles.readinessLabel}>{label}</Text>
              <Text style={styles.readinessState}>{state}</Text>
            </View>
          ))}
        </View>

        <View style={styles.offlineCard}>
          <Text style={styles.offlineEyebrow}>PAQUETE DE RUTA</Text>
          <Text style={styles.offlineTitle}>Datos listos para evolucionar a offline real</Text>
          <Text style={styles.offlineBody}>
            La versión final descargará geometría oficial, checkpoints, descubrimientos necesarios, seguridad y cartografía del corredor antes de iniciar la actividad.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          style={styles.startButton}
          onPress={() =>
            router.push({
              pathname: '/adventure/[slug]',
              params: { slug: route.slug },
            })
          }
        >
          <Text style={styles.startButtonText}>Continuar en modo desarrollo</Text>
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
  readinessCard: { marginTop: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  readinessRow: { minHeight: 60, paddingHorizontal: spacing[16], flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  readinessDivider: { borderBottomWidth: 1, borderBottomColor: colors.border },
  readinessLabel: { color: colors.ink, fontSize: 14, fontWeight: '800' },
  readinessState: { color: colors.olive700, fontSize: 12, fontWeight: '900' },
  offlineCard: { marginTop: spacing[24], borderRadius: radius.lg, backgroundColor: colors.olive900, padding: spacing[20] },
  offlineEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  offlineTitle: { color: colors.white, fontSize: 19, fontWeight: '900', marginTop: spacing[8] },
  offlineBody: { color: colors.limestone, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  footer: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing[20], backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border },
  startButton: { minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing[20], backgroundColor: colors.olive900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  startButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  startArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  notFoundBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
