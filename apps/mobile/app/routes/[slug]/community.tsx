import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import {
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getSupabasePublicConfig } from '../../../src/backend/supabase-config';
import {
  getCommunityMediaBaseUrl,
  resolveCommunityPhotoUrl,
} from '../../../src/features/community/community-media';
import { createPostgrestCommunityRepository } from '../../../src/features/community/postgrest-community-repository';
import { summarizeRouteCommunity } from '../../../src/features/community/community-summary';
import type { RouteCommunitySnapshot } from '../../../src/features/community/community-types';
import { getDevelopmentRouteBySlug } from '../../../src/features/routes/route-utils';
import {
  colors,
  radius,
  shadow,
  spacing,
  typography,
} from '../../../src/theme/tokens';

type CommunitySection = 'photos' | 'reviews' | 'incidents';

type CommunityScreenState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'error' }
  | { status: 'ready'; snapshot: RouteCommunitySnapshot };

const incidentLabels: Record<string, string> = {
  fallen_tree: 'Árbol caído',
  blocked_path: 'Camino cortado',
  landslide: 'Desprendimiento',
  mud: 'Barro',
  dry_water_source: 'Fuente sin agua',
  damaged_sign: 'Señal dañada',
  animal_risk: 'Riesgo con animales',
  other: 'Otro aviso',
};

