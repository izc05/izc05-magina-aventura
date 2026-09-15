import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  difficultyLabel,
  durationLabel,
  getDevelopmentRouteBySlug,
} from '../../src/features/routes/route-utils';
import { RouteMap } from '../../src/map/RouteMap';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

export default function RouteDetailScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);

  const configuredStyle = process.env.EXPO_PUBLIC_MAP_STYLE_URL;
  const baseMapStyle = configuredStyle ?? (__DEV__ ? 'https://demotiles.maplibre.org/style.json' : null);

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
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.sun} />
          <View style={styles.mountainBack} />
          <View style={styles.mountainFront} />
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          {route.developmentFixture ? (
            <View style={styles.devBadge}>
              <Text style={styles.devBadgeText}>DATOS DE DESARROLLO</Text>
            </View>
          ) : null}
          <View style={styles.heroCopy}>
            <Text style={styles.municipality}>{route.municipalityName.toUpperCase()}</Text>
            <Text style={styles.title}>{route.title}</Text>
            <Text style={styles.difficulty}>{difficultyLabel(route.difficulty)}</Text>
          </View>
        </View>

        <View style={styles.statsCard}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{route.distanceKm.toFixed(1)} km</Text>
            <Text style={styles.statLabel}>Distancia</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>+{route.elevationGainM} m</Text>
            <Text style={styles.statLabel}>Desnivel</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statValue}>{durationLabel(route.durationMinutes)}</Text>
            <Text style={styles.statLabel}>Duración</Text>
          </View>
        </View>

        {baseMapStyle ? (
          <RouteMap
            payload={null}
            mapStyle={baseMapStyle}
            developmentMode={route.developmentFixture}
          />
        ) : (
          <View style={styles.mapUnavailable}>
            <Text style={styles.mapUnavailableTitle}>Mapa no configurado</Text>
            <Text style={styles.mapUnavailableBody}>
              Configura EXPO_PUBLIC_MAP_STYLE_URL para habilitar el mapa en producción.
            </Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Tu aventura</Text>
        <Text style={styles.body}>{route.description}</Text>

        <View style={styles.rewardCard}>
          <Text style={styles.rewardEyebrow}>RECOMPENSAS DE ESTA AVENTURA</Text>
          <Text style={styles.rewardTitle}>
            Hasta {route.rewardPreview.xp} XP · {route.rewardPreview.olives} 🫒
          </Text>
          <Text style={styles.rewardBody}>
            {route.rewardPreview.discoveries} descubrimientos disponibles en la ruta.
          </Text>
        </View>

        <View style={styles.safetyCard}>
          <Text style={styles.safetyTitle}>Seguridad</Text>
          {route.safetyNotes.map((note) => (
            <Text key={note} style={styles.safetyNote}>• {note}</Text>
          ))}
        </View>

        <View style={styles.infoGrid}>
          {[
            ['◫', 'Track oficial', 'GPX versionado'],
            ['◇', 'Offline', route.offlineAvailable ? 'Disponible' : 'No disponible'],
            ['◎', 'Checkpoints', 'Validación por proximidad'],
            ['!', 'Seguridad', 'Revisar antes de salir'],
          ].map(([icon, heading, copy]) => (
            <View key={heading} style={styles.infoCard}>
              <Text style={styles.infoIcon}>{icon}</Text>
              <Text style={styles.infoTitle}>{heading}</Text>
              <Text style={styles.infoCopy}>{copy}</Text>
            </View>
          ))}
        </View>

        <Pressable
          style={styles.primaryButton}
          onPress={() =>
            router.push({
              pathname: '/routes/[slug]/prepare',
              params: { slug: route.slug },
            })
          }
        >
          <Text style={styles.primaryButtonText}>Preparar aventura</Text>
          <Text style={styles.primaryButtonArrow}>→</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[40] },
  hero: { height: 330, overflow: 'hidden', backgroundColor: colors.olive900, padding: spacing[20], justifyContent: 'flex-end' },
  sun: { position: 'absolute', width: 120, height: 120, borderRadius: 60, backgroundColor: colors.aoveGold, right: 28, top: 42, opacity: 0.92 },
  mountainBack: { position: 'absolute', width: 360, height: 180, borderRadius: 50, backgroundColor: colors.olive700, right: -120, bottom: -65, transform: [{ rotate: '18deg' }] },
  mountainFront: { position: 'absolute', width: 320, height: 150, borderRadius: 50, backgroundColor: colors.olive500, left: -100, bottom: -80, transform: [{ rotate: '-12deg' }] },
  backButton: { position: 'absolute', top: spacing[16], left: spacing[16], width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  devBadge: { position: 'absolute', top: spacing[20], right: spacing[16], borderRadius: radius.pill, backgroundColor: colors.ink, paddingHorizontal: spacing[12], paddingVertical: spacing[8] },
  devBadgeText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  heroCopy: { maxWidth: 320 },
  municipality: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.white, fontSize: typography.display, fontWeight: '900', marginTop: spacing[4] },
  difficulty: { color: colors.limestone, fontSize: 14, fontWeight: '700', marginTop: spacing[8] },
  statsCard: { marginHorizontal: spacing[20], marginTop: -24, padding: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, flexDirection: 'row', alignItems: 'center', ...shadow.card },
  stat: { flex: 1 },
  statValue: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  statLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
  divider: { width: 1, height: 36, backgroundColor: colors.border, marginHorizontal: spacing[8] },
  mapUnavailable: { margin: spacing[20], padding: spacing[20], borderRadius: radius.lg, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  mapUnavailableTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  mapUnavailableBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900', marginHorizontal: spacing[20] },
  body: { color: colors.muted, fontSize: 14, lineHeight: 21, marginHorizontal: spacing[20], marginTop: spacing[8] },
  rewardCard: { margin: spacing[20], borderRadius: radius.lg, padding: spacing[20], backgroundColor: colors.olive900 },
  rewardEyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  rewardTitle: { color: colors.white, fontSize: 20, fontWeight: '900', marginTop: spacing[8] },
  rewardBody: { color: colors.limestone, fontSize: 13, marginTop: spacing[8] },
  safetyCard: { marginHorizontal: spacing[20], marginBottom: spacing[20], borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  safetyTitle: { color: colors.ink, fontSize: 15, fontWeight: '900' },
  safetyNote: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[8] },
  infoGrid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: spacing[16], gap: spacing[8] },
  infoCard: { width: '48%', borderRadius: radius.md, padding: spacing[16], backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  infoIcon: { color: colors.olive700, fontSize: 20, fontWeight: '900' },
  infoTitle: { color: colors.ink, fontSize: 14, fontWeight: '900', marginTop: spacing[8] },
  infoCopy: { color: colors.muted, fontSize: 11, marginTop: spacing[4] },
  primaryButton: { marginHorizontal: spacing[20], marginTop: spacing[24], minHeight: 58, borderRadius: radius.md, paddingHorizontal: spacing[20], backgroundColor: colors.olive900, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  primaryButtonText: { color: colors.white, fontSize: 16, fontWeight: '900' },
  primaryButtonArrow: { color: colors.aoveGold, fontSize: 22, fontWeight: '900' },
  notFound: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  notFoundTitle: { color: colors.ink, fontSize: typography.title, fontWeight: '900' },
  notFoundBody: { color: colors.muted, fontSize: 14, textAlign: 'center', marginTop: spacing[8] },
  secondaryButton: { marginTop: spacing[20], borderRadius: radius.md, borderWidth: 1, borderColor: colors.olive900, paddingHorizontal: spacing[20], paddingVertical: spacing[12] },
  secondaryButtonText: { color: colors.olive900, fontWeight: '800' },
});
