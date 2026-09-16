import { Image, StyleSheet, View } from 'react-native';

import { colors } from '../../theme/tokens';

type BrandMarkProps = Readonly<{
  size?: number;
  inverse?: boolean;
  framed?: boolean;
}>;

const officialMark = require('../../../assets/branding/splash-logo.png');

export function BrandMark({ size = 52, inverse = false, framed = false }: BrandMarkProps) {
  const showPlate = inverse || framed;

  return (
    <View
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: showPlate ? Math.max(12, size * 0.22) : 0,
          backgroundColor: showPlate ? colors.warmBackground : 'transparent',
          padding: showPlate ? size * 0.08 : 0,
        },
      ]}
    >
      <Image
        accessibilityRole="image"
        accessibilityLabel="Símbolo oficial de Mágina Aventura"
        source={officialMark}
        resizeMode="contain"
        style={styles.image}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
});
