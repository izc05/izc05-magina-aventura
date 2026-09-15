import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import type { RouteMapProps } from './map-types';

export function RouteMap({ payload, mapStyle, developmentMode }: RouteMapProps) {
  const initialViewState = payload
    ? {
        bounds: payload.bounds,
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
      }
    : { center: [-3.47, 37.71] as [number, number], zoom: 11 };

  const checkpointShape = payload
    ? {
        type: 'FeatureCollection' as const,
        features: payload.checkpoints.map((checkpoint) => ({
          type: 'Feature' as const,
          properties: { id: checkpoint.id, required: checkpoint.required },
          geometry: { type: 'Point' as const, coordinates: checkpoint.position },
        })),
      }
    : null;

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={mapStyle as any}>
        <Camera initialViewState={initialViewState as any} />

        {payload ? (
          <GeoJSONSource id="route-line" data={payload.line as any}>
            <Layer
              id="route-line-layer"
              type="line"
              paint={{
                'line-color': colors.olive700,
                'line-width': 5,
                'line-cap': 'round',
                'line-join': 'round',
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {checkpointShape ? (
          <GeoJSONSource id="route-checkpoints" data={checkpointShape as any}>
            <Layer
              id="route-checkpoints-layer"
              type="circle"
              paint={{
                'circle-color': colors.aoveGold,
                'circle-radius': 6,
                'circle-stroke-color': colors.white,
                'circle-stroke-width': 2,
              } as any}
            />
          </GeoJSONSource>
        ) : null}
      </Map>

      {!payload ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Track verificado no disponible todavía</Text>
        </View>
      ) : null}

      {developmentMode ? (
        <View style={styles.devBadge}>
          <Text style={styles.devText}>DESARROLLO</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 260,
    margin: spacing[20],
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.limestone,
  },
  map: { flex: 1 },
  notice: {
    position: 'absolute',
    left: spacing[12],
    right: spacing[12],
    bottom: spacing[12],
    padding: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  noticeText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  devBadge: {
    position: 'absolute',
    top: spacing[12],
    right: spacing[12],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  devText: { color: colors.white, fontSize: 9, fontWeight: '900' },
});
