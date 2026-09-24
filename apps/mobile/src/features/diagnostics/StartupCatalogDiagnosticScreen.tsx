import { startupBreadcrumb } from './startup-breadcrumbs';
import { startupDiagnosticVariant } from './startup-diagnostic-variant';
import { StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export function StartupCatalogDiagnosticScreen() {
  // This require is intentionally inside the screen: variant A never evaluates
  // the runtime catalog, while variant B tests catalog initialization in isolation.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { getRuntimeRoutes } = require('../qa/qa-harness') as typeof import('../qa/qa-harness');
  const routeCount = getRuntimeRoutes().length;
  startupBreadcrumb('home-mounted');

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.card}>
        <Text style={styles.eyebrow}>MÁGINA AVENTURA · DIAGNÓSTICO</Text>
        <Text style={styles.title}>CATÁLOGO OK</Text>
        <Text style={styles.body}>
          Variante startup-test-{startupDiagnosticVariant}. Catálogo evaluado; mapas, ficha y aventura no se cargan.
        </Text>
        <Text style={styles.phase}>Rutas cargadas: {routeCount}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#FAF9F6' },
  card: { flex: 1, justifyContent: 'center', padding: 24 },
  eyebrow: { color: '#58734B', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#2F4A2E', fontSize: 32, fontWeight: '900', marginTop: 12 },
  body: { color: '#66705F', fontSize: 16, lineHeight: 24, marginTop: 16 },
  phase: { color: '#2F4A2E', fontSize: 13, fontWeight: '800', marginTop: 24 },
});
