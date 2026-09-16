import { StyleSheet, View } from 'react-native';

import { colors } from '../../theme/tokens';

type BrandMarkProps = Readonly<{
  size?: number;
  inverse?: boolean;
  framed?: boolean;
}>;

export function BrandMark({ size = 52, inverse = false, framed = false }: BrandMarkProps) {
  const ink = inverse ? colors.white : colors.olive900;
  const background = framed ? colors.olive900 : 'transparent';
  const scale = size / 64;

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel="Símbolo de Mágina Aventura"
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: framed ? 14 * scale : 0,
          backgroundColor: background,
        },
      ]}
    >
      <View
        style={[
          styles.sun,
          {
            width: 24 * scale,
            height: 24 * scale,
            borderRadius: 12 * scale,
            right: 8 * scale,
            top: 6 * scale,
          },
        ]}
      />

      <View
        style={[
          styles.mountainBack,
          {
            borderLeftWidth: 20 * scale,
            borderRightWidth: 20 * scale,
            borderBottomWidth: 29 * scale,
            left: 2 * scale,
            bottom: 10 * scale,
            borderBottomColor: ink,
          },
        ]}
      />
      <View
        style={[
          styles.mountainCut,
          {
            borderLeftWidth: 9 * scale,
            borderRightWidth: 9 * scale,
            borderBottomWidth: 13 * scale,
            left: 15 * scale,
            bottom: 25 * scale,
            borderBottomColor: framed ? colors.olive900 : colors.warmBackground,
          },
        ]}
      />

      <View
        style={[
          styles.pathSegment,
          {
            width: 8 * scale,
            height: 27 * scale,
            borderRadius: 7 * scale,
            left: 25 * scale,
            bottom: 7 * scale,
            backgroundColor: inverse || framed ? colors.white : colors.warmBackground,
            transform: [{ rotate: '27deg' }],
          },
        ]}
      />
      <View
        style={[
          styles.pathSegment,
          {
            width: 7 * scale,
            height: 18 * scale,
            borderRadius: 6 * scale,
            left: 32 * scale,
            bottom: 3 * scale,
            backgroundColor: inverse || framed ? colors.white : colors.warmBackground,
            transform: [{ rotate: '-31deg' }],
          },
        ]}
      />

      <View
        style={[
          styles.branch,
          {
            width: 24 * scale,
            height: 3 * scale,
            right: 1 * scale,
            bottom: 13 * scale,
            backgroundColor: ink,
            transform: [{ rotate: '-31deg' }],
          },
        ]}
      />
      <Leaf scale={scale} right={2} bottom={23} rotation={-25} color={ink} />
      <Leaf scale={scale} right={11} bottom={29} rotation={18} color={ink} />
      <Leaf scale={scale} right={20} bottom={19} rotation={-8} color={ink} />
      <Olive scale={scale} right={10} bottom={10} color={ink} />
      <Olive scale={scale} right={18} bottom={7} color={ink} />
    </View>
  );
}

function Leaf({
  scale,
  right,
  bottom,
  rotation,
  color,
}: {
  scale: number;
  right: number;
  bottom: number;
  rotation: number;
  color: string;
}) {
  return (
    <View
      style={{
        position: 'absolute',
        width: 13 * scale,
        height: 6 * scale,
        borderRadius: 8 * scale,
        right: right * scale,
        bottom: bottom * scale,
        backgroundColor: color,
        transform: [{ rotate: `${rotation}deg` }],
      }}
    />
  );
}

function Olive({ scale, right, bottom, color }: { scale: number; right: number; bottom: number; color: string }) {
  return (
    <View
      style={{
        position: 'absolute',
        width: 7 * scale,
        height: 7 * scale,
        borderRadius: 4 * scale,
        right: right * scale,
        bottom: bottom * scale,
        backgroundColor: color,
      }}
    />
  );
}

const styles = StyleSheet.create({
  frame: {
    position: 'relative',
    overflow: 'hidden',
  },
  sun: {
    position: 'absolute',
    backgroundColor: colors.aoveGold,
  },
  mountainBack: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  mountainCut: {
    position: 'absolute',
    width: 0,
    height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
  },
  pathSegment: {
    position: 'absolute',
  },
  branch: {
    position: 'absolute',
    borderRadius: 99,
  },
});
