import { Pressable, StyleSheet, Text, View } from 'react-native';

import { presentFeaturedRoute } from '../../features/routes/route-card-presenter';
import type { AdventureRouteCard } from '../../features/routes/route-types';
import { colors, radius, shadow, spacing, typography } from '../../theme/tokens';

type FeaturedRouteCardProps = Readonly<{
  route: AdventureRouteCard;
  onPress: () => void;
}>;

export function FeaturedRouteCard({ route, onPress }: FeaturedRouteCardProps) {
  const presentation = presentFeaturedRoute(route);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${route.title}`}
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <View style={styles.visual}>
        <View style={styles.skyGlow} />
        <View style={styles.sun} />
        <View style={styles.mountainBack} />
        <View style={styles.mountainMid} />
        <View style={styles.mountainFront} />
        <View style={styles.path} />

        <View style={styles.routeTypeBadge}>
          <Text style={styles.routeTypeText}>RUTA · SIERRA MÁGINA</Text>
        </View>

        {route.developmentFixture ? (
          <View style={styles.developmentBadge}>
            <Text style={styles.developmentText}>DATOS EN VALIDACIÓN</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.content}>
        <Text style={styles.municipality}>{route.municipalityName.toUpperCase()}</Text>
        <Text style={styles.title}>{route.title}</Text>
        <Text style={styles.description} numberOfLines={2}>
          {route.description}
        </Text>

        <View style={styles.metrics}>
          <Metric value={presentation.distance} label="Distancia" />
          <Metric value={presentation.elevation} label="Desnivel" />
          <Metric value={presentation.duration} label="Duración" />
        </View>

        <View style={styles.footer}>
          <View style={styles.difficultyBadge}>
            <Text style={styles.difficultyText}>{presentation.difficulty}</Text>
          </View>
          <View style={styles.rewardCopy}>
            <Text style={styles.rewardKicker}>OBJETIVOS</Text>
            <Text style={styles.rewardText}>{presentation.rewards}</Text>
          </View>
          <View style={styles.arrowButton}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

function Metric({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.metric}>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    overflow: 'hidden',
    borderRadius: radius.xl,
    backgroundColor: colors.white,
    ...shadow.card,
  },
  pressed: {
    opacity: 0.94,
    transform: [{ scale: 0.995 }],
  },
  visual: {
    height: 204,
    overflow: 'hidden',
    backgroundColor: colors.sky,
  },
  skyGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#D8E8ED',
    opacity: 0.45,
  },
  sun: {
    position: 'absolute',
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: colors.aoveGold,
    right: 38,
    top: 26,
    opacity: 0.9,
  },
  mountainBack: {
    position: 'absolute',
    width: 310,
    height: 145,
    borderRadius: 60,
    backgroundColor: '#719083',
    right: -105,
    bottom: -28,
    transform: [{ rotate: '-13deg' }],
  },
  mountainMid: {
    position: 'absolute',
    width: 300,
    height: 140,
    borderRadius: 55,
    backgroundColor: colors.olive500,
    left: -98,
    bottom: -30,
    transform: [{ rotate: '18deg' }],
  },
  mountainFront: {
    position: 'absolute',
    width: 270,
    height: 115,
    borderRadius: 50,
    backgroundColor: colors.olive900,
    right: -92,
    bottom: -50,
    transform: [{ rotate: '10deg' }],
  },
  path: {
    position: 'absolute',
    width: 48,
    height: 145,
    borderRadius: 30,
    backgroundColor: colors.limestone,
    left: '47%',
    bottom: -84,
    transform: [{ rotate: '19deg' }],
  },
  routeTypeBadge: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[16],
    paddingHorizontal: spacing[12],
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
  },
  routeTypeText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  developmentBadge: {
    position: 'absolute',
    right: spacing[12],
    bottom: spacing[12],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(23,32,25,0.82)',
    paddingHorizontal: spacing[8],
    paddingVertical: 5,
  },
  developmentText: {
    color: colors.white,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  content: {
    padding: spacing[20],
  },
  municipality: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  title: {
    marginTop: spacing[4],
    color: colors.ink,
    fontSize: 24,
    lineHeight: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  description: {
    marginTop: spacing[4],
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
  },
  metrics: {
    flexDirection: 'row',
    gap: spacing[12],
    marginTop: spacing[20],
  },
  metric: {
    flex: 1,
  },
  metricValue: {
    color: colors.ink,
    fontSize: typography.metric,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 10,
    marginTop: 3,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    marginTop: spacing[20],
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  difficultyBadge: {
    paddingHorizontal: spacing[10],
    paddingVertical: 7,
    borderRadius: radius.pill,
    backgroundColor: colors.oliveWash,
  },
  difficultyText: {
    color: colors.olive900,
    fontSize: 10,
    fontWeight: '900',
  },
  rewardCopy: {
    flex: 1,
  },
  rewardKicker: {
    color: colors.aoveGold,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 1,
  },
  rewardText: {
    marginTop: 3,
    color: colors.ink,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: '700',
  },
  arrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '900',
  },
});
