import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { difficultyLabel } from '../../features/routes/route-utils';
import { colors, radius, spacing } from '../../theme/tokens';
import { RouteDifficulty } from '@magina-aventura/contracts';

interface DifficultyChipProps {
  difficulty: RouteDifficulty;
}

export function DifficultyChip({ difficulty }: DifficultyChipProps) {
  // We can customize colors based on difficulty later, for now we use the design doc default
  return (
    <View style={styles.difficultyBadge}>
      <Text style={styles.difficultyText}>{difficultyLabel(difficulty)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  difficultyBadge: {
    borderRadius: radius.pill,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    alignSelf: 'flex-start',
  },
  difficultyText: { color: colors.olive900, fontSize: 12, fontWeight: '900' },
});
