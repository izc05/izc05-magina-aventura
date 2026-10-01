import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { PassportGpsSessionDetail } from '../../activity/activity-store';
import type { PassportGpsTraceMapData } from '../../activity/passport-gps-trace';
import { RouteMap } from '../../map/RouteMap';
import { colors, radius, spacing } from '../../theme/tokens';

export type PassportGpsSessionDetailState =
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'not-found' }
  | { status: 'ready'; data: PassportGpsSessionDetail };

interface PassportGpsSessionDetailPanelProps {
  state: PassportGpsSessionDetailState;
  trace: PassportGpsTraceMapData | null;
  isMapVisible: boolean;
  isDeleting?: boolean;
  onToggleMap: () => void;
  onRequestDelete: () => void;
}

function formatDistance(meters: number): string {
  return `${(meters / 1000).toFixed(2)} km`;
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

export function PassportGpsSessionDetailPanel({
  state,
  trace,
  isMapVisible,
  isDeleting = false,
  onToggleMap,
  onRequestDelete,
}: PassportGpsSessionDetailPanelProps) {
  if (state.status === 'loading') {
    return <View style={styles.panel}><Text style={styles.body}>Cargando detalle GPS personal…</Text></View>;
  }
  if (state.status === 'error') {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Detalle GPS no disponible</Text>
        <Text style={styles.body}>No se pudieron leer los datos locales de esta captura.</Text>
      </View>
    );
  }
  if (state.status === 'not-found') {
    return (
      <View style={styles.panel}>
        <Text style={styles.title}>Captura no encontrada</Text>
        <Text style={styles.body}>No existe una captura GPS finalizada de este dispositivo en tu pasaporte.</Text>
      </View>
    );
  }

  const { data } = state;
  return (
    <View style={styles.panel}>
      <Text accessibilityRole="header" style={styles.title}>Registro GPS personal</Text>
      <Text style={styles.body}>Finalizada · {formatFinishedAt(data.finishedAt)}</Text>
      <View style={styles.metricRow}>
        <View style={styles.metric}>
          <Text style={styles.value}>{formatDistance(data.distanceMeters)}</Text>
          <Text style={styles.label}>Distancia registrada</Text>
        </View>
        <View style={styles.metric}>
          <Text style={styles.value}>{formatElapsedTime(data.elapsedSeconds)}</Text>
          <Text style={styles.label}>Tiempo activo</Text>
        </View>
      </View>
      <Text style={styles.body}>
        {data.sampleCount} {data.sampleCount === 1 ? 'muestra GPS guardada' : 'muestras GPS guardadas'} en este dispositivo.
      </Text>

      <View style={styles.privacyNote}>
        <Text style={styles.privacyText}>
          La traza se lee del almacenamiento local y se dibuja en este dispositivo. Al mostrar el mapa base,
          el proveedor cartográfico recibe solicitudes de teselas de la zona visible; no recibe la lista de
          muestras GPS ni se sincronizan recorridos o fotos.
        </Text>
      </View>

      {trace ? (
        <>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={isMapVisible ? 'Ocultar mapa de la traza GPS personal' : 'Mostrar mapa de la traza GPS personal'}
            style={styles.secondaryButton}
            onPress={onToggleMap}
          >
            <Text style={styles.secondaryButtonText}>{isMapVisible ? 'Ocultar mapa' : 'Mostrar traza en mapa'}</Text>
          </Pressable>
          {isMapVisible ? (
            <RouteMap
              payload={null}
              baseMapOnly
              showLayerControls={false}
              height={300}
              personalSessionTrace={trace}
            />
          ) : null}
        </>
      ) : (
        <Text style={styles.body}>No hay dos muestras GPS utilizables en el mismo intervalo para dibujar una traza.</Text>
      )}

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Eliminar esta captura GPS personal"
        accessibilityState={{ disabled: isDeleting }}
        disabled={isDeleting}
        style={[styles.deleteButton, isDeleting && styles.disabledButton]}
        onPress={onRequestDelete}
      >
        <Text style={styles.deleteButtonText}>{isDeleting ? 'Eliminando captura…' : 'Eliminar captura GPS'}</Text>
      </Pressable>
      <Text style={styles.footer}>
        Registro técnico personal; no representa una ruta oficial ni acredita progreso de juego.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { gap: spacing[12] },
  title: { color: colors.white, fontSize: 19, fontWeight: '900' },
  body: { color: colors.limestone, fontSize: 13, lineHeight: 19 },
  metricRow: { flexDirection: 'row', gap: spacing[16] },
  metric: { flex: 1, paddingVertical: spacing[4] },
  value: { color: colors.white, fontSize: 20, fontWeight: '900' },
  label: { color: colors.limestone, fontSize: 11, fontWeight: '700', marginTop: spacing[4] },
  privacyNote: { padding: spacing[12], borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  privacyText: { color: colors.limestone, fontSize: 11, lineHeight: 16 },
  secondaryButton: { minHeight: 46, paddingHorizontal: spacing[16], borderRadius: radius.md, borderWidth: 1, borderColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: colors.white, fontSize: 13, fontWeight: '900' },
  deleteButton: { minHeight: 48, paddingHorizontal: spacing[16], borderRadius: radius.md, backgroundColor: colors.aoveGold, alignItems: 'center', justifyContent: 'center', marginTop: spacing[8] },
  disabledButton: { opacity: 0.5 },
  deleteButtonText: { color: colors.ink, fontSize: 13, fontWeight: '900' },
  footer: { color: colors.limestone, fontSize: 11, lineHeight: 16 },
});
