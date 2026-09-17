import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '../../components/branding/BrandMark';
import { brand } from '../../theme/branding';
import { colors, spacing } from '../../theme/tokens';

export function LaunchScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.glowTop} />
      <View style={styles.sun} />
      <View style={styles.mountainBack} />
      <View style={styles.mountainFront} />
      <View style={styles.path} />

      <View style={styles.brandWrap}>
        <BrandMark size={136} framed inverse />
        <Text style={styles.name}>{brand.name}</Text>
        <Text style={styles.location}>{brand.location.toUpperCase()}</Text>
      </View>

      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.aoveGold} size="small" />
        <Text style={styles.loading}>Preparando Mágina…</Text>
      </View>

      <Text style={styles.footer}>{brand.claim.toUpperCase()}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  glowTop: {
    position: 'absolute',
    width: 330,
    height: 330,
    borderRadius: 165,
    backgroundColor: colors.olive700,
    opacity: 0.26,
    top: -170,
    right: -120,
  },
  sun: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: colors.aoveGold,
    opacity: 0.16,
    right: -18,
    bottom: 108,
  },
  mountainBack: {
    position: 'absolute',
    width: 360,
    height: 165,
    borderRadius: 70,
    backgroundColor: colors.olive700,
    opacity: 0.45,
    right: -125,
    bottom: -62,
    transform: [{ rotate: '-15deg' }],
  },
  mountainFront: {
    position: 'absolute',
    width: 330,
    height: 150,
    borderRadius: 66,
    backgroundColor: colors.olive500,
    opacity: 0.28,
    left: -120,
    bottom: -72,
    transform: [{ rotate: '17deg' }],
  },
  path: {
    position: 'absolute',
    width: 46,
    height: 150,
    borderRadius: 28,
    backgroundColor: colors.limestone,
    opacity: 0.18,
    left: '47%',
    bottom: -94,
    transform: [{ rotate: '18deg' }],
  },
  brandWrap: {
    alignItems: 'center',
    marginTop: -40,
  },
  name: {
    marginTop: spacing[20],
    color: colors.white,
    fontSize: 31,
    lineHeight: 36,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  location: {
    marginTop: spacing[8],
    color: colors.limestone,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 3.2,
  },
  loadingWrap: {
    position: 'absolute',
    bottom: 142,
    alignItems: 'center',
    gap: spacing[12],
  },
  loading: {
    color: colors.limestone,
    fontSize: 12,
    letterSpacing: 0.3,
  },
  footer: {
    position: 'absolute',
    bottom: 42,
    color: colors.limestone,
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 1.5,
  },
});
