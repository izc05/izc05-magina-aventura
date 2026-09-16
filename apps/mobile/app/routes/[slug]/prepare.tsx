import { evaluateOfflinePackage } from '@magina-aventura/offline-sync';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BrandMark } from '../../../src/components/branding/BrandMark';
import { developmentRouteMapRepository } from '../../../src/features/routes/development-route-map-repository';
import {
  presentPreparation,
  type PrepareOfflineState,
  type ReadinessTone,
} from '../../../src/features/routes/prepare-presenter';
import { durationLabel, getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import { expoRoutePackagePort } from '../../../src/offline/expo-route-package-port';
import { colors, radius, shadow, spacing, typography } from '../../../src/theme/tokens';

export default function PrepareRouteAdventureScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeSlug = route?.slug ?? '';
  const [offlineState, setOfflineState] = useState<PrepareOfflineState>('unavailable');

  useEffect(() => {
    if (!routeSlug) return;

    let active = true;

    async function loadOfflineState() {
      try {
        const manifest = await developmentRouteMapRepository.getOfflineManifest(routeSlug);

        if (!active) return;

        if (!manifest) {
          setOfflineState('unavailable');
          return;
        }

        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);

        if (active) {
          setOfflineState(evaluateOfflinePackage(installed, manifest));
        }
      } catch {
        if (active) setOfflineState('error');
      }
    }

    void loadOfflineState();

    return () => {
      active = false;
    };
  }, [routeSlug]);

  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.notFound}>
          <BrandMark size={74} framed inverse />
          <Text style={styles.notFoundTitle}>Ruta no disponible</Text>
          <Text style={styles.notFoundBody}>No encontramos esta versión de la ruta.</Text>
          <Pressable style={styles.secondaryButton} onPress={() => router.replace('/')}>
            <Text style={styles.secondaryButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const presentation = presentPreparation(offlineState);
  const offlineReady = offlineState === 'ready';

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="light" />

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.hero}>
          <View style={styles.heroGlow} />
          <View style={styles.heroSun} />
          <View style={styles.mountainBack} />
          <View style={styles.mountainFront} />
          <View style={styles.heroPath} />

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver"
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <Text style={styles.backText}>‹</Text>
          </Pressable>

          <View style={styles.heroMark}>
            <BrandMark size={52} inverse />
          </View>

          <View style={styles.heroCopy}>
            <Text style={styles.eyebrow}>ANTES DE SALIR</Text>
            <Text style={styles.title}>Prepara tu aventura</Text>
            <Text style={styles.routeName}>{route.title}</Text>
            <Text style={styles.routePlace}>{route.municipalityName}</Text>
          </View>
        </View>

        <View style={styles.routeSummary}>
          <SummaryMetric value={`${route.distanceKm.toFixed(1).replace('.', ',')} km`} label="Distancia" />
          <View style={styles.summaryDivider} />
          <SummaryMetric value={`+${route.elevationGainM} m`} label="Desnivel" />
          <View style={styles.summaryDivider} />
          <SummaryMetric value={durationLabel(route.durationMinutes)} label="Duración" />
        </View>

        <View style={styles.sectionIntro}>
          <Text style={styles.sectionEyebrow}>LISTO PARA CAMINAR</Text>
          <Text style={styles.sectionTitle}>Comprobaciones previas</Text>
          <Text style={styles.sectionBody}>
            Comprueba lo importante antes de iniciar. La app muestra únicamente el estado que puede verificar ahora mismo.
          </Text>
        </View>

        <View style={styles.readinessCard}>
          {presentation.checks.map((check, index) => (
            <View
              key={check.id}
              style={[
                styles.readinessRow,
                index < presentation.checks.length - 1 && styles.readinessDivider,
              ]}
            >
              <View style={styles.readinessLeft}>
                <StatusDot tone={check.tone} />
                <Text style={styles.readinessLabel}>{check.label}</Text>
              </View>
              <View style={[styles.statePill, statePillStyle(check.tone)]}>
                <Text style={[styles.readinessState, stateTextStyle(check.tone)]}>{check.state}</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.offlineCard}>
          <View style={styles.offlineAccent} />
          <View style={styles.offlineHeader}>
            <View style={styles.offlineIcon}>
              <View style={styles.downloadArrowStem} />
              <View style={styles.downloadArrowHead} />
              <View style={styles.downloadBase} />
            </View>
            <View style={styles.offlineHeaderCopy}>
              <Text style={styles.offlineEyebrow}>PAQUETE DE RUTA</Text>
              <Text style={styles.offlineTitle}>{presentation.routePackage}</Text>
            </View>
          </View>
          <Text style={styles.offlineBody}>
            {offlineReady
              ? 'La cartografía instalada coincide con la geometría y el contenido publicados para esta ruta.'
              : offlineState === 'unavailable'
                ? 'Esta ruta todavía no tiene un paquete cartográfico verificado asociado.'
                : 'Vuelve a la ficha de la ruta para descargar o actualizar el paquete antes de salir.'}
          </Text>
        </View>

        <View style={styles.safetyNotice}>
          <View style={styles.safetyIcon}>
            <Text style={styles.safetyIconText}>!</Text>
          </View>
          <View style={styles.safetyCopy}>
            <Text style={styles.safetyTitle}>Antes de empezar</Text>
            <Text style={styles.safetyBody}>
              Revisa batería, agua, calzado y las indicaciones de seguridad de la ruta. En montaña, la app acompaña; no sustituye tu criterio.
            </Text>
          </View>
        </View>

        <View style={styles.developmentNotice}>
          <Text style={styles.developmentEyebrow}>PRUEBA ACTUAL</Text>
          <Text style={styles.developmentBody}>
            El GPS real y el seguimiento en segundo plano se incorporan desde la rama específica del motor de actividad. Esta pantalla no los marca como disponibles antes de integrarlos.
          </Text>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [styles.startButton, pressed && styles.startButtonPressed]}
          onPress={() =>
            router.push({
              pathname: '/adventure/[slug]',
              params: { slug: route.slug },
            })
          }
        >
          <View>
            <Text style={styles.startButtonText}>Abrir aventura de prueba</Text>
            <Text style={styles.startButtonCaption}>Modo desarrollo</Text>
          </View>
          <Text style={styles.startArrow}>→</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

function SummaryMetric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.summaryMetric}>
      <Text style={styles.summaryValue}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StatusDot({ tone }: { tone: ReadinessTone }) {
  return <View style={[styles.statusDot, statusDotStyle(tone)]} />;
}

