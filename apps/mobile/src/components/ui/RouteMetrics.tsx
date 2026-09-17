import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';
import { durationLabel, difficultyLabel } from '../../features/routes/route-utils';

interface RouteMetricsProps {
  distanceKm: number;
  elevationGainM: number;
  durationMinutes: number;
}

export function RouteMetrics({ distanceKm, elevationGainM, durationMinutes }: RouteMetricsProps) {
  return (
    <View style={styles.metricsRow}>
      <Metric value={`${distanceKm.toFixed(1)} km`} label="Distancia" />
      <Metric value={`+${elevationGainM} m`} label="Desnivel" />
      <Metric value={durationLabel(durationMinutes)} label="Duración" />
    </View>
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
  metricsRow: { flexDirection: 'row', gap: spacing[12], marginTop: spacing[20] },
  metric: { flex: 1 },
  metricValue: { color: colors.ink, fontSize: typography.metric, fontWeight: '900' },
  metricLabel: { color: colors.muted, fontSize: 11, marginTop: 3 },
});
