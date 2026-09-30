import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../src/theme/tokens';
import { useAuth } from '../src/context/AuthContext';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.push('/')}>
            <Text style={styles.backButtonText}>← Inicio</Text>
          </Pressable>
          <Text style={styles.title}>Pasaporte</Text>
        </View>

        <View style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user?.email?.[0]?.toUpperCase() ?? 'A'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.email?.split('@')[0] ?? 'Aventurero'}</Text>
            </View>
            <Pressable onPress={signOut} style={styles.logoutButton}>
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>

          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>Aún no hay progreso registrado</Text>
            <Text style={styles.emptyStateBody}>
              Aquí aparecerán tus rutas completadas, descubrimientos e insignias cuando se registren.
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  scrollContent: { padding: spacing[20] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[24], paddingTop: spacing[8] },
  backButton: { marginRight: spacing[16], padding: spacing[8], paddingLeft: 0 },
  backButtonText: { color: colors.olive900, fontSize: 16, fontWeight: '700' },
  title: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  passportCard: {
    backgroundColor: colors.olive900,
    borderRadius: radius.lg,
    padding: spacing[24],
    marginBottom: spacing[32],
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  passportHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[24] },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.aoveGold,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[16],
    borderWidth: 2,
    borderColor: colors.white,
  },
  avatarText: { color: colors.ink, fontSize: 24, fontWeight: '900' },
  userInfo: { flex: 1 },
  userName: { color: colors.white, fontSize: 20, fontWeight: '900' },
  emptyState: {
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: spacing[16],
  },
  emptyStateTitle: { color: colors.white, fontSize: 16, fontWeight: '800' },
  emptyStateBody: { color: colors.limestone, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  logoutText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
