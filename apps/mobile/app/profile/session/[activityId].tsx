import { useEffect, useMemo, useRef, useState } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { buildPassportGpsTrace } from '../../../src/activity/passport-gps-trace';
import { sqliteActivityStore } from '../../../src/activity/sqlite-activity-store';
import { useAuth } from '../../../src/context/AuthContext';
import { PassportGpsSessionDetailPanel, type PassportGpsSessionDetailState } from '../../../src/features/passport/PassportGpsSessionDetailPanel';
import { colors, radius, spacing } from '../../../src/theme/tokens';

interface OwnedDetailState {
  ownerId: string;
  activityId: string;
  state: PassportGpsSessionDetailState;
}

export default function PassportGpsSessionScreen() {
  const router = useRouter();
  const { activityId: rawActivityId } = useLocalSearchParams<{ activityId?: string | string[] }>();
  const activityId = typeof rawActivityId === 'string' ? rawActivityId.trim() : '';
  const { user, isLoading } = useAuth();
  const [ownedState, setOwnedState] = useState<OwnedDetailState | null>(null);
  const [mapGrant, setMapGrant] = useState<{ ownerId: string; activityId: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const currentUserIdRef = useRef<string | null>(user?.id ?? null);
  const deletionInProgressRef = useRef(false);
  currentUserIdRef.current = user?.id ?? null;

  useEffect(() => {
    setMapGrant(null);
    deletionInProgressRef.current = false;
    setIsDeleting(false);
    if (isLoading || !user) {
      setOwnedState(null);
      return;
    }

    const ownerId = user.id;
    if (!activityId) {
      setOwnedState({ ownerId, activityId, state: { status: 'not-found' } });
      return;
    }

    let mounted = true;
    setOwnedState({ ownerId, activityId, state: { status: 'loading' } });
    void sqliteActivityStore.loadPassportGpsSessionDetail(ownerId, activityId)
      .then((data) => {
        if (mounted) setOwnedState({
          ownerId,
          activityId,
          state: data ? { status: 'ready', data } : { status: 'not-found' },
        });
      })
      .catch(() => {
        if (mounted) setOwnedState({ ownerId, activityId, state: { status: 'error' } });
      });

    return () => {
      mounted = false;
    };
  }, [isLoading, user?.id, activityId]);

  const state = user && ownedState?.ownerId === user.id && ownedState.activityId === activityId
    ? ownedState.state
    : { status: 'loading' as const };
  const trace = useMemo(
    () => state.status === 'ready' ? buildPassportGpsTrace(state.data.samples) : null,
    [state],
  );
  const isMapVisible = Boolean(user && mapGrant?.ownerId === user.id && mapGrant.activityId === activityId);

  const toggleMap = () => {
    if (!user || !activityId) return;
    if (isMapVisible) setMapGrant(null);
    else setMapGrant({ ownerId: user.id, activityId });
  };

  const requestDelete = () => {
    if (!user || state.status !== 'ready' || deletionInProgressRef.current) return;
    const ownerId = user.id;
    const targetActivityId = state.data.activityId;
    if (targetActivityId !== activityId) return;

    Alert.alert(
      '¿Eliminar esta captura GPS personal?',
      'Se borrarán solo las muestras, el snapshot final, el inbox GPS local y la cola local asociados a esta sesión. No se tocarán fotos, rutas ni otras sesiones. Esta acción no se puede deshacer.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar captura',
          style: 'destructive',
          onPress: () => {
            if (currentUserIdRef.current !== ownerId || deletionInProgressRef.current) return;
            deletionInProgressRef.current = true;
            setIsDeleting(true);
            void sqliteActivityStore.deletePassportGpsSession(ownerId, targetActivityId)
              .then((deleted) => {
                if (deleted) {
                  router.replace('/profile');
                  return;
                }
                deletionInProgressRef.current = false;
                setIsDeleting(false);
                Alert.alert('No se ha eliminado la captura', 'No se pudo verificar la propiedad de esta sesión; los datos se han conservado.');
              })
              .catch(() => {
                deletionInProgressRef.current = false;
                setIsDeleting(false);
                Alert.alert('No se ha eliminado la captura', 'Se produjo un error local y los datos se han conservado.');
              });
          },
        },
      ],
    );
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.gate}>
          <ActivityIndicator color={colors.olive700} />
          <Text accessibilityRole="header" style={styles.title}>Comprobando tu sesión…</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar style="dark" />
        <View style={styles.gate}>
          <Text accessibilityRole="header" style={styles.title}>Detalle personal protegido</Text>
          <Text style={styles.body}>
            Inicia sesión para consultar tus capturas GPS. Los datos privados de ubicación no se muestran a visitantes.
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Iniciar sesión para consultar el Pasaporte personal"
            style={styles.primaryButton}
            onPress={() => router.push({ pathname: '/login', params: { returnTo: 'passport' } })}
          >
            <Text style={styles.primaryButtonText}>Iniciar sesión</Text>
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
            accessibilityLabel="Volver al Pasaporte"
            style={styles.backButton}
            onPress={() => router.replace('/profile')}
          >
            <Text style={styles.backButtonText}>← Pasaporte</Text>
          </Pressable>
          <Text accessibilityRole="header" style={styles.pageTitle}>Captura GPS</Text>
        </View>
        <View style={styles.card}>
          <PassportGpsSessionDetailPanel
            state={state}
            trace={trace}
            isMapVisible={isMapVisible}
            isDeleting={isDeleting}
            onToggleMap={toggleMap}
            onRequestDelete={requestDelete}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.limestone },
  scrollContent: { padding: spacing[20] },
  header: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing[16], paddingTop: spacing[8] },
  backButton: { marginRight: spacing[12], paddingVertical: spacing[8], paddingRight: spacing[8] },
  backButtonText: { color: colors.olive900, fontSize: 14, fontWeight: '800' },
  pageTitle: { color: colors.ink, fontSize: 22, fontWeight: '900' },
  card: { backgroundColor: colors.olive900, borderRadius: radius.lg, padding: spacing[20] },
  gate: { flex: 1, padding: spacing[24], alignItems: 'center', justifyContent: 'center', gap: spacing[12] },
  title: { color: colors.olive900, fontSize: 23, fontWeight: '900', textAlign: 'center' },
  body: { color: colors.ink, fontSize: 15, lineHeight: 22, textAlign: 'center', marginTop: spacing[8] },
  primaryButton: { minHeight: 52, width: '100%', marginTop: spacing[12], borderRadius: radius.md, backgroundColor: colors.olive900, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing[16] },
  primaryButtonText: { color: colors.white, fontSize: 15, fontWeight: '900' },
});
