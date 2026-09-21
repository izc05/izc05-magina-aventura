import { StyleSheet, Text, View } from 'react-native';

import { getQaBuildInfo } from './qa-harness';
import { colors, radius, spacing } from '../../theme/tokens';

export function QaHarnessCard() {
  const build = getQaBuildInfo();
  if (!build) return null;

  const shortCommit = build.commitSha.length > 12
    ? build.commitSha.slice(0, 12)
    : build.commitSha;

  return (
    <View style={styles.card} accessibilityLabel="QA TEST DATA build information">
      <Text style={styles.eyebrow}>QA ONLY · TEST DATA</Text>
      <Text style={styles.title}>Adventure Engine v2 harness</Text>
      <Text style={styles.body}>
        Ruta sintética aislada para validar checkpoints, recovery y finalización.
      </Text>
      <View style={styles.metadata}>
        <Text style={styles.metadataText}>Build: {build.buildType}</Text>
        <Text style={styles.metadataText}>Versión: {build.version}</Text>
        <Text style={styles.metadataText}>Commit: {shortCommit}</Text>
        {build.workflowRun ? <Text style={styles.metadataText}>CI: {build.workflowRun}</Text> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing[20],
    borderRadius: radius.lg,
    backgroundColor: colors.goldWash,
    borderWidth: 1,
    borderColor: colors.aoveGold,
    padding: spacing[16],
  },
  eyebrow: { color: colors.earth, fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  title: { color: colors.ink, fontSize: 17, fontWeight: '900', marginTop: spacing[4] },
  body: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: spacing[4] },
  metadata: { marginTop: spacing[12], gap: 2 },
  metadataText: { color: colors.earth, fontSize: 10, fontWeight: '800' },
});
