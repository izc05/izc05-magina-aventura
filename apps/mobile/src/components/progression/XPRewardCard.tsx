import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

interface XPRewardCardProps {
  xp: number;
  reason: string;
}

export function XPRewardCard({ xp, reason }: XPRewardCardProps) {
  return (
    <View style={styles.card}>
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>✨</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.reason}>{reason}</Text>
        <Text style={styles.xpText}>+{xp} XP</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.olive900,
    borderRadius: radius.md,
    padding: spacing[12],
    marginBottom: spacing[8],
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[12],
  },
  icon: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reason: {
    color: colors.white,
    fontSize: 14,
    fontWeight: '700',
  },
  xpText: {
    color: colors.aoveGold,
    fontSize: 16,
    fontWeight: '900',
  },
});
