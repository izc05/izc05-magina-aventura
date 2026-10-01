import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PassportGpsData } from '../../activity/activity-store';
import { colors, spacing } from '../../theme/tokens';

export type PassportGpsLoadState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'ready'; data: PassportGpsData };

interface PassportGpsMetricsPanelProps {
  state: PassportGpsLoadState;
  onSelectSession?: (activityId: string) => void;
}

export function scopePassportGpsLoadState(
  currentOwnerId: string | null,
  storedOwnerId: string | null,
  state: PassportGpsLoadState | null,
): PassportGpsLoadState {
  if (!currentOwnerId || currentOwnerId !== storedOwnerId || !state) {
    return { status: 'loading' };
  }
  return state;
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

function formatFinishedAt(value: string): string {
  const date = new Date(value);
  return `${date.toLocaleDateString('es-ES')} · ${date.toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit',
  })}`;
}

export function PassportGpsMetricsPanel({
  state,
  onSelectSession,
}: PassportGpsMetricsPanelProps) {
  if (state.status === 'loading') {
    return (
      <View style={styles.panel}>
        <Text style={styles.message}>Cargando capturas GPS guardadas…</Text>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Capturas GPS no disponibles</Text>
        <Text style={styles.body}>No se pudieron leer las sesiones GPS guardadas en este dispositivo.</Text>
      </View>
    );
  }

  const { data } = state;
  if (data.sessions.length === 0) {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Aún no hay capturas GPS guardadas</Text>
        <Text style={styles.body}>
          Aquí aparecerán únicamente capturas finalizadas con GPS real del dispositivo y datos guardados.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.panel}>
      <View style={styles.metric}>
        <Text style={styles.value}>{data.metrics.sessionCount}</Text>
        <Text style={styles.label}>Capturas GPS registradas</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.value}>{formatDistance(data.metrics.distanceMeters)}</Text>
        <Text style={styles.label}>Distancia GPS acumulada</Text>
      </View>
      <View style={styles.metric}>
        <Text style={styles.value}>{formatElapsedTime(data.metrics.elapsedSeconds)}</Text>
        <Text style={styles.label}>Tiempo activo acumulado</Text>
      </View>
      <View style={styles.sessions}>
        <Text style={styles.title}>Capturas GPS</Text>
        {data.sessions.map((session) => (
          <Pressable
            key={session.activityId}
            accessibilityRole={onSelectSession ? 'button' : undefined}
            accessibilityLabel={`Abrir detalle de captura GPS · ${formatFinishedAt(session.finishedAt)}`}
            disabled={!onSelectSession}
            onPress={() => onSelectSession?.(session.activityId)}
            style={styles.session}
          >
            <Text style={styles.sessionDate}>{formatFinishedAt(session.finishedAt)}</Text>
            <Text style={styles.sessionDetail}>
              {formatDistance(session.distanceMeters)} · {formatElapsedTime(session.elapsedSeconds)} activos
            </Text>
            <Text style={styles.sessionDetail}>
              {session.sampleCount} {session.sampleCount === 1 ? 'muestra GPS guardada' : 'muestras GPS guardadas'}
            </Text>
          </Pressable>
        ))}
      </View>
      <Text style={styles.disclaimer}>
        Son registros técnicos de GPS guardados; no acreditan rutas completadas ni progreso de juego.
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
  sessions: { gap: spacing[8], marginTop: spacing[8] },
  session: { borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.18)', paddingTop: spacing[12], gap: spacing[4] },
  sessionDate: { color: colors.white, fontSize: 14, fontWeight: '800' },
  sessionDetail: { color: colors.limestone, fontSize: 12, lineHeight: 17 },
});
