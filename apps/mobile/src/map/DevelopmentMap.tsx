import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../theme/tokens';
import type { RouteMapProps } from './map-types';

export function DevelopmentMap({
  start,
  routeId,
  geometryVersion,
  developmentMode,
}: RouteMapProps) {
  return (
    <View style={styles.container}>
      <View style={styles.routeLineA} />
      <View style={styles.routeLineB} />
      <View style={styles.startPoint} />

      <View style={styles.copy}>
        <Text style={styles.eyebrow}>MAPA DE DESARROLLO</Text>
        <Text style={styles.title}>
          MapLibre se conectará a la geometría versionada de esta ruta.
        </Text>
        {developmentMode ? (
          <Text style={styles.meta}>
            routeId {routeId} · geometry v{geometryVersion} · {start.latitude.toFixed(3)}, {start.longitude.toFixed(3)}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 230,
    margin: spacing[20],
    borderRadius: radius.lg,
    overflow: 'hidden',
    backgroundColor: colors.limestone,
    justifyContent: 'flex-end',
    padding: spacing[16],
  },
  routeLineA: {
    position: 'absolute',
    width: 200,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.olive700,
    left: 24,
    top: 92,
    transform: [{ rotate: '-16deg' }],
  },
  routeLineB: {
    position: 'absolute',
    width: 145,
    height: 8,
    borderRadius: radius.pill,
    backgroundColor: colors.olive700,
    right: 26,
    top: 74,
    transform: [{ rotate: '21deg' }],
  },
  startPoint: {
    position: 'absolute',
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.olive900,
    left: 28,
    top: 111,
    borderWidth: 4,
    borderColor: colors.white,
  },
  copy: {
    borderRadius: radius.md,
    backgroundColor: colors.white,
    padding: spacing[12],
  },
  eyebrow: {
    color: colors.olive700,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
    marginTop: spacing[4],
  },
  meta: {
    color: colors.muted,
    fontSize: 9,
    lineHeight: 13,
    marginTop: spacing[8],
  },
});
