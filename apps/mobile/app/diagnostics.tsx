import * as Clipboard from 'expo-clipboard';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  formatDiagnostics,
  requestLocationPermission,
  runDiagnostics,
  type DiagnosticItem,
  type DiagnosticsReport,
} from '../src/features/diagnostics/diagnostics';
import { colors, radius, shadow, spacing, typography } from '../src/theme/tokens';

const fallbackReport = (): DiagnosticsReport => ({
  appVersion: 'desconocida',
  buildVersionCode: 'no disponible',
  checkedAt: new Date().toISOString(),
  items: [{
    id: 'screen',
    label: 'Comprobaciones',
    status: 'error',
    detail: 'No se pudieron completar las comprobaciones. Pulsa Reintentar.',
  }],
});

export default function DiagnosticsScreen() {
  const [report, setReport] = useState<DiagnosticsReport | null>(null);
  const [checking, setChecking] = useState(true);
  const [copyLabel, setCopyLabel] = useState('Copiar diagnóstico técnico');
  const [requestingPermission, setRequestingPermission] = useState(false);

  const refresh = useCallback(async () => {
    setChecking(true);
    try {
      setReport(await runDiagnostics());
    } catch {
      setReport(fallbackReport());
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const requestPermission = async () => {
    setRequestingPermission(true);
    try {
      await requestLocationPermission();
      await refresh();
    } finally {
      setRequestingPermission(false);
    }
  };

  const copyDiagnostics = async () => {
    if (!report) return;
    try {
      await Clipboard.setStringAsync(formatDiagnostics(report));
      setCopyLabel('Diagnóstico copiado');
      setTimeout(() => setCopyLabel('Copiar diagnóstico técnico'), 2200);
    } catch {
      setCopyLabel('No se pudo copiar');
      setTimeout(() => setCopyLabel('Copiar diagnóstico técnico'), 2200);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Pressable accessibilityRole="button" accessibilityLabel="Volver" onPress={() => router.back()} style={styles.backButton}>
            <Text style={styles.backText}>‹</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>AYUDA PARA BETA</Text>
            <Text style={styles.title}>Diagnóstico</Text>
            <Text style={styles.subtitle}>Estado actual de Mágina Aventura</Text>
          </View>
        </View>

        <View style={styles.versionCard}>
          <View>
            <Text style={styles.cardEyebrow}>VERSIÓN DE LA APP</Text>
            <Text style={styles.version}>{report?.appVersion ?? '…'}</Text>
          </View>
          <View style={styles.buildBox}>
            <Text style={styles.cardEyebrow}>BUILD / CODE</Text>
            <Text style={styles.build}>{report?.buildVersionCode ?? '…'}</Text>
          </View>
        </View>

        <View style={styles.sectionHeader}>
          <View>
            <Text style={styles.sectionTitle}>Comprobaciones</Text>
            <Text style={styles.sectionSubtitle}>
              {checking ? 'Comprobando el dispositivo…' : 'Última revisión completada'}
            </Text>
          </View>
          {checking ? <ActivityIndicator color={colors.olive900} /> : null}
        </View>

        <View style={styles.checksCard}>
          {(report?.items ?? []).map((item) => <DiagnosticRow key={item.id} item={item} />)}
          {!report ? <Text style={styles.loadingText}>Preparando comprobaciones…</Text> : null}
        </View>

        {report?.items.some((item) => item.id === 'location-permission' && item.status !== 'ok') ? (
          <Pressable
            accessibilityRole="button"
            disabled={requestingPermission}
            onPress={() => void requestPermission()}
            style={({ pressed }) => [styles.permissionButton, pressed && styles.buttonPressed]}
          >
            <Text style={styles.permissionButtonText}>
              {requestingPermission ? 'Solicitando permiso…' : 'Solicitar permiso de ubicación'}
            </Text>
          </Pressable>
        ) : null}

        <View style={styles.actions}>
          <Pressable accessibilityRole="button" onPress={() => void refresh()} disabled={checking} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Reintentar comprobaciones</Text>
          </Pressable>
          <Pressable accessibilityRole="button" onPress={() => void copyDiagnostics()} disabled={!report} style={styles.copyButton}>
            <Text style={styles.copyButtonText}>{copyLabel}</Text>
          </Pressable>
        </View>

        <Text style={styles.note}>
          Si ves un error, copia el diagnóstico y compártelo con el equipo de pruebas. Esta pantalla no modifica tus rutas ni tu aventura.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function DiagnosticRow({ item }: { item: DiagnosticItem }) {
  const color = item.status === 'ok' ? colors.olive900 : item.status === 'warning' ? colors.earth : '#A23B32';
  const mark = item.status === 'ok' ? '✓' : item.status === 'warning' ? '!' : '×';
  return (
    <View style={styles.row}>
      <View style={[styles.statusMark, { backgroundColor: color }]}><Text style={styles.statusMarkText}>{mark}</Text></View>
      <View style={styles.rowCopy}>
        <Text style={styles.rowLabel}>{item.label}</Text>
        <Text style={styles.rowDetail}>{item.detail}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { padding: spacing[20], paddingBottom: spacing[40] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[24] },
  backButton: { width: 44, height: 44, borderRadius: radius.pill, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  backText: { color: colors.olive900, fontSize: 34, lineHeight: 36, marginTop: -4 },
  headerCopy: { marginLeft: spacing[12] },
  eyebrow: { color: colors.aoveGold, fontSize: 10, fontWeight: '900', letterSpacing: 1.5 },
  title: { color: colors.ink, fontSize: typography.title, fontWeight: '900', marginTop: 2 },
  subtitle: { color: colors.muted, fontSize: typography.caption, marginTop: 2 },
  versionCard: { backgroundColor: colors.olive900, borderRadius: radius.lg, padding: spacing[20], flexDirection: 'row', justifyContent: 'space-between', ...shadow.card },
  cardEyebrow: { color: colors.limestone, fontSize: 9, fontWeight: '900', letterSpacing: 1.2 },
  version: { color: colors.white, fontSize: 30, fontWeight: '900', marginTop: 4 },
  buildBox: { alignItems: 'flex-end', justifyContent: 'center' },
  build: { color: colors.aoveGold, fontSize: typography.body, fontWeight: '900', marginTop: 4 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing[28], marginBottom: spacing[12] },
  sectionTitle: { color: colors.ink, fontSize: typography.section, fontWeight: '900' },
  sectionSubtitle: { color: colors.muted, fontSize: typography.caption, marginTop: 3 },
  checksCard: { backgroundColor: colors.white, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingHorizontal: spacing[16], ...shadow.card },
  row: { flexDirection: 'row', alignItems: 'flex-start', paddingVertical: spacing[16], borderBottomWidth: 1, borderBottomColor: colors.border },
  rowCopy: { flex: 1, marginLeft: spacing[12] },
  rowLabel: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  rowDetail: { color: colors.muted, fontSize: 12, lineHeight: 17, marginTop: 3 },
  statusMark: { width: 23, height: 23, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  statusMarkText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  loadingText: { color: colors.muted, paddingVertical: spacing[20] },
  permissionButton: { marginTop: spacing[16], padding: spacing[16], borderRadius: radius.md, backgroundColor: colors.goldWash, borderWidth: 1, borderColor: colors.aoveGold, alignItems: 'center' },
  permissionButtonText: { color: colors.earth, fontWeight: '900', fontSize: 13 },
  actions: { gap: spacing[10], marginTop: spacing[16] },
  secondaryButton: { padding: spacing[16], borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center' },
  secondaryButtonText: { color: colors.white, fontWeight: '900', fontSize: 13 },
  copyButton: { padding: spacing[16], borderRadius: radius.md, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center' },
  copyButtonText: { color: colors.olive900, fontWeight: '900', fontSize: 13 },
  buttonPressed: { opacity: 0.75 },
  note: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: spacing[20] },
});
