import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing, typography } from '../../theme/tokens';

interface HeroTerritoryProps {
  kicker: string;
  title: string;
  body: string;
  style?: ViewStyle;
}

export function HeroTerritory({ kicker, title, body, style }: HeroTerritoryProps) {
  return (
    <View style={[styles.hero, style]}>
      <View style={styles.sun} />
      <View style={styles.mountainBack} />
      <View style={styles.mountainFront} />
      <View style={styles.heroCopy}>
        <Text style={styles.heroKicker}>{kicker.toUpperCase()}</Text>
        <Text style={styles.heroTitle}>{title}</Text>
        <Text style={styles.heroBody}>{body}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: {
    height: 280,
    overflow: 'hidden',
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    padding: spacing[24],
    justifyContent: 'flex-end',
  },
  sun: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.aoveGold,
    opacity: 0.9,
    right: 28,
    top: 30,
  },
  mountainBack: {
    position: 'absolute',
    width: 340,
    height: 170,
    backgroundColor: colors.olive700,
    transform: [{ rotate: '20deg' }],
    right: -120,
    bottom: -75,
    borderRadius: 48,
  },
  mountainFront: {
    position: 'absolute',
    width: 300,
    height: 130,
    backgroundColor: colors.olive500,
    opacity: 0.82,
    transform: [{ rotate: '-12deg' }],
    left: -100,
    bottom: -65,
    borderRadius: 44,
  },
  heroCopy: { maxWidth: 300 },
  heroKicker: { color: colors.aoveGold, fontSize: 11, fontWeight: '900', letterSpacing: 1.7, marginBottom: spacing[8] },
  heroTitle: { color: colors.white, fontSize: typography.display, fontWeight: '900', lineHeight: 35 },
  heroBody: { color: colors.limestone, fontSize: 14, lineHeight: 20, marginTop: spacing[12], maxWidth: 270 },
});
