import { StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '../../components/branding/BrandMark';
import { colors, radius, spacing } from '../../theme/tokens';
import type { OnboardingSlide as OnboardingSlideModel } from './onboarding-contract';

type OnboardingSlideProps = Readonly<{
  slide: OnboardingSlideModel;
  width: number;
}>;

export function OnboardingSlide({ slide, width }: OnboardingSlideProps) {
  return (
    <View style={[styles.slide, { width }]}>
      <View style={styles.scene}>
        <Landscape />
        {slide.id === 'welcome' ? <Hiker /> : null}
        {slide.id === 'routes' ? <Signpost /> : null}
        {slide.id === 'discover' ? <Discovery /> : null}
        {slide.id === 'rewards' ? <RewardMark /> : null}
      </View>

      <View style={styles.copy}>
        <Text style={styles.title}>{slide.title}</Text>
        <Text style={styles.body}>{slide.body}</Text>
      </View>
    </View>
  );
}

function Landscape() {
  return (
    <View style={StyleSheet.absoluteFill}>
      <View style={styles.skyGlow} />
      <View style={styles.sun} />
      <View style={styles.mountainFar} />
      <View style={styles.mountainMid} />
      <View style={styles.mountainNear} />
      <View style={styles.ground} />
      <View style={styles.path} />
      <View style={styles.oliveBranchLeft} />
      <View style={styles.oliveLeafA} />
      <View style={styles.oliveLeafB} />
      <View style={styles.oliveLeafC} />
    </View>
  );
}

function Hiker() {
  return (
    <View style={styles.hiker}>
      <View style={styles.hikerHead} />
      <View style={styles.hikerBody} />
      <View style={styles.backpack} />
      <View style={styles.legLeft} />
      <View style={styles.legRight} />
      <View style={styles.walkingPole} />
    </View>
  );
}

function Signpost() {
  return (
    <View style={styles.signpost}>
      <View style={styles.signPole} />
      <View style={[styles.signBoard, styles.signBoardTop]}>
        <Text style={styles.signText}>RUTAS</Text>
      </View>
      <View style={[styles.signBoard, styles.signBoardMiddle]}>
        <Text style={styles.signText}>NATURALEZA</Text>
      </View>
      <View style={[styles.signBoard, styles.signBoardBottom]}>
        <Text style={styles.signText}>PATRIMONIO</Text>
      </View>
    </View>
  );
}

function Discovery() {
  return (
    <View style={styles.discovery}>
      <View style={styles.castleBase} />
      <View style={styles.castleTowerLeft} />
      <View style={styles.castleTowerRight} />
      <View style={styles.pinOuter}>
        <View style={styles.pinInner} />
      </View>
      <View style={styles.discoveryCard}>
        <Text style={styles.discoveryEyebrow}>PUNTO DE INTERÉS</Text>
        <Text style={styles.discoveryText}>A 120 m</Text>
      </View>
    </View>
  );
}

function RewardMark() {
  return (
    <View style={styles.rewardMarkWrap}>
      <View style={styles.rewardGlow} />
      <BrandMark size={112} framed inverse />
      <View style={styles.rewardBadges}>
        <RewardBadge value="XP" label="+100" />
        <RewardBadge value="●" label="+3" />
        <RewardBadge value="◆" label="DESCUBRE" />
      </View>
    </View>
  );
}

function RewardBadge({ value, label }: { value: string; label: string }) {
  return (
    <View style={styles.rewardBadge}>
      <View style={styles.rewardBadgeIcon}>
        <Text style={styles.rewardBadgeValue}>{value}</Text>
      </View>
      <Text style={styles.rewardBadgeLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    flex: 1,
  },
  scene: {
    height: '64%',
    minHeight: 390,
    overflow: 'hidden',
    backgroundColor: colors.sky,
  },
  skyGlow: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: '#CFE4EF',
    opacity: 0.62,
  },
  sun: {
    position: 'absolute',
    width: 92,
    height: 92,
    borderRadius: 46,
    backgroundColor: '#F1D57A',
    right: 42,
    top: 64,
    opacity: 0.86,
  },
  mountainFar: {
    position: 'absolute',
    width: 330,
    height: 190,
    borderRadius: 70,
    backgroundColor: '#8FA7A1',
    transform: [{ rotate: '34deg' }],
    right: -142,
    bottom: 100,
    opacity: 0.75,
  },
  mountainMid: {
    position: 'absolute',
    width: 360,
    height: 210,
    borderRadius: 80,
    backgroundColor: colors.olive500,
    transform: [{ rotate: '-28deg' }],
    left: -145,
    bottom: 78,
    opacity: 0.9,
  },
  mountainNear: {
    position: 'absolute',
    width: 420,
    height: 210,
    borderRadius: 88,
    backgroundColor: colors.olive700,
    transform: [{ rotate: '14deg' }],
    right: -190,
    bottom: -20,
  },
  ground: {
    position: 'absolute',
    left: -30,
    right: -30,
    bottom: -70,
    height: 190,
    borderRadius: 80,
    backgroundColor: '#A4A073',
  },
  path: {
    position: 'absolute',
    width: 118,
    height: 300,
    borderRadius: 70,
    backgroundColor: colors.limestone,
    bottom: -170,
    left: '44%',
    transform: [{ rotate: '12deg' }],
    opacity: 0.95,
  },
  oliveBranchLeft: {
    position: 'absolute',
    width: 120,
    height: 5,
    borderRadius: 3,
    backgroundColor: colors.olive900,
    left: -20,
    bottom: 50,
    transform: [{ rotate: '-28deg' }],
  },
  oliveLeafA: {
    position: 'absolute',
    width: 45,
    height: 17,
    borderRadius: 22,
    backgroundColor: colors.olive900,
    left: 18,
    bottom: 72,
    transform: [{ rotate: '18deg' }],
  },
  oliveLeafB: {
    position: 'absolute',
    width: 52,
    height: 18,
    borderRadius: 25,
    backgroundColor: colors.olive700,
    left: 47,
    bottom: 47,
    transform: [{ rotate: '-35deg' }],
  },
  oliveLeafC: {
    position: 'absolute',
    width: 44,
    height: 16,
    borderRadius: 22,
    backgroundColor: colors.olive900,
    left: 72,
    bottom: 84,
    transform: [{ rotate: '8deg' }],
  },
  copy: {
    flex: 1,
    backgroundColor: colors.warmBackground,
    paddingHorizontal: spacing[32],
    paddingTop: spacing[28],
    alignItems: 'center',
  },
  title: {
    color: colors.ink,
    fontSize: 27,
    lineHeight: 32,
    fontWeight: '900',
    textAlign: 'center',
    letterSpacing: -0.6,
  },
  body: {
    marginTop: spacing[12],
    maxWidth: 330,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  hiker: {
    position: 'absolute',
    left: '45%',
    bottom: 72,
    width: 80,
    height: 180,
  },
  hikerHead: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#C58D65',
    left: 25,
    top: 2,
  },
  hikerBody: {
    position: 'absolute',
    width: 42,
    height: 76,
    borderRadius: 18,
    backgroundColor: colors.olive900,
    left: 17,
    top: 28,
  },
  backpack: {
    position: 'absolute',
    width: 32,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#3B5360',
    left: 2,
    top: 38,
  },
  legLeft: {
    position: 'absolute',
    width: 13,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#3B3E39',
    left: 22,
    top: 95,
    transform: [{ rotate: '7deg' }],
  },
  legRight: {
    position: 'absolute',
    width: 13,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#3B3E39',
    right: 23,
    top: 95,
    transform: [{ rotate: '-8deg' }],
  },
  walkingPole: {
    position: 'absolute',
    width: 3,
    height: 118,
    backgroundColor: '#343A35',
    right: 1,
    top: 48,
    transform: [{ rotate: '9deg' }],
  },
  signpost: {
    position: 'absolute',
    left: '20%',
    bottom: 70,
    width: 210,
    height: 215,
  },
  signPole: {
    position: 'absolute',
    width: 10,
    height: 205,
    borderRadius: 5,
    backgroundColor: '#71533B',
    left: 94,
    bottom: 0,
  },
  signBoard: {
    position: 'absolute',
    left: 17,
    width: 168,
    height: 44,
    borderRadius: 6,
    backgroundColor: '#77543A',
    borderWidth: 2,
    borderColor: '#9D795B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signBoardTop: { top: 16, transform: [{ rotate: '-2deg' }] },
  signBoardMiddle: { top: 72, transform: [{ rotate: '1deg' }] },
  signBoardBottom: { top: 128, transform: [{ rotate: '-1deg' }] },
  signText: {
    color: colors.warmBackground,
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 1.3,
  },
  discovery: {
    position: 'absolute',
    left: '27%',
    bottom: 80,
    width: 190,
    height: 220,
  },
  castleBase: {
    position: 'absolute',
    width: 125,
    height: 54,
    backgroundColor: '#84745E',
    left: 20,
    bottom: 0,
  },
  castleTowerLeft: {
    position: 'absolute',
    width: 38,
    height: 85,
    backgroundColor: '#776954',
    left: 6,
    bottom: 0,
  },
  castleTowerRight: {
    position: 'absolute',
    width: 40,
    height: 108,
    backgroundColor: '#70614D',
    right: 20,
    bottom: 0,
  },
  pinOuter: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: colors.aoveGold,
    alignItems: 'center',
    justifyContent: 'center',
    right: 16,
    top: 5,
    borderWidth: 5,
    borderColor: colors.white,
  },
  pinInner: {
    width: 15,
    height: 15,
    borderRadius: 8,
    backgroundColor: colors.white,
  },
  discoveryCard: {
    position: 'absolute',
    right: -18,
    top: 63,
    minWidth: 126,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: radius.sm,
    backgroundColor: colors.white,
  },
  discoveryEyebrow: {
    color: colors.olive700,
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  discoveryText: {
    marginTop: 2,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  rewardMarkWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 105,
    alignItems: 'center',
  },
  rewardGlow: {
    position: 'absolute',
    width: 168,
    height: 168,
    borderRadius: 84,
    backgroundColor: '#F4D66A',
    opacity: 0.38,
    top: -28,
  },
  rewardBadges: {
    marginTop: 34,
    flexDirection: 'row',
    gap: spacing[24],
  },
  rewardBadge: {
    alignItems: 'center',
  },
  rewardBadgeIcon: {
    width: 45,
    height: 45,
    borderRadius: 23,
    backgroundColor: colors.olive900,
    borderWidth: 2,
    borderColor: colors.aoveGold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rewardBadgeValue: {
    color: colors.aoveGold,
    fontSize: 12,
    fontWeight: '900',
  },
  rewardBadgeLabel: {
    marginTop: 5,
    color: colors.olive900,
    fontSize: 8,
    fontWeight: '900',
  },
});
