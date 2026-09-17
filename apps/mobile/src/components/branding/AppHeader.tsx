import { StyleSheet, Text, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { AppLogo } from './AppLogo';

export function AppHeader() {
  return (
    <View style={styles.header}>
      <AppLogo compact />
      <View accessibilityRole="text" style={styles.betaBadge}>
        <View style={styles.betaDot} />
        <Text style={styles.betaText}>BETA GPS</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing[8],
    paddingBottom: spacing[16],
  },
  betaBadge: {
    minHeight: 36,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[8],
    paddingHorizontal: spacing[12],
    backgroundColor: colors.oliveWash,
    borderWidth: 1,
    borderColor: colors.border,
  },
  betaDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: colors.aoveGold,
  },
  betaText: {
    color: colors.olive900,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
});
