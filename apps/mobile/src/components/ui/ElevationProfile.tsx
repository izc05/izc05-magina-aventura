import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';
import type { MapThemeConfig } from '../../map/map-theme';

export interface ElevationPoint {
  distanceKm: number;
  elevationM: number;
}

interface ElevationProfileProps {
  data: ElevationPoint[];
  theme?: MapThemeConfig;
  selectedDistanceKm?: number;
  onPointSelect?: (point: ElevationPoint) => void;
}

export function ElevationProfile({
  data,
  theme,
  selectedDistanceKm,
}: ElevationProfileProps) {
  if (!data || data.length === 0) return null;

  const elevations = data.map((d) => d.elevationM);
  const minElev = Math.min(...elevations);
  const maxElev = Math.max(...elevations);
  const range = Math.max(maxElev - minElev, 1);
  const maxDist = data[data.length - 1]?.distanceKm ?? 1;

  const activeColor = theme?.trackColor ?? colors.olive700;
  const textColor = theme?.textColor ?? colors.ink;
  const cardBg = theme?.cardBackground ?? colors.white;

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.title, { color: textColor }]}>Perfil Altimétrico</Text>
          <Text style={styles.subtitle}>Desnivel real a lo largo del trayecto</Text>
        </View>
        <View style={styles.badgeGroup}>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeLabel}>MIN</Text>
            <Text style={styles.statBadgeValue}>{Math.round(minElev)} m</Text>
          </View>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeLabel}>MÁX</Text>
            <Text style={[styles.statBadgeValue, { color: activeColor }]}>
              {Math.round(maxElev)} m
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.chartContainer}>
        <View style={styles.chartArea}>
          {data.map((point, index) => {
            const heightPercent = ((point.elevationM - minElev) / range) * 80 + 15;
            const isSelected =
              selectedDistanceKm !== undefined &&
              Math.abs(point.distanceKm - selectedDistanceKm) < maxDist / data.length;

            return (
              <View
                key={`${point.distanceKm}-${index}`}
                style={styles.barWrapper}
              >
                <View
                  style={[
                    styles.bar,
                    {
                      height: `${heightPercent}%`,
                      backgroundColor: isSelected ? colors.aoveGold : activeColor,
                      opacity: isSelected ? 1 : 0.75 + (heightPercent / 400),
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>

        <View style={styles.axisRow}>
          <Text style={styles.axisLabel}>0 km</Text>
          <Text style={styles.axisLabel}>{(maxDist / 2).toFixed(1)} km</Text>
          <Text style={styles.axisLabel}>{maxDist.toFixed(1)} km</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing[16],
    borderRadius: radius.lg,
    marginHorizontal: spacing[20],
    marginVertical: spacing[12],
    borderWidth: 1,
    borderColor: colors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[12],
  },
  title: {
    fontSize: 15,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginTop: 2,
  },
  badgeGroup: {
    flexDirection: 'row',
    gap: spacing[8],
  },
  statBadge: {
    backgroundColor: colors.limestone,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.sm,
    alignItems: 'center',
  },
  statBadgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: colors.muted,
  },
  statBadgeValue: {
    fontSize: 12,
    fontWeight: '900',
    color: colors.ink,
  },
  chartContainer: {
    marginTop: spacing[4],
  },
  chartArea: {
    height: 80,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingTop: spacing[8],
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  barWrapper: {
    flex: 1,
    height: '100%',
    justifyContent: 'flex-end',
    paddingHorizontal: 1,
  },
  bar: {
    width: '100%',
    borderTopLeftRadius: 3,
    borderTopRightRadius: 3,
  },
  axisRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[8],
  },
  axisLabel: {
    fontSize: 10,
    color: colors.muted,
    fontWeight: '700',
  },
});