function formatCommunityDate(value: string | null): string | null {
  if (!value) return null;

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;

  return new Intl.DateTimeFormat('es-ES', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export default function RouteCommunityScreen() {
  const { slug } = useLocalSearchParams<{ slug?: string }>();
  const router = useRouter();
  const route = getDevelopmentRouteBySlug(slug);
  const routeId = route?.id ?? '';
  const [section, setSection] = useState<CommunitySection>('photos');
  const [reloadKey, setReloadKey] = useState(0);
  const [state, setState] = useState<CommunityScreenState>({ status: 'loading' });

  const mediaBaseUrl = useMemo(() => {
    try {
      return getCommunityMediaBaseUrl();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    if (!routeId) return;

    let active = true;
    setState({ status: 'loading' });

    async function loadCommunity() {
      try {
        const config = getSupabasePublicConfig();
        const repository = createPostgrestCommunityRepository(config);
        const result = await repository.getRouteCommunity(routeId);

        if (!active) return;

        if (result.state === 'unavailable') {
          setState({ status: 'unavailable' });
          return;
        }

        setState({ status: 'ready', snapshot: result.snapshot });
      } catch {
        if (active) setState({ status: 'error' });
      }
    }

    void loadCommunity();

    return () => {
      active = false;
    };
  }, [reloadKey, routeId]);

  if (!route) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.centerState}>
          <Text style={styles.stateTitle}>Ruta no disponible</Text>
          <Text style={styles.stateBody}>
            No encontramos una comunidad asociada a esta ruta.
          </Text>
          <Pressable style={styles.outlineButton} onPress={() => router.replace('/')}>
            <Text style={styles.outlineButtonText}>Volver a rutas</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const summary =
    state.status === 'ready' ? summarizeRouteCommunity(state.snapshot) : null;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <Text style={styles.backText}>←</Text>
          </Pressable>
          <View style={styles.headerCopy}>
            <Text style={styles.eyebrow}>COMUNIDAD · {route.municipalityName.toUpperCase()}</Text>
            <Text style={styles.title}>{route.title}</Text>
            <Text style={styles.subtitle}>
              Fotos, opiniones y avisos aportados por senderistas.
            </Text>
          </View>
        </View>

        {state.status === 'loading' ? (
          <View style={styles.centerCard}>
            <Text style={styles.stateTitle}>Cargando comunidad…</Text>
            <Text style={styles.stateBody}>
              Consultando únicamente contenido público de esta ruta.
            </Text>
          </View>
        ) : null}

        {state.status === 'unavailable' ? (
          <View style={styles.centerCard}>
            <Text style={styles.stateTitle}>Comunidad todavía no conectada</Text>
            <Text style={styles.stateBody}>
              La app no tiene configurado el backend público necesario para consultar contenido real.
            </Text>
          </View>
        ) : null}

        {state.status === 'error' ? (
          <View style={styles.centerCard}>
            <Text style={styles.stateTitle}>No pudimos cargar la comunidad</Text>
            <Text style={styles.stateBody}>
              No mostraremos contenido de relleno. Puedes volver a intentarlo.
            </Text>
            <Pressable
              style={styles.outlineButton}
              onPress={() => setReloadKey((value) => value + 1)}
            >
              <Text style={styles.outlineButtonText}>Reintentar</Text>
            </Pressable>
          </View>
        ) : null}

        {state.status === 'ready' && summary ? (
          <>
            <View style={styles.summaryCard}>
              <View style={styles.summaryMetric}>
                <Text style={styles.summaryValue}>{summary.photoCount}</Text>
                <Text style={styles.summaryLabel}>Fotos</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryMetric}>
                <Text style={styles.summaryValue}>{summary.reviewCount}</Text>
                <Text style={styles.summaryLabel}>Opiniones</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryMetric}>
                <Text style={styles.summaryValue}>
                  {summary.averageRating === null
                    ? '—'
                    : summary.averageRating.toFixed(1)}
                </Text>
                <Text style={styles.summaryLabel}>Valoración</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryMetric}>
                <Text style={styles.summaryValue}>{summary.activeIncidentCount}</Text>
                <Text style={styles.summaryLabel}>Avisos activos</Text>
              </View>
            </View>

            <View style={styles.tabs}>
              <CommunityTab
                active={section === 'photos'}
                label="Fotos"
                onPress={() => setSection('photos')}
              />
              <CommunityTab
                active={section === 'reviews'}
                label="Opiniones"
                onPress={() => setSection('reviews')}
              />
              <CommunityTab
                active={section === 'incidents'}
                label="Avisos"
                onPress={() => setSection('incidents')}
              />
            </View>

            {section === 'photos' ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Fotos de la ruta</Text>
                <Text style={styles.sectionIntro}>
                  Imágenes compartidas por la comunidad y aprobadas para esta ruta.
                </Text>

                {state.snapshot.photos.length === 0 ? (
                  <EmptyCommunityState
                    title="Todavía no hay fotos"
                    body="Cuando haya aportaciones reales de senderistas aparecerán aquí."
                  />
                ) : (
                  <View style={styles.photoGrid}>
                    {state.snapshot.photos.map((photo) => {
                      const photoUrl = mediaBaseUrl
                        ? resolveCommunityPhotoUrl(mediaBaseUrl, photo.objectKey)
                        : null;
                      const date = formatCommunityDate(photo.takenAt ?? photo.createdAt);

                      return (
                        <View
                          key={photo.id}
                          style={[
                            styles.photoCard,
                            photo.featured ? styles.featuredPhotoCard : null,
                          ]}
                        >
                          {photoUrl ? (
                            <Image
                              source={{ uri: photoUrl }}
                              style={[
                                styles.photoImage,
                                photo.featured ? styles.featuredPhotoImage : null,
                              ]}
                              resizeMode="cover"
                            />
                          ) : (
                            <View
                              style={[
                                styles.photoPlaceholder,
                                photo.featured ? styles.featuredPhotoImage : null,
                              ]}
                            >
                              <Text style={styles.photoPlaceholderIcon}>▧</Text>
                              <Text style={styles.photoPlaceholderText}>
                                Foto de la comunidad
                              </Text>
                            </View>
                          )}
                          <View style={styles.photoCopy}>
                            {photo.featured ? (
                              <Text style={styles.featuredBadge}>DESTACADA</Text>
                            ) : null}
                            {photo.caption ? (
                              <Text style={styles.photoCaption}>{photo.caption}</Text>
                            ) : null}
                            {date ? <Text style={styles.metaText}>{date}</Text> : null}
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            ) : null}

            {section === 'reviews' ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Opiniones de senderistas</Text>
                <Text style={styles.sectionIntro}>
                  Valoraciones y conversación pública vinculadas a esta ruta.
                </Text>

                {state.snapshot.reviews.length === 0 ? (
                  <EmptyCommunityState
                    title="Todavía no hay valoraciones"
                    body="La media aparecerá cuando existan reseñas reales."
                  />
                ) : (
                  state.snapshot.reviews.map((review) => {
                    const date = formatCommunityDate(review.createdAt);
                    return (
                      <View key={review.id} style={styles.reviewCard}>
                        <View style={styles.reviewTopRow}>
                          <Text style={styles.senderLabel}>Senderista</Text>
                          <Text style={styles.ratingText}>★ {review.rating}/5</Text>
                        </View>
                        {review.body ? (
                          <Text style={styles.reviewBody}>{review.body}</Text>
                        ) : null}
                        {date ? <Text style={styles.metaText}>{date}</Text> : null}
                      </View>
                    );
                  })
                )}

                <Text style={styles.conversationTitle}>Conversación de la ruta</Text>
                {state.snapshot.comments.length === 0 ? (
                  <EmptyCommunityState
                    title="Sin comentarios todavía"
                    body="Aquí aparecerá la conversación pública cuando existan aportaciones reales."
                  />
                ) : (
                  state.snapshot.comments.map((comment) => {
                    const date = formatCommunityDate(comment.createdAt);
                    return (
                      <View key={comment.id} style={styles.commentCard}>
                        <Text style={styles.senderLabel}>Senderista</Text>
                        <Text style={styles.commentBody}>{comment.body}</Text>
                        {date ? <Text style={styles.metaText}>{date}</Text> : null}
                      </View>
                    );
                  })
                )}
              </View>
            ) : null}

            {section === 'incidents' ? (
              <View style={styles.section}>
                <View style={styles.communityNotice}>
                  <Text style={styles.communityNoticeBadge}>COMUNIDAD</Text>
                  <Text style={styles.communityNoticeText}>
                    Información aportada por senderistas. No sustituye avisos oficiales, indicaciones de emergencias ni el estado oficial de la ruta.
                  </Text>
                </View>

                {state.snapshot.incidents.length === 0 ? (
                  <EmptyCommunityState
                    title="Sin avisos comunitarios"
                    body="No hay incidencias confirmadas o resueltas visibles para esta ruta."
                  />
                ) : (
                  state.snapshot.incidents.map((incident) => {
                    const date = formatCommunityDate(incident.createdAt);
                    return (
                      <View key={incident.id} style={styles.incidentCard}>
                        <View style={styles.incidentHeader}>
                          <Text style={styles.incidentBadge}>COMUNIDAD</Text>
                          <Text style={styles.incidentStatus}>
                            {incident.status === 'resolved' ? 'Resuelto' : 'Confirmado'}
                          </Text>
                        </View>
                        <Text style={styles.incidentTitle}>
                          {incidentLabels[incident.category] ?? 'Aviso de senderista'}
                        </Text>
                        <Text style={styles.incidentBody}>{incident.description}</Text>
                        {date ? <Text style={styles.metaText}>{date}</Text> : null}
                      </View>
                    );
                  })
                )}
              </View>
            ) : null}

            <View style={styles.readOnlyCard}>
              <Text style={styles.readOnlyEyebrow}>PARTICIPAR EN LA COMUNIDAD</Text>
              <Text style={styles.readOnlyTitle}>Publicar estará disponible al iniciar sesión</Text>
              <Text style={styles.readOnlyBody}>
                Esta primera versión solo consulta contenido público real. No habilitaremos subidas o comentarios hasta conectar la sesión móvil de forma segura.
              </Text>
            </View>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function CommunityTab({
  active,
  label,
  onPress,
}: {
  active: boolean;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      style={[styles.tab, active ? styles.activeTab : null]}
      onPress={onPress}
    >
      <Text style={[styles.tabText, active ? styles.activeTabText : null]}>
        {label}
      </Text>
    </Pressable>
  );
}

function EmptyCommunityState({ title, body }: { title: string; body: string }) {
  return (
    <View style={styles.emptyCard}>
      <Text style={styles.emptyTitle}>{title}</Text>
      <Text style={styles.emptyBody}>{body}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.warmBackground },
  content: { paddingBottom: spacing[40] },
  header: {
    paddingHorizontal: spacing[20],
    paddingTop: spacing[12],
    paddingBottom: spacing[24],
    backgroundColor: colors.warmBackground,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backText: { color: colors.olive900, fontSize: 24, fontWeight: '900' },
  headerCopy: { marginTop: spacing[20] },
  eyebrow: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: spacing[4],
  },
  subtitle: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    marginTop: spacing[8],
  },
  centerState: {
    flex: 1,
    padding: spacing[24],
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerCard: {
    marginHorizontal: spacing[20],
    padding: spacing[24],
    borderRadius: radius.lg,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    ...shadow.card,
  },
  stateTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
    textAlign: 'center',
  },
  stateBody: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 20,
    textAlign: 'center',
    marginTop: spacing[8],
  },
  outlineButton: {
    marginTop: spacing[20],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.olive900,
    paddingHorizontal: spacing[20],
    paddingVertical: spacing[12],
  },
  outlineButtonText: { color: colors.olive900, fontWeight: '900' },
  summaryCard: {
    marginHorizontal: spacing[20],
    padding: spacing[16],
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
    flexDirection: 'row',
    alignItems: 'center',
    ...shadow.card,
  },
  summaryMetric: { flex: 1, alignItems: 'center' },
  summaryValue: { color: colors.white, fontSize: 17, fontWeight: '900' },
  summaryLabel: {
    color: colors.limestone,
    fontSize: 9,
    textAlign: 'center',
    marginTop: spacing[4],
  },
  summaryDivider: { width: 1, height: 34, backgroundColor: colors.olive700 },
  tabs: {
    marginHorizontal: spacing[20],
    marginTop: spacing[20],
    padding: spacing[4],
    borderRadius: radius.pill,
    backgroundColor: colors.limestone,
    flexDirection: 'row',
  },
  tab: {
    flex: 1,
    minHeight: 42,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeTab: { backgroundColor: colors.white, ...shadow.card },
  tabText: { color: colors.muted, fontSize: 12, fontWeight: '800' },
  activeTabText: { color: colors.olive900 },
  section: { paddingHorizontal: spacing[20], marginTop: spacing[24] },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    fontWeight: '900',
  },
  sectionIntro: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 19,
    marginTop: spacing[4],
    marginBottom: spacing[16],
  },
  photoGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing[8] },
  photoCard: {
    width: '48%',
    overflow: 'hidden',
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featuredPhotoCard: { width: '100%' },
  photoImage: { width: '100%', height: 130, backgroundColor: colors.limestone },
  featuredPhotoImage: { height: 200 },
  photoPlaceholder: {
    width: '100%',
    height: 130,
    backgroundColor: colors.limestone,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[12],
  },
  photoPlaceholderIcon: { color: colors.olive700, fontSize: 26, fontWeight: '900' },
  photoPlaceholderText: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing[4],
  },
  photoCopy: { padding: spacing[12] },
  featuredBadge: {
    color: colors.aoveGold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: spacing[4],
  },
  photoCaption: { color: colors.ink, fontSize: 12, lineHeight: 17, fontWeight: '700' },
  metaText: { color: colors.muted, fontSize: 10, marginTop: spacing[8] },
  reviewCard: {
    marginBottom: spacing[12],
    padding: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  reviewTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  senderLabel: { color: colors.olive700, fontSize: 11, fontWeight: '900' },
  ratingText: { color: colors.aoveGold, fontSize: 12, fontWeight: '900' },
  reviewBody: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[12] },
  conversationTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
    marginTop: spacing[16],
    marginBottom: spacing[12],
  },
  commentCard: {
    marginBottom: spacing[8],
    padding: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.limestone,
  },
  commentBody: { color: colors.ink, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  communityNotice: {
    padding: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.limestone,
    borderLeftWidth: 4,
    borderLeftColor: colors.aoveGold,
    marginBottom: spacing[16],
  },
  communityNoticeBadge: {
    color: colors.olive900,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
  communityNoticeText: {
    color: colors.muted,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
  incidentCard: {
    marginBottom: spacing[12],
    padding: spacing[16],
    borderRadius: radius.md,
    backgroundColor: colors.white,
    borderWidth: 1,
    borderColor: colors.border,
  },
  incidentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  incidentBadge: {
    color: colors.olive900,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  incidentStatus: { color: colors.muted, fontSize: 10, fontWeight: '800' },
  incidentTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
    marginTop: spacing[12],
  },
  incidentBody: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: spacing[8] },
  emptyCard: {
    padding: spacing[20],
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
    backgroundColor: colors.white,
  },
  emptyTitle: { color: colors.ink, fontSize: 14, fontWeight: '900' },
  emptyBody: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: spacing[4] },
  readOnlyCard: {
    marginHorizontal: spacing[20],
    marginTop: spacing[24],
    padding: spacing[20],
    borderRadius: radius.lg,
    backgroundColor: colors.olive900,
  },
  readOnlyEyebrow: {
    color: colors.aoveGold,
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1.1,
  },
  readOnlyTitle: {
    color: colors.white,
    fontSize: 17,
    fontWeight: '900',
    marginTop: spacing[8],
  },
  readOnlyBody: {
    color: colors.limestone,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
  },
});
