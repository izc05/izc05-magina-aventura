import React, { useState } from 'react';
import { Camera, GeoJSONSource, Layer, Map } from '@maplibre/maplibre-react-native';
import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import type { RouteMapProps } from './map-types';
import {
  buildCheckpointFeatureCollection,
  buildHikerPositionFeature,
  buildPOIFeatureCollection,
  defaultLayerVisibility,
  sierraMaginaParkBoundaryGeoJSON,
  type MapLayerVisibility,
  type MapThemeId,
  type EnhancedRoutePayload,
} from './map-layers';
import { getMapTheme } from './map-theme';
import { LayerControlOverlay } from './LayerControlOverlay';

export function RouteMap({
  payload,
  mapStyle,
  developmentMode,
  themeId = 'olive',
  layerVisibility: initialVisibility,
  showLayerControls = true,
  onThemeChange,
  onLayerVisibilityChange,
  height = 280,
}: RouteMapProps) {
  const [activeThemeId, setActiveThemeId] = useState<MapThemeId>(themeId);
  const [visibility, setVisibility] = useState<MapLayerVisibility>({
    ...defaultLayerVisibility,
    ...initialVisibility,
  });

  const theme = getMapTheme(activeThemeId);
  const enhancedPayload = payload as EnhancedRoutePayload | null;

  const initialViewState = payload
    ? {
        bounds: payload.bounds,
        padding: { top: 32, right: 32, bottom: 32, left: 32 },
      }
    : { center: [-3.47, 37.71] as [number, number], zoom: 11 };

  const checkpointShape = payload
    ? buildCheckpointFeatureCollection(payload.checkpoints)
    : null;

  const poiShape = enhancedPayload?.pois
    ? buildPOIFeatureCollection(enhancedPayload.pois)
    : null;

  const hikerShape = enhancedPayload?.hikerPosition
    ? buildHikerPositionFeature(
        enhancedPayload.hikerPosition,
        enhancedPayload.hikerHeadingDeg ?? 45,
      )
    : null;

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
      <Map style={styles.map} mapStyle={mapStyle as any}>
        <Camera initialViewState={initialViewState as any} />

        {/* Capa 1: Parque Natural Sierra Mágina Boundary */}
        {visibility.parkBoundary ? (
          <GeoJSONSource id="park-boundary-source" data={sierraMaginaParkBoundaryGeoJSON as any}>
            <Layer
              id="park-boundary-fill"
              type="fill"
              paint={{
                'fill-color': theme.parkBoundaryFill,
              } as any}
            />
            <Layer
              id="park-boundary-line"
              type="line"
              paint={{
                'line-color': theme.parkBoundaryLine,
                'line-width': 1.5,
                'line-dasharray': [4, 3],
              } as any}
            />
          </GeoJSONSource>
        ) : null}

        {/* Capa 2: Route Track Line */}
        {payload && visibility.routeTrack ? (
          <GeoJSONSource id="route-line" data={payload.line as any}>
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

        {/* Capa 3: Checkpoints */}
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

        {/* Capa 4: POIs / Descubrimientos */}
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

        {/* Capa 5: Posición Senderista / Hiker Location */}
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
      </Map>

      {!payload ? (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>Track verificado no disponible todavía</Text>
        </View>
      ) : null}

      {showLayerControls ? (
        <LayerControlOverlay
          visibility={visibility}
          onToggleLayer={handleToggleLayer}
          activeThemeId={activeThemeId}
          onSelectTheme={handleSelectTheme}
        />
      ) : null}

      {developmentMode ? (
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
