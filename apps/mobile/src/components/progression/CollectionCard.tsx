import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../../theme/tokens';

interface CollectionCardProps {
  emoji: string;
  name: string;
  family: string;
  collected?: boolean;
}

export function CollectionCard({ emoji, name, family, collected = true }: CollectionCardProps) {
  return (
    <View style={[styles.card, !collected && styles.cardUncollected]}>
      <View style={styles.iconContainer}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <View style={styles.content}>
        <Text style={[styles.name, !collected && styles.textUncollected]} numberOfLines={1}>
          {collected ? name : '???'}
        </Text>
        <Text style={styles.family}>{family}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing[8],
    marginBottom: spacing[8],
    width: '48%', // For a 2-column grid
  },
  cardUncollected: {
    backgroundColor: colors.warmBackground,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.limestone,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[8],
  },
  emoji: {
    fontSize: 20,
  },
  content: {
    flex: 1,
  },
  name: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  textUncollected: {
    color: colors.muted,
  },
  family: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '700',
    marginTop: 2,
  },
});
