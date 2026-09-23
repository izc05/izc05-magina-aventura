import { Pressable, StyleSheet, View } from 'react-native';

import { colors, radius, spacing } from '../../theme/tokens';
import { AppLogo } from './AppLogo';

export function AppHeader({ onDiagnosticsPress }: { onDiagnosticsPress?: () => void }) {
  return (
    <View style={styles.header}>
      <AppLogo compact />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={onDiagnosticsPress ? 'Abrir diagnóstico' : 'Notificaciones'}
        onPress={onDiagnosticsPress}
        style={styles.notificationButton}
      >
        <View style={styles.bellDome} />
        <View style={styles.bellBase} />
        <View style={styles.bellClapper} />
      </Pressable>
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
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  bellDome: {
    width: 14,
    height: 15,
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderColor: colors.olive900,
  },
  bellBase: {
    width: 18,
    height: 2,
    borderRadius: 2,
    backgroundColor: colors.olive900,
  },
  bellClapper: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 2,
    backgroundColor: colors.olive900,
  },
});
