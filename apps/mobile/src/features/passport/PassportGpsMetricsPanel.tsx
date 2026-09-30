import { StyleSheet, Text, View } from 'react-native';

import type { PassportGpsMetrics } from '../../activity/activity-store';
import { colors, spacing } from '../../theme/tokens';

export type PassportGpsLoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; metrics: PassportGpsMetrics };

interface PassportGpsMetricsPanelProps {
  state: PassportGpsLoadState;
}

function formatDistance(meters: number): string {
  const kilometers = meters / 1000;
  return `${kilometers.toFixed(2)} km`;
}

function formatElapsedTime(seconds: number): string {
  const wholeMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(wholeMinutes / 60);
  const minutes = wholeMinutes % 60;
  if (hours > 0) return `${hours} h ${String(minutes).padStart(2, '0')} min`;
  if (wholeMinutes > 0) return `${wholeMinutes} min`;
  return `${Math.floor(seconds)} s`;
}

export function PassportGpsMetricsPanel({
  state,
}: PassportGpsMetricsPanelProps) {
  if (state.status === 'loading') {
    return (
      <View style={styles.panel}>
        <Text style={styles.message}>Cargando métricas GPS guardadas…</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Métricas GPS no disponibles</Text>
        <Text style={styles.body}>No se pudieron leer las sesiones GPS guardadas en este dispositivo.</Text>
      </View>
    );
  }

  const { metrics } = state;
  if (metrics.sessionCount === 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Aún no hay sesiones GPS registradas</Text>
        <Text style={styles.body}>
          Aquí aparecerán únicamente las métricas guardadas de sesiones GPS finalizadas.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.metric}>
        <Text style={styles.value}>{metrics.sessionCount}</Text>
        <Text style={styles.label}>Sesiones GPS registradas</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.value}>{formatDistance(metrics.distanceMeters)}</Text>
        <Text style={styles.label}>Distancia GPS acumulada</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.value}>{formatElapsedTime(metrics.elapsedSeconds)}</Text>
        <Text style={styles.label}>Tiempo GPS acumulado</Text>
      </View>
      <Text style={styles.disclaimer}>
        Son métricas guardadas de GPS; no acreditan rutas completadas ni checkpoints, descubrimientos, XP, insignias o recompensas.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[12] },
  metric: { paddingVertical: spacing[4] },
  value: { color: colors.white, fontSize: 24, fontWeight: '900' },
  label: { color: colors.limestone, fontSize: 12, fontWeight: '700', marginTop: spacing[4] },
  title: { color: colors.white, fontSize: 16, fontWeight: '800' },
  body: { color: colors.limestone, fontSize: 13, lineHeight: 19, marginTop: spacing[4] },
  message: { color: colors.limestone, fontSize: 13, lineHeight: 19 },
  disclaimer: { color: colors.limestone, fontSize: 11, lineHeight: 16, marginTop: spacing[4] },
});
