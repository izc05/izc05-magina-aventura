import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Camera, type CameraRef, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import type { RouteMapProps } from './map-types';
import {
  defaultLayerVisibility,
  buildRouteMapOverlayData,
  buildBaseMapDeviceLocationFeature,
  type MapLayerVisibility,
  type MapThemeId,
} from './map-layers';
import { getMapTheme } from './map-theme';
import { LayerControlOverlay } from './LayerControlOverlay';
import {
  getInitialMapViewState,
  OPENFREEMAP_LIBERTY_STYLE_URL,
} from './map-reference';

export function RouteMap({
  payload,
  mapStyle,
  baseMapOnly = false,
  attribution = true,
  developmentMode,
  themeId = 'olive',
  layerVisibility: initialVisibility,
  showLayerControls = true,
  onThemeChange,
  onLayerVisibilityChange,
  height = 280,
  deviceLocation,
}: RouteMapProps) {
  const [activeThemeId, setActiveThemeId] = useState<MapThemeId>(themeId);
  const [visibility, setVisibility] = useState<MapLayerVisibility>({
    ...defaultLayerVisibility,
    ...initialVisibility,
  });
  const [mapLoadState, setMapLoadState] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mapKey, setMapKey] = useState(0);
  const cameraRef = useRef<CameraRef>(null);
  const centeredOnDeviceLocation = useRef(false);

  const theme = getMapTheme(activeThemeId);
  const initialViewState = getInitialMapViewState(payload, baseMapOnly);
  const { routeLine, checkpointShape, poiShape, hikerShape } =
    buildRouteMapOverlayData(payload, baseMapOnly);
  const deviceLocationShape = useMemo(
    () => buildBaseMapDeviceLocationFeature(deviceLocation, baseMapOnly),
    [baseMapOnly, deviceLocation?.[0], deviceLocation?.[1]],
  );

  useEffect(() => {
    if (!baseMapOnly || !deviceLocation) {
      centeredOnDeviceLocation.current = false;
      return;
    }
    if (mapLoadState === 'loading') {
      centeredOnDeviceLocation.current = false;
      return;
    }
    if (mapLoadState !== 'ready' || centeredOnDeviceLocation.current || !cameraRef.current) {
      return;
    }

    const center: [number, number] = [deviceLocation[0], deviceLocation[1]];
    cameraRef.current.easeTo({ center, zoom: 15, duration: 300 });
    centeredOnDeviceLocation.current = true;
  }, [baseMapOnly, deviceLocation?.[0], deviceLocation?.[1], mapLoadState]);

  function handleToggleLayer(key: keyof MapLayerVisibility) {
    const updated = { ...visibility, [key]: !visibility[key] };
    setVisibility(updated);
    onLayerVisibilityChange?.(updated);
  }

  function handleSelectTheme(newThemeId: MapThemeId) {
    setActiveThemeId(newThemeId);
    onThemeChange?.(newThemeId);
  }

  return (
    <View style={[styles.container, { height, backgroundColor: theme.backgroundColor }]}>
      <Map
        key={mapKey}
        style={styles.map}
        mapStyle={(mapStyle ?? OPENFREEMAP_LIBERTY_STYLE_URL) as any}
        attribution={attribution}
        onWillStartLoadingMap={() => setMapLoadState('loading')}
        onDidFinishLoadingMap={() => setMapLoadState('ready')}
        onDidFailLoadingMap={() => setMapLoadState('error')}
      >
        <Camera ref={cameraRef} initialViewState={initialViewState as any} />

        {/* Route and POI overlays only come from the verified route payload. */}
        {routeLine && visibility.routeTrack ? (
          <GeoJSONSource id="route-line" data={routeLine as any}>
            <Layer
              id="route-line-casing"
              type="line"
              paint={{
                'line-color': theme.trackGlowColor,
                'line-width': theme.trackWidth + 6,
                'line-cap': 'round',
                'line-join': 'round',
              } as any}
            />
            <Layer
              id="route-line-layer"
              type="line"
              paint={{
                'line-color': theme.trackColor,
                'line-width': theme.trackWidth,
                'line-cap': 'round',
                'line-join': 'round',
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {checkpointShape && visibility.checkpoints ? (
          <GeoJSONSource id="route-checkpoints" data={checkpointShape as any}>
            <Layer
              id="route-checkpoints-layer"
              type="circle"
              paint={{
                'circle-color': theme.checkpointColor,
                'circle-radius': 7,
                'circle-stroke-color': theme.checkpointBorderColor,
                'circle-stroke-width': 2.5,
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {poiShape && visibility.pois ? (
          <GeoJSONSource id="route-pois" data={poiShape as any}>
            <Layer
              id="route-pois-layer"
              type="circle"
              paint={{
                'circle-color': [
                  'match',
                  ['get', 'category'],
                  'flora',
                  theme.poiColors.flora,
                  'fauna',
                  theme.poiColors.fauna,
                  'heritage',
                  theme.poiColors.heritage,
                  'olive',
                  theme.poiColors.olive,
                  'tradition',
                  theme.poiColors.tradition,
                  'landscape',
                  theme.poiColors.landscape,
                  theme.checkpointColor,
                ] as any,
                'circle-radius': 9,
                'circle-stroke-color': colors.white,
                'circle-stroke-width': 2,
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {hikerShape && visibility.hikerPosition ? (
          <GeoJSONSource id="hiker-position" data={hikerShape as any}>
            <Layer
              id="hiker-position-glow"
              type="circle"
              paint={{
                'circle-color': theme.hikerColor,
                'circle-radius': 14,
                'circle-opacity': 0.25,
              } as any}
            />
            <Layer
              id="hiker-position-dot"
              type="circle"
              paint={{
                'circle-color': theme.hikerColor,
                'circle-radius': 7,
                'circle-stroke-color': colors.white,
                'circle-stroke-width': 2,
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {deviceLocationShape ? (
          <GeoJSONSource id="technical-device-location" data={deviceLocationShape as any}>
            <Layer
              id="technical-device-location-pin"
              type="circle"
              paint={{
                'circle-color': '#1769FF',
                'circle-radius': 8,
                'circle-stroke-color': colors.white,
                'circle-stroke-width': 3,
              } as any}
            />
          </GeoJSONSource>
        ) : null}
      </Map>

      {!payload && !baseMapOnly ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Track verificado no disponible todavía</Text>
        </View>
      ) : null}

      {baseMapOnly && mapLoadState === 'loading' ? (
        <View pointerEvents="none" style={styles.mapStatus}>
          <Text style={styles.mapStatusText}>Cargando cartografía base…</Text>
        </View>
      ) : null}

      {baseMapOnly && mapLoadState === 'error' ? (
        <View style={[styles.mapStatus, styles.mapError]}>
          <Text style={styles.mapStatusText}>
            No se pudo cargar el mapa base. Comprueba la conexión.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Reintentar cargar cartografía base"
            onPress={() => {
              setMapLoadState('loading');
              setMapKey((current) => current + 1);
            }}
          >
            <Text style={styles.retryText}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {!baseMapOnly && showLayerControls ? (
        <LayerControlOverlay
          visibility={visibility}
          onToggleLayer={handleToggleLayer}
          activeThemeId={activeThemeId}
          onSelectTheme={handleSelectTheme}
        />
      ) : null}

      {!baseMapOnly && developmentMode ? (
        <View style={styles.devBadge}>
          <Text style={styles.devText}>DESARROLLO · {theme.name.toUpperCase()}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: spacing[20],
    marginVertical: spacing[12],
    overflow: 'hidden',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
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
  mapStatus: {
    position: 'absolute',
    top: spacing[12],
    left: spacing[12],
    right: spacing[12],
    padding: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  mapError: { borderWidth: 1, borderColor: colors.aoveGold },
  mapStatusText: { color: colors.ink, fontSize: 12, fontWeight: '800' },
  retryText: { color: colors.olive900, fontSize: 12, fontWeight: '900', marginTop: spacing[8] },
  devBadge: {
    position: 'absolute',
    bottom: spacing[12],
    left: spacing[12],
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.ink,
  },
  devText: { color: colors.white, fontSize: 9, fontWeight: '900' },
});
