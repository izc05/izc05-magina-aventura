import { Pressable, StyleSheet, Text, View } from 'react-native';

import { municipalRouteInformationViewModel } from '../../features/routes/municipal-route-information';
import { colors, radius, spacing } from '../../theme/tokens';

interface MunicipalRouteInformationCardProps {
  onPress: () => void;
}

export function MunicipalRouteInformationCard({
  onPress,
}: MunicipalRouteInformationCardProps) {
  const information = municipalRouteInformationViewModel();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Abrir ficha QA de ${information.title}`}
      accessibilityHint="Abre la ficha informativa con fuentes municipales y comunitarias."
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>{information.qaLabel}</Text>
        <Text style={styles.badge}>{information.traceStatus.toUpperCase()}</Text>
      </View>
      <Text style={styles.title}>{information.title}</Text>
      <Text style={styles.municipality}>{information.municipality}</Text>
      <View style={styles.endpointPreview}>
        <Text style={styles.endpointText}>{information.endpoints[0]}</Text>
        <Text style={styles.endpointArrow}>↕</Text>
        <Text style={styles.endpointText}>{information.endpoints[1]}</Text>
      </View>
      <Text style={styles.status}>{information.statusLabel}</Text>
      <Text style={styles.body}>Datos municipales y referencias comunitarias claramente separados · sin navegación GPS</Text>
      <View style={styles.actionRow}>
        <Text style={styles.action}>Abrir ficha completa</Text>
        <Text style={styles.actionArrow}>→</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    marginTop: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing[20],
  },
  header: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing[8],
  },
  eyebrow: { color: colors.olive700, fontSize: 10, fontWeight: '900', letterSpacing: 1.1 },
  badge: {
    color: colors.white,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    fontSize: 9,
    fontWeight: '900',
  },
  title: { color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '900', marginTop: spacing[12] },
  municipality: { color: colors.muted, fontSize: 12, marginTop: spacing[4] },
  endpointPreview: { marginTop: spacing[12], padding: spacing[12], borderRadius: radius.md, backgroundColor: colors.limestone },
  endpointText: { color: colors.ink, fontSize: 11, lineHeight: 16, fontWeight: '800' },
  endpointArrow: { color: colors.olive700, fontSize: 17, fontWeight: '900', marginVertical: spacing[4] },
  status: { color: colors.olive700, fontSize: 11, fontWeight: '800', marginTop: spacing[12] },
  body: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
  actionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[16] },
  action: { color: colors.olive900, fontSize: 13, fontWeight: '900' },
  actionArrow: { color: colors.olive900, fontSize: 18, fontWeight: '900' },
});
