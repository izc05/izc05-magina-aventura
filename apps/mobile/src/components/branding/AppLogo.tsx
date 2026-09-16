import { StyleSheet, Text, View } from 'react-native';

import { brand } from '../../theme/branding';
import { colors } from '../../theme/tokens';
import { BrandMark } from './BrandMark';

type AppLogoProps = Readonly<{
  compact?: boolean;
  inverse?: boolean;
}>;

export function AppLogo({ compact = false, inverse = false }: AppLogoProps) {
  const foreground = inverse ? colors.white : colors.ink;
  const muted = inverse ? colors.limestone : colors.olive700;

  return (
    <View style={styles.row}>
      <BrandMark size={compact ? 40 : 48} inverse={inverse} />
      <View style={styles.copy}>
        <Text style={[styles.location, { color: muted }]}>{brand.location.toUpperCase()}</Text>
        <Text style={[styles.name, compact && styles.nameCompact, { color: foreground }]}>{brand.name}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  copy: {
    marginLeft: 8,
  },
  location: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.9,
  },
  name: {
    marginTop: 1,
    fontSize: 22,
    lineHeight: 25,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  nameCompact: {
    fontSize: 19,
    lineHeight: 22,
  },
});
