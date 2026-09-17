import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/tokens';
import {
  getAdventureLandscapePreset,
  type AdventureLandscapeVariant,
} from './adventure-landscape-preset';

type AdventureLandscapeProps = Readonly<{
  variant: AdventureLandscapeVariant;
}>;

type SceneGeometry = Readonly<{
  glow: string;
  glowOpacity: number;
  sunRight: number;
  sunTop: number;
  backWidth: number;
  backHeight: number;
  backRight: number;
  backBottom: number;
  backRotate: string;
  midWidth: number;
  midHeight: number;
  midLeft: number;
  midBottom: number;
  midRotate: string;
  frontWidth: number;
  frontHeight: number;
  frontRight: number;
  frontBottom: number;
  frontRotate: string;
  pathHeight: number;
  pathBottom: number;
  pathRotate: string;
}>;

const geometry: Record<AdventureLandscapeVariant, SceneGeometry> = {
  home: {
    glow: '#47725B',
    glowOpacity: 0.55,
    sunRight: 30,
    sunTop: 26,
    backWidth: 330,
    backHeight: 145,
    backRight: -108,
    backBottom: 90,
    backRotate: '-14deg',
    midWidth: 320,
    midHeight: 150,
    midLeft: -120,
    midBottom: 72,
    midRotate: '17deg',
    frontWidth: 350,
    frontHeight: 135,
    frontRight: -120,
    frontBottom: 34,
    frontRotate: '9deg',
    pathHeight: 150,
    pathBottom: 0,
    pathRotate: '18deg',
  },
  card: {
    glow: '#D8E8ED',
    glowOpacity: 0.46,
    sunRight: 38,
    sunTop: 26,
    backWidth: 310,
    backHeight: 145,
    backRight: -105,
    backBottom: -28,
    backRotate: '-13deg',
    midWidth: 300,
    midHeight: 140,
    midLeft: -98,
    midBottom: -30,
    midRotate: '18deg',
    frontWidth: 270,
    frontHeight: 115,
    frontRight: -92,
    frontBottom: -50,
    frontRotate: '10deg',
    pathHeight: 145,
    pathBottom: -84,
    pathRotate: '19deg',
  },
  detail: {
    glow: '#345D49',
    glowOpacity: 0.62,
    sunRight: 30,
    sunTop: 38,
    backWidth: 370,
    backHeight: 175,
    backRight: -122,
    backBottom: 44,
    backRotate: '-11deg',
    midWidth: 345,
    midHeight: 164,
    midLeft: -126,
    midBottom: 18,
    midRotate: '16deg',
    frontWidth: 365,
    frontHeight: 148,
    frontRight: -126,
    frontBottom: -12,
    frontRotate: '8deg',
    pathHeight: 166,
    pathBottom: -20,
    pathRotate: '17deg',
  },
  prepare: {
    glow: '#3C6853',
    glowOpacity: 0.58,
    sunRight: 34,
    sunTop: 48,
    backWidth: 318,
    backHeight: 142,
    backRight: -108,
    backBottom: 34,
    backRotate: '-13deg',
    midWidth: 300,
    midHeight: 138,
    midLeft: -112,
    midBottom: 10,
    midRotate: '17deg',
    frontWidth: 322,
    frontHeight: 128,
    frontRight: -116,
    frontBottom: -28,
    frontRotate: '9deg',
    pathHeight: 146,
    pathBottom: -34,
    pathRotate: '18deg',
  },
};

export function AdventureLandscape({ variant }: AdventureLandscapeProps) {
  const preset = getAdventureLandscapePreset(variant);
  const scene = geometry[variant];
  const card = variant === 'card';

  return (
    <View pointerEvents="none" style={[styles.fill, card ? styles.cardSky : styles.darkSky]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: scene.glow, opacity: scene.glowOpacity },
        ]}
      />
      <View
        style={[
          styles.sun,
          {
            width: preset.sunSize,
            height: preset.sunSize,
            borderRadius: preset.sunSize / 2,
            right: scene.sunRight,
            top: scene.sunTop,
          },
        ]}
      />
      <View
        style={[
          styles.mountain,
          styles.mountainBack,
          {
            width: scene.backWidth,
            height: scene.backHeight,
            right: scene.backRight,
            bottom: scene.backBottom,
            transform: [{ rotate: scene.backRotate }],
          },
        ]}
      />
      <View
        style={[
          styles.mountain,
          styles.mountainMid,
          {
            width: scene.midWidth,
            height: scene.midHeight,
            left: scene.midLeft,
            bottom: scene.midBottom,
            transform: [{ rotate: scene.midRotate }],
          },
        ]}
      />
      <View
        style={[
          styles.mountain,
          styles.mountainFront,
          {
            width: scene.frontWidth,
            height: scene.frontHeight,
            right: scene.frontRight,
            bottom: scene.frontBottom,
            transform: [{ rotate: scene.frontRotate }],
          },
        ]}
      />
      <View
        style={[
          styles.path,
          {
            width: preset.pathWidth,
            height: scene.pathHeight,
            bottom: scene.pathBottom,
            transform: [{ rotate: scene.pathRotate }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
  },
  darkSky: {
    backgroundColor: colors.olive900,
  },
  cardSky: {
    backgroundColor: colors.sky,
  },
  sun: {
    position: 'absolute',
    backgroundColor: colors.aoveGold,
    opacity: 0.96,
  },
  mountain: {
    position: 'absolute',
    borderRadius: 64,
  },
  mountainBack: {
    backgroundColor: '#719083',
  },
  mountainMid: {
    backgroundColor: colors.olive700,
  },
  mountainFront: {
    backgroundColor: '#173C2D',
  },
  path: {
    position: 'absolute',
    left: '48%',
    borderRadius: 30,
    backgroundColor: colors.limestone,
    opacity: 0.88,
  },
});
