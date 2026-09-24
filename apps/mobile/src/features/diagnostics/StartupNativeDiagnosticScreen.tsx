import { StyleSheet, Text, View } from 'react-native';

export function StartupNativeDiagnosticScreen() {
  return (
    <View style={styles.root}>
      <Text style={styles.eyebrow}>MÁGINA AVENTURA · STARTUP TEST D</Text>
      <Text style={styles.title}>ARRANQUE NATIVO OK</Text>
      <Text style={styles.body}>Root Android + React Native básico, sin SafeArea, catálogo, mapas ni recuperación.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#FAF9F6', justifyContent: 'center', padding: 24 },
  eyebrow: { color: '#58734B', fontSize: 11, fontWeight: '900', letterSpacing: 1.1 },
  title: { color: '#2F4A2E', fontSize: 30, fontWeight: '900', marginTop: 12 },
  body: { color: '#66705F', fontSize: 16, lineHeight: 24, marginTop: 16 },
});
