import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import type { LocationSample, RouteMapPayload } from '@magina-aventura/contracts';
import { StyleSheet, Text, View } from 'react-native';

import type { ActivityTrackFeature } from '../activity/track-geojson';
import { colors, radius, spacing } from '../theme/tokens';

interface ActiveAdventureMapProps {
  payload: RouteMapPayload | null;
  mapStyle: string | Record<string, unknown>;
  track: ActivityTrackFeature;
  currentPoint: LocationSample | null;
  fallbackCenter: readonly [longitude: number, latitude: number];
}

export function ActiveAdventureMap({
  payload,
  mapStyle,
  track,
  currentPoint,
  fallbackCenter,
}: ActiveAdventureMapProps) {
  const center = currentPoint
    ? ([currentPoint.longitude, currentPoint.latitude] as [number, number])
    : ([fallbackCenter[0], fallbackCenter[1]] as [number, number]);

  const initialViewState = payload
    ? {
        bounds: payload.bounds,
        padding: { top: 150, right: 44, bottom: 230, left: 44 },
      }
    : { center, zoom: 15 };

  const currentPositionFeature = currentPoint
    ? {
        type: 'Feature' as const,
        properties: {
          accuracyMeters: currentPoint.accuracyMeters,
        },
        geometry: {
          type: 'Point' as const,
          coordinates: [currentPoint.longitude, currentPoint.latitude] as [number, number],
        },
      }
    : null;

  return (
    <View style={styles.container}>
      <Map style={styles.map} mapStyle={mapStyle as any}>
        <Camera initialViewState={initialViewState as any} />

        {payload ? (
          <GeoJSONSource id="active-route-line" data={payload.line as any}>
            <Layer
              id="active-route-line-layer"
              type="line"
              paint={{
                'line-color': colors.olive700,
                'line-width': 5,
                'line-opacity': 0.72,
                'line-cap': 'round',
                'line-join': 'round',
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {track.geometry.coordinates.length >= 2 ? (
          <GeoJSONSource id="active-user-track" data={track as any}>
            <Layer
              id="active-user-track-layer"
              type="line"
              paint={{
                'line-color': colors.aoveGold,
                'line-width': 6,
                'line-cap': 'round',
                'line-join': 'round',
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {currentPositionFeature ? (
          <GeoJSONSource id="active-current-position" data={currentPositionFeature as any}>
            <Layer
              id="active-current-position-accuracy"
              type="circle"
              paint={{
                'circle-color': colors.sky,
                'circle-radius': 14,
                'circle-opacity': 0.22,
              } as any}
            />
            <Layer
              id="active-current-position-dot"
              type="circle"
              paint={{
                'circle-color': colors.aoveGold,
                'circle-radius': 7,
                'circle-stroke-color': colors.white,
                'circle-stroke-width': 3,
              } as any}
            />
          </GeoJSONSource>
        ) : null}
      </Map>

      {!payload ? (
        <View style={styles.routeNotice}>
          <Text style={styles.routeNoticeText}>
            Sin track oficial verificado · mostrando únicamente tu GPS real
          </Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    overflow: 'hidden',
    backgroundColor: colors.limestone,
  },
  map: { flex: 1 },
  routeNotice: {
    position: 'absolute',
    left: spacing[16],
    right: spacing[16],
    top: 202,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
  },
  routeNoticeText: {
    color: colors.ink,
    fontSize: 10,
    fontWeight: '800',
    textAlign: 'center',
  },
});
