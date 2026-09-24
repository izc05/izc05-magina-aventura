import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppHeader } from '../src/components/branding/AppHeader';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

export type ActivityHistoryState =
  | 'SYNC_PENDING'
  | 'VALIDATING'
  | 'VERIFIED'
  | 'FLAGGED'
  | 'REJECTED';

export interface ActivityHistoryItem {
  id: string;
  routeName: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  state: ActivityHistoryState;
}

const HISTORY_STATE_COPY: Record<ActivityHistoryState, { label: string; color: string; bg: string }> = {
  SYNC_PENDING: { label: 'Sincronización pendiente', color: '#B45309', bg: '#FEF3C7' },
  VALIDATING: { label: 'En validación', color: '#1D4ED8', bg: '#DBEAFE' },
  VERIFIED: { label: 'Verificada', color: '#15803D', bg: '#DCFCE7' },
  FLAGGED: { label: 'Bajo revisión', color: '#C2410C', bg: '#FFEDD5' },
  REJECTED: { label: 'Rechazada', color: '#B91C1C', bg: '#FEE2E2' },
};

export function renderHistoryStateBadge(state: ActivityHistoryState) {
  const config = HISTORY_STATE_COPY[state];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <Text style={[styles.badgeText, { color: config.color }]}>{config.label}</Text>
    </View>
  );
}

export default function HistoryScreen() {
  const router = useRouter();

  const historyItems: ActivityHistoryItem[] = [];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <AppHeader />
        <View style={styles.headerRow}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backButtonText}>← Volver</Text>
          </Pressable>
        </View>

        <View style={styles.header}>
          <Text style={styles.title}>Historial de Aventuras</Text>
          <Text style={styles.subtitle}>
            Registro completo de tus rutas grabadas con su estado de sincronización y validación oficial.
          </Text>
        </View>

        {historyItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyTitle}>Sin actividades grabadas</Text>
            <Text style={styles.emptyText}>
              Inicia una ruta desde la pantalla de preparación para grabar tu primera aventura en Sierra Mágina.
            </Text>
          </View>
        ) : (
          historyItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <Text style={styles.itemName}>{item.routeName}</Text>
                {renderHistoryStateBadge(item.state)}
              </View>
              <Text style={styles.itemDate}>{item.date}</Text>
              <View style={styles.itemMetrics}>
                <Text style={styles.metricText}>{item.distanceKm.toFixed(1)} km</Text>
                <Text style={styles.metricDot}>·</Text>
                <Text style={styles.metricText}>{item.durationMinutes} min</Text>
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  content: {
    padding: spacing[20],
    paddingBottom: 40,
  },
  headerRow: {
    marginBottom: spacing[16],
  },
  backButton: {
    alignSelf: 'flex-start',
    paddingVertical: spacing[8],
    paddingHorizontal: spacing[12],
    borderRadius: radius.md,
    backgroundColor: colors.white,
  },
  backButtonText: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.olive900,
  },
  header: {
    marginBottom: spacing[24],
  },
  title: {
    fontSize: typography.title,
    fontWeight: '700',
    color: colors.olive900,
    marginBottom: spacing[8],
  },
  subtitle: {
    fontSize: typography.body,
    color: colors.muted,
    lineHeight: 22,
  },
  emptyCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    padding: spacing[24],
    alignItems: 'center',
    ...shadow.card,
  },
  emptyTitle: {
    fontSize: typography.section,
    fontWeight: '700',
    color: colors.ink,
    marginBottom: spacing[8],
  },
  emptyText: {
    fontSize: typography.body,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
  },
  itemCard: {
    backgroundColor: colors.white,
    borderRadius: radius.md,
    padding: spacing[16],
    marginBottom: spacing[16],
    ...shadow.card,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: typography.body,
    fontWeight: '700',
    color: colors.ink,
  },
  itemDate: {
    fontSize: typography.caption,
    color: colors.muted,
    marginBottom: spacing[8],
  },
  itemMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricText: {
    fontSize: typography.caption,
    fontWeight: '500',
    color: colors.olive900,
  },
  metricDot: {
    fontSize: typography.caption,
    color: colors.muted,
    marginHorizontal: spacing[8],
  },
  badge: {
    paddingHorizontal: spacing[12],
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  badgeText: {
    fontSize: typography.caption,
    fontWeight: '700',
  },
});
