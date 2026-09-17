import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../../theme/tokens';
import { RouteMetrics } from './RouteMetrics';
import { DifficultyChip } from './DifficultyChip';
import type { RouteSummary } from '@magina-aventura/contracts';

interface RouteCardProps {
  route: RouteSummary & { developmentFixture?: boolean };
  onPress: () => void;
}

export function RouteCard({ route, onPress }: RouteCardProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ${route.title}`}
      style={styles.routeCard}
      onPress={onPress}
    >
      <View style={styles.routeVisual}>
        <View style={styles.routeGlow} />
        <View style={styles.routeMountainBack} />
        <View style={styles.routeMountainFront} />
        
        <View style={styles.badgeContainer}>
          <DifficultyChip difficulty={route.difficulty} />
        </View>

        {route.developmentFixture ? (
          <View style={styles.developmentBadge}>
            <Text style={styles.developmentText}>DATOS DE DESARROLLO</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.routeContent}>
        <Text style={styles.municipality}>{route.municipalityName.toUpperCase()}</Text>
        <Text style={styles.routeTitle}>{route.title}</Text>

        <RouteMetrics 
          distanceKm={route.distanceKm} 
          elevationGainM={route.elevationGainM} 
          durationMinutes={route.durationMinutes} 
        />

        <View style={styles.rewardRow}>
          <View style={styles.rewardCopy}>
            <Text style={styles.rewardLabel}>RECOMPENSAS DE AVENTURA</Text>
            <Text style={styles.rewardValue}>
              {route.rewardPreview.discoveries} descubrimientos · +{route.rewardPreview.xp} XP · +{route.rewardPreview.olives} 🫒
            </Text>
          </View>
          <View style={styles.arrowButton}>
            <Text style={styles.arrow}>→</Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  routeCard: { overflow: 'hidden', borderRadius: radius.lg, backgroundColor: colors.white, ...shadow.card },
  routeVisual: { height: 188, backgroundColor: colors.sky, overflow: 'hidden', position: 'relative' },
  routeGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.aoveGold,
    opacity: 0.75,
    right: 28,
    top: 26,
  },
  routeMountainBack: {
    position: 'absolute',
    width: 300,
    height: 150,
    backgroundColor: colors.olive700,
    transform: [{ rotate: '13deg' }],
    left: -60,
    bottom: -90,
    borderRadius: 40,
  },
  routeMountainFront: {
    position: 'absolute',
    width: 270,
    height: 140,
    backgroundColor: colors.olive900,
    transform: [{ rotate: '-14deg' }],
    right: -70,
    bottom: -85,
    borderRadius: 40,
  },
  badgeContainer: {
    position: 'absolute',
    top: spacing[16],
    left: spacing[16],
  },
  developmentBadge: {
    position: 'absolute',
    right: spacing[12],
    bottom: spacing[12],
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
  },
  developmentText: { color: colors.white, fontSize: 9, fontWeight: '900', letterSpacing: 0.6 },
  routeContent: { padding: spacing[20] },
  municipality: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.3 },
  routeTitle: { color: colors.ink, fontSize: 23, fontWeight: '900', marginTop: spacing[4] },
  rewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[20],
    paddingTop: spacing[16],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  rewardCopy: { flex: 1, paddingRight: spacing[12] },
  rewardLabel: { color: colors.aoveGold, fontSize: 9, fontWeight: '900', letterSpacing: 1.1 },
  rewardValue: { color: colors.ink, fontSize: 13, fontWeight: '700', marginTop: spacing[4] },
  arrowButton: {
    width: 42,
    height: 42,
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
  },
  arrow: { color: colors.white, fontSize: 20, fontWeight: '800' },
});
