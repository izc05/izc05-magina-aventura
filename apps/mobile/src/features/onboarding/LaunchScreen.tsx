import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '../../components/branding/BrandMark';
import { brand } from '../../theme/branding';
import { colors, spacing } from '../../theme/tokens';

export function LaunchScreen() {
  return (
    <View style={styles.screen}>
      <View style={styles.glowTop} />
      <View style={styles.brandWrap}>
        <BrandMark size={136} framed inverse />
        <Text style={styles.name}>{brand.name}</Text>
        <Text style={styles.location}>{brand.location.toUpperCase()}</Text>
      </View>

      <View style={styles.loadingWrap}>
        <ActivityIndicator color={colors.aoveGold} size="small" />
        <Text style={styles.loading}>Cargando aventuras…</Text>
      </View>

      <View style={styles.footerBranch} />
      <View style={[styles.footerLeaf, styles.footerLeafOne]} />
      <View style={[styles.footerLeaf, styles.footerLeafTwo]} />
      <View style={[styles.footerLeaf, styles.footerLeafThree]} />
      <Text style={styles.footer}>LA NATURALEZA TAMBIÉN TE CAMBIA</Text>
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
    width: 320,
    height: 320,
    borderRadius: 160,
    backgroundColor: colors.olive700,
    opacity: 0.28,
    top: -170,
    right: -120,
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
    bottom: 150,
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
    letterSpacing: 2.1,
  },
  footerBranch: {
    position: 'absolute',
    width: 180,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.olive700,
    left: -35,
    bottom: 58,
    transform: [{ rotate: '-18deg' }],
    opacity: 0.7,
  },
  footerLeaf: {
    position: 'absolute',
    width: 58,
    height: 20,
    borderRadius: 30,
    backgroundColor: colors.olive700,
    opacity: 0.65,
  },
  footerLeafOne: {
    left: 1,
    bottom: 70,
    transform: [{ rotate: '18deg' }],
  },
  footerLeafTwo: {
    left: 45,
    bottom: 42,
    transform: [{ rotate: '-27deg' }],
  },
  footerLeafThree: {
    left: 92,
    bottom: 78,
    transform: [{ rotate: '4deg' }],
  },
});
