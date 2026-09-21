import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { QaTestPositionKey } from './qa-harness';
import { colors, radius, spacing } from '../../theme/tokens';

type QaSimulationPanelProps = Readonly<{
  onEmit(position: QaTestPositionKey): void;
}>;

const controls: ReadonlyArray<Readonly<{ label: string; position: QaTestPositionKey }>> = [
  { label: 'CP1', position: 'checkpoint1' },
  { label: 'CP2', position: 'checkpoint2' },
  { label: 'DISC', position: 'discovery' },
  { label: 'CP3', position: 'checkpoint3' },
];

export function QaSimulationPanel({ onEmit }: QaSimulationPanelProps) {
  return (
    <View style={styles.panel}>
      <Text style={styles.title}>QA · SIMULADOR TEST DATA</Text>
      <View style={styles.row}>
        {controls.map((control) => (
          <Pressable
            key={control.position}
            style={styles.button}
            onPress={() => onEmit(control.position)}
          >
            <Text style={styles.buttonText}>{control.label}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing[12],
    paddingTop: spacing[10],
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  title: { color: colors.earth, fontSize: 9, fontWeight: '900', letterSpacing: 0.8 },
  row: { flexDirection: 'row', gap: spacing[4], marginTop: spacing[8] },
  button: {
    flex: 1,
    minHeight: 34,
    borderRadius: radius.sm,
    backgroundColor: colors.goldWash,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: { color: colors.earth, fontSize: 10, fontWeight: '900' },
});
