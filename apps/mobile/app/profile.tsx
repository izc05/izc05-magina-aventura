import { useEffect, useState } from 'react';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../src/theme/tokens';
import { useAuth } from '../src/context/AuthContext';
import { sqliteActivityStore } from '../src/activity/sqlite-activity-store';
import {
  PassportGpsMetricsPanel,
  type PassportGpsLoadState,
} from '../src/features/passport/PassportGpsMetricsPanel';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isLoading, signOut } = useAuth();
  const [passportGpsState, setPassportGpsState] = useState<PassportGpsLoadState>({
    status: 'loading',
  });

  useEffect(() => {
    if (isLoading || !user) {
      setPassportGpsState({ status: 'loading' });
      return;
    }

    let mounted = true;
    void sqliteActivityStore.loadPassportGpsData(user.id)
      .then((data) => {
        if (mounted) setPassportGpsState({ status: 'ready', data });
      })
      .catch(() => {
        if (mounted) setPassportGpsState({ status: 'error' });
      });

    return () => {
      mounted = false;
    };
  }, [isLoading, user?.id]);

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.gate}>
          <ActivityIndicator color={colors.olive700} />
          <Text accessibilityRole="header" style={styles.gateTitle}>Comprobando tu sesión…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.gate}>
          <Text accessibilityRole="header" style={styles.gateTitle}>Tu pasaporte personal</Text>
          <Text style={styles.gateBody}>
            Inicia sesión o crea una cuenta para guardar y consultar tu pasaporte y tus datos personales. Las rutas públicas siguen disponibles sin cuenta.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión o registrarse para guardar el pasaporte"
            style={styles.loginButton}
            onPress={() => router.push({ pathname: '/login', params: { returnTo: 'passport' } })}
          >
            <Text style={styles.loginButtonText}>Iniciar sesión o registrarse</Text>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Explorar sin cuenta"
            style={styles.guestButton}
            onPress={() => router.replace('/')}
          >
            <Text style={styles.guestButtonText}>Explorar sin cuenta</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Volver al inicio"
            style={styles.backButton}
            onPress={() => router.push('/')}
          >
            <Text style={styles.backButtonText}>← Inicio</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.title}>Pasaporte</Text>
        </View>

        <View style={styles.passportCard}>
          <View style={styles.passportHeader}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{user.email?.[0]?.toUpperCase() ?? 'A'}</Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user.email?.split('@')[0] ?? 'Aventurero'}</Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar sesión"
              onPress={() => { void signOut(); }}
              style={styles.logoutButton}
            >
              <Text style={styles.logoutText}>Salir</Text>
            </Pressable>
          </View>

          <PassportGpsMetricsPanel state={passportGpsState} />
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
  gate: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center' },
  gateTitle: { color: colors.olive900, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  gateBody: { color: colors.ink, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: spacing[12] },
  loginButton: { minHeight: 52, width: '100%', marginTop: spacing[24], borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[16] },
  loginButtonText: { color: colors.white, fontSize: 15, fontWeight: '900' },
  guestButton: { minHeight: 48, width: '100%', marginTop: spacing[8], borderRadius: radius.md, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[16] },
  guestButtonText: { color: colors.olive900, fontSize: 15, fontWeight: '800', textDecorationLine: 'underline' },
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
  logoutButton: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: radius.md, backgroundColor: 'rgba(255,255,255,0.1)' },
  logoutText: { color: colors.white, fontSize: 12, fontWeight: '700' },
});
