import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { developmentRewardItems } from '../../src/features/rewards/development-rewards-data';
import {
  buildRewardCatalogModel,
  type RewardCatalogCardModel,
  type RewardCatalogFilterId,
} from '../../src/features/rewards/reward-catalog-model';
import { colors, radius, shadow, spacing, typography } from '../../src/theme/tokens';

const availableOlives = 4200;

function RewardCard({ card }: { card: RewardCatalogCardModel }) {
  const isLocked = card.status === 'locked';
  const isOwned = card.status === 'owned';

  return (
    <View style={styles.rewardCard}>
      <View
        style={[
          styles.rewardArtwork,
          card.kind === 'digital'
            ? styles.rewardArtworkDigital
            : styles.rewardArtworkPhysical,
        ]}
      >
        <View style={styles.artworkOrb} />
        <View style={styles.artworkHorizon} />
        <Text style={styles.artworkGlyph}>
          {card.kind === 'digital' ? '✦' : '🫒'}
        </Text>
        <View style={styles.rarityBadge}>
          <Text style={styles.rarityText}>{card.rarityLabel}</Text>
        </View>
      </View>

      <View style={styles.rewardBody}>
        <View style={styles.rewardMetaRow}>
          <Text style={styles.kindLabel}>{card.kindLabel}</Text>
          <Text
            style={[
              styles.statusLabel,
              card.status === 'available'
                ? styles.statusAvailable
                : isOwned
                  ? styles.statusOwned
                  : styles.statusLocked,
            ]}
          >
            {card.statusLabel}
          </Text>
        </View>

        <Text style={styles.rewardName}>{card.name}</Text>
        {card.partnerLabel ? (
          <Text style={styles.partnerLabel}>{card.partnerLabel}</Text>
        ) : (
          <Text style={styles.partnerLabel}>Colección Mi Olivo</Text>
        )}

        <View style={styles.rewardFooter}>
          <Text style={styles.rewardPrice}>{card.priceLabel}</Text>
          <View
            accessibilityState={{ disabled: true }}
            style={[
              styles.rewardAction,
              isLocked
                ? styles.rewardActionLocked
                : isOwned
                  ? styles.rewardActionOwned
                  : styles.rewardActionAvailable,
            ]}
          >
            <Text
              style={[
                styles.rewardActionText,
                isLocked ? styles.rewardActionTextLocked : null,
              ]}
            >
              {card.actionLabel}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}

export default function RewardsScreen() {
  const [filter, setFilter] = useState<RewardCatalogFilterId>('all');
  const model = useMemo(
    () =>
      buildRewardCatalogModel({
        items: developmentRewardItems,
        activeFilter: filter,
        availableOlives,
      }),
    [filter],
  );

  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topRow}>
          <Pressable
            accessibilityLabel="Volver a Mi Olivo"
            accessibilityRole="button"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.backButton,
              pressed ? styles.pressed : null,
            ]}
          >
            <Text style={styles.backGlyph}>‹</Text>
          </Pressable>
          <View style={styles.topCopy}>
            <Text style={styles.kicker}>MÁGINA · RECOMPENSAS</Text>
            <Text style={styles.title}>Premios</Text>
          </View>
          <View style={styles.balancePill}>
            <Text style={styles.balanceText}>{model.balanceLabel}</Text>
          </View>
        </View>

        <View style={styles.introCard}>
          <Text style={styles.introEyebrow}>TU COSECHA TIENE VALOR</Text>
          <Text style={styles.introTitle}>Convierte aventuras en recuerdos</Text>
          <Text style={styles.introBody}>
            Desbloquea detalles para tu olivo o reserva productos locales. Los
            canjes físicos usan un QR de un solo uso y validación en la almazara.
          </Text>
        </View>

        <ScrollView
          contentContainerStyle={styles.filters}
          horizontal
          showsHorizontalScrollIndicator={false}
        >
          {model.filters.map((item) => {
            const selected = item.id === model.activeFilter;
            return (
              <Pressable
                accessibilityRole="button"
                key={item.id}
                onPress={() => setFilter(item.id)}
                style={[
                  styles.filterChip,
                  selected ? styles.filterChipSelected : null,
                ]}
              >
                <Text
                  style={[
                    styles.filterLabel,
                    selected ? styles.filterLabelSelected : null,
                  ]}
                >
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View style={styles.sectionRow}>
          <View>
            <Text style={styles.sectionEyebrow}>CATÁLOGO</Text>
            <Text style={styles.sectionTitle}>
              {model.activeFilter === 'digital'
                ? 'Para personalizar tu olivo'
                : model.activeFilter === 'physical'
                  ? 'Sabores y experiencias de Mágina'
                  : 'Destacados para ti'}
            </Text>
          </View>
        </View>

        <View style={styles.catalog}>
          {model.cards.length > 0 ? (
            model.cards.map((card) => <RewardCard card={card} key={card.id} />)
          ) : (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyTitle}>{model.emptyLabel}</Text>
              <Text style={styles.emptyBody}>
                Cambia de categoría para seguir explorando.
              </Text>
            </View>
          )}
        </View>

        <View style={styles.securityNote}>
          <Text style={styles.securityIcon}>✓</Text>
          <View style={styles.securityCopy}>
            <Text style={styles.securityTitle}>Canje protegido</Text>
            <Text style={styles.securityBody}>
              Tu saldo no se modifica desde el móvil. Reservas, compras y QR se
              confirman de forma transaccional en el servidor.
            </Text>
          </View>
        </View>
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
    paddingHorizontal: spacing[20],
    paddingBottom: spacing[40],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[12],
    paddingTop: spacing[12],
    paddingBottom: spacing[20],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: colors.white,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
  },
  pressed: {
    opacity: 0.72,
  },
  backGlyph: {
    color: colors.olive900,
    fontSize: 31,
    fontWeight: '400',
    lineHeight: 32,
    marginTop: -2,
  },
  topCopy: {
    flex: 1,
  },
  kicker: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  title: {
    color: colors.ink,
    fontSize: typography.title,
    fontWeight: '900',
    marginTop: 2,
  },
  balancePill: {
    backgroundColor: colors.olive900,
    borderRadius: radius.pill,
    paddingHorizontal: spacing[12],
    paddingVertical: 9,
  },
  balanceText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '900',
  },
  introCard: {
    backgroundColor: colors.olive900,
    borderRadius: radius.lg,
    padding: spacing[24],
    ...shadow.card,
  },
  introEyebrow: {
    color: colors.aoveGold,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.6,
  },
  introTitle: {
    color: colors.white,
    fontSize: 23,
    lineHeight: 29,
    fontWeight: '900',
    marginTop: spacing[4],
    maxWidth: 280,
  },
  introBody: {
    color: colors.limestone,
    fontSize: 12,
    lineHeight: 18,
    marginTop: spacing[8],
    opacity: 0.92,
  },
  filters: {
    gap: spacing[8],
    paddingVertical: spacing[20],
  },
  filterChip: {
    borderRadius: radius.pill,
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    backgroundColor: colors.white,
    paddingHorizontal: spacing[16],
    paddingVertical: 10,
  },
  filterChipSelected: {
    backgroundColor: colors.olive900,
    borderColor: colors.olive900,
  },
  filterLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
  },
  filterLabelSelected: {
    color: colors.white,
  },
  sectionRow: {
    marginBottom: spacing[12],
  },
  sectionEyebrow: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: typography.section,
    lineHeight: 25,
    fontWeight: '850',
    marginTop: 2,
  },
  catalog: {
    gap: spacing[14],
  },
  rewardCard: {
    backgroundColor: colors.white,
    borderRadius: radius.lg,
    overflow: 'hidden',
    borderColor: colors.border,
    borderWidth: StyleSheet.hairlineWidth,
    ...shadow.card,
  },
  rewardArtwork: {
    height: 138,
    overflow: 'hidden',
    position: 'relative',
  },
  rewardArtworkDigital: {
    backgroundColor: colors.olive700,
  },
  rewardArtworkPhysical: {
    backgroundColor: colors.earth,
  },
  artworkOrb: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    right: 24,
    top: 16,
    backgroundColor: colors.aoveGold,
    opacity: 0.72,
  },
  artworkHorizon: {
    position: 'absolute',
    left: -30,
    right: -60,
    bottom: -42,
    height: 120,
    borderRadius: 80,
    backgroundColor: colors.olive900,
    opacity: 0.55,
    transform: [{ rotate: '-3deg' }],
  },
  artworkGlyph: {
    position: 'absolute',
    left: spacing[20],
    bottom: spacing[20],
    color: colors.white,
    fontSize: 32,
    fontWeight: '900',
  },
  rarityBadge: {
    position: 'absolute',
    right: spacing[12],
    top: spacing[12],
    backgroundColor: 'rgba(23,32,25,0.72)',
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 5,
  },
  rarityText: {
    color: colors.white,
    fontSize: 9,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  rewardBody: {
    padding: spacing[18] ?? spacing[20],
  },
  rewardMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[8],
  },
  kindLabel: {
    color: colors.olive700,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '900',
  },
  statusAvailable: {
    color: colors.olive700,
  },
  statusOwned: {
    color: colors.aoveGold,
  },
  statusLocked: {
    color: colors.muted,
  },
  rewardName: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
    lineHeight: 23,
    marginTop: spacing[8],
  },
  partnerLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '600',
    marginTop: spacing[4],
  },
  rewardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[18] ?? spacing[20],
    gap: spacing[12],
  },
  rewardPrice: {
    color: colors.olive900,
    fontSize: 17,
    fontWeight: '900',
  },
  rewardAction: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing[14] ?? spacing[16],
    paddingVertical: 9,
  },
  rewardActionAvailable: {
    backgroundColor: colors.olive900,
  },
  rewardActionOwned: {
    backgroundColor: colors.aoveGold,
  },
  rewardActionLocked: {
    backgroundColor: colors.limestone,
  },
  rewardActionText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '900',
  },
  rewardActionTextLocked: {
    color: colors.muted,
  },
  emptyCard: {
    alignItems: 'center',
    backgroundColor: colors.white,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    padding: spacing[32],
  },
  emptyTitle: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyBody: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing[4],
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[12],
    backgroundColor: colors.limestone,
    borderRadius: radius.md,
    padding: spacing[16],
    marginTop: spacing[24],
  },
  securityIcon: {
    color: colors.olive700,
    fontSize: 18,
    fontWeight: '900',
  },
  securityCopy: {
    flex: 1,
  },
  securityTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  securityBody: {
    color: colors.muted,
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },
});