function statusDotStyle(tone: ReadinessTone) {
  if (tone === 'ready') return styles.statusDotReady;
  if (tone === 'review') return styles.statusDotReview;
  return styles.statusDotPending;
}

function statePillStyle(tone: ReadinessTone) {
  if (tone === 'ready') return styles.statePillReady;
  if (tone === 'review') return styles.statePillReview;
  return styles.statePillPending;
}

function stateTextStyle(tone: ReadinessTone) {
  if (tone === 'ready') return styles.stateTextReady;
  if (tone === 'review') return styles.stateTextReview;
  return styles.stateTextPending;
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    paddingBottom: 132,
  },
  hero: {
    height: 310,
    overflow: 'hidden',
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[28],
    justifyContent: 'flex-end',
  },
  heroGlow: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: colors.olive700,
    opacity: 0.35,
    right: -110,
    top: -100,
  },
  heroSun: {
    position: 'absolute',
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: colors.aoveGold,
    right: 42,
    top: 54,
    opacity: 0.9,
  },
  mountainBack: {
    position: 'absolute',
    width: 300,
    height: 140,
    borderRadius: 60,
    backgroundColor: colors.olive700,
    right: -105,
    bottom: -20,
    transform: [{ rotate: '-17deg' }],
  },
  mountainFront: {
    position: 'absolute',
    width: 310,
    height: 130,
    borderRadius: 58,
    backgroundColor: colors.olive500,
    left: -125,
    bottom: -50,
    transform: [{ rotate: '14deg' }],
    opacity: 0.78,
  },
  heroPath: {
    position: 'absolute',
    width: 52,
    height: 155,
    borderRadius: 30,
    backgroundColor: colors.limestone,
    opacity: 0.85,
    right: '35%',
    bottom: -92,
    transform: [{ rotate: '18deg' }],
  },
  backButton: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[16],
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(250,249,246,0.94)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: {
    color: colors.olive900,
    fontSize: 32,
    lineHeight: 32,
    fontWeight: '500',
    marginTop: -2,
  },
  heroMark: {
    position: 'absolute',
    top: spacing[16],
    right: spacing[20],
  },
  heroCopy: {
    maxWidth: 330,
  },
  eyebrow: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.7,
  },
  title: {
    color: colors.white,
    fontSize: typography.display,
    lineHeight: 36,
    fontWeight: '900',
    marginTop: spacing[4],
    letterSpacing: -0.7,
  },
  routeName: {
    color: colors.limestone,
    fontSize: 16,
    fontWeight: '800',
    marginTop: spacing[12],
  },
  routePlace: {
    color: colors.limestone,
    fontSize: 12,
    marginTop: 2,
    opacity: 0.85,
  },
  routeSummary: {
    marginHorizontal: spacing[20],
    marginTop: -26,
    minHeight: 84,
    borderRadius: radius.lg,
    paddingHorizontal: spacing[16],
    backgroundColor: colors.white,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.card,
  },
  summaryMetric: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  summaryLabel: {
    color: colors.muted,
    fontSize: 9,
    marginTop: 4,
  },
  summaryDivider: {
    width: 1,
    height: 34,
    backgroundColor: colors.border,
  },
  sectionIntro: {
    paddingHorizontal: spacing[20],
    paddingTop: spacing[32],
  },
  sectionEyebrow: {
    color: colors.olive700,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.4,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
    marginTop: 3,
  },
  sectionBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing[8],
  },
  readinessCard: {
    marginHorizontal: spacing[20],
    marginTop: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
    ...shadow.card,
  },
  readinessRow: {
    minHeight: 64,
    paddingHorizontal: spacing[16],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  readinessDivider: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  readinessLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing[12],
  },
  statusDotReady: {
    backgroundColor: colors.olive700,
  },
  statusDotPending: {
    backgroundColor: '#B5AA98',
  },
  statusDotReview: {
    backgroundColor: colors.aoveGold,
  },
  readinessLabel: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  statePill: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[10],
    paddingVertical: 6,
  },
  statePillReady: {
    backgroundColor: colors.oliveWash,
  },
  statePillPending: {
    backgroundColor: colors.limestone,
  },
  statePillReview: {
    backgroundColor: colors.goldWash,
  },
  readinessState: {
    fontSize: 10,
    fontWeight: '900',
  },
  stateTextReady: {
    color: colors.olive900,
  },
  stateTextPending: {
    color: colors.earth,
  },
  stateTextReview: {
    color: colors.earth,
  },
  offlineCard: {
    marginHorizontal: spacing[20],
    marginTop: spacing[20],
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    padding: spacing[20],
    overflow: 'hidden',
  },
  offlineAccent: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: colors.olive700,
    opacity: 0.32,
    right: -40,
    bottom: -55,
  },
  offlineHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  offlineIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(250,249,246,0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  downloadArrowStem: {
    width: 3,
    height: 14,
    borderRadius: 2,
    backgroundColor: colors.aoveGold,
    marginTop: -5,
  },
  downloadArrowHead: {
    width: 10,
    height: 10,
    borderRightWidth: 3,
    borderBottomWidth: 3,
    borderColor: colors.aoveGold,
    transform: [{ rotate: '45deg' }],
    marginTop: -8,
  },
  downloadBase: {
    width: 19,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.limestone,
    marginTop: 7,
  },
  offlineHeaderCopy: {
    flex: 1,
  },
  offlineEyebrow: {
    color: colors.aoveGold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  offlineTitle: {
    color: colors.white,
    fontSize: 18,
    fontWeight: '900',
    marginTop: 3,
  },
  offlineBody: {
    color: colors.limestone,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[16],
    paddingRight: spacing[20],
  },
  safetyNotice: {
    marginHorizontal: spacing[20],
    marginTop: spacing[20],
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    padding: spacing[16],
    flexDirection: 'row',
  },
  safetyIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: colors.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  safetyIconText: {
    color: colors.earth,
    fontSize: 17,
    fontWeight: '900',
  },
  safetyCopy: {
    flex: 1,
  },
  safetyTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  safetyBody: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 4,
  },
  developmentNotice: {
    marginHorizontal: spacing[20],
    marginTop: spacing[20],
    borderRadius: radius.md,
    backgroundColor: colors.oliveWash,
    padding: spacing[16],
  },
  developmentEyebrow: {
    color: colors.olive700,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  developmentBody: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 17,
    marginTop: 5,
  },
  footer: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing[20],
    paddingTop: spacing[12],
    paddingBottom: spacing[20],
    backgroundColor: colors.white,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  startButton: {
    minHeight: 62,
    borderRadius: radius.md,
    paddingHorizontal: spacing[20],
    backgroundColor: colors.olive900,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadow.card,
  },
  startButtonPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.995 }],
  },
  startButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
  startButtonCaption: {
    color: colors.limestone,
    fontSize: 9,
    marginTop: 2,
  },
  startArrow: {
    color: colors.aoveGold,
    fontSize: 24,
    fontWeight: '900',
  },
  notFound: {
    flex: 1,
    padding: spacing[24],
    alignItems: 'center',
    justifyContent: 'center',
  },
  notFoundTitle: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: spacing[20],
  },
  notFoundBody: {
    color: colors.muted,
    fontSize: 14,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  secondaryButton: {
    marginTop: spacing[20],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
  },
  secondaryButtonText: {
    color: colors.olive900,
    fontWeight: '800',
  },
});
