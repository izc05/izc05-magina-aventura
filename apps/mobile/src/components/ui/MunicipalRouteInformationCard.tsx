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
      accessibilityLabel={`Abrir ficha informativa de ${information.title}`}
      style={styles.card}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>INFORMACIÓN MUNICIPAL</Text>
        <Text style={styles.badge}>SIN NAVEGACIÓN GPS</Text>
      </View>
      <Text style={styles.title}>{information.title}</Text>
      <Text style={styles.municipality}>{information.municipality}</Text>
      <Text style={styles.status}>{information.statusLabel}</Text>
      <Text style={styles.body}>Información disponible · ruta en preparación para GPS</Text>
      <Text style={styles.action}>Abrir ficha informativa →</Text>
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
  eyebrow: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  badge: {
    color: colors.white,
    backgroundColor: colors.olive900,
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: radius.pill,
    fontSize: 9,
    fontWeight: '900',
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
    marginTop: spacing[12],
  },
  municipality: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing[4],
  },
  status: {
    color: colors.olive700,
    fontSize: 11,
    fontWeight: '800',
    marginTop: spacing[16],
  },
  body: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[4],
  },
  action: {
    color: colors.olive900,
    fontSize: 13,
    fontWeight: '900',
    marginTop: spacing[16],
  },
});
