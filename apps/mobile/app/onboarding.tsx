import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useRef, useState } from 'react';
import {
  NativeScrollEvent,
  NativeSyntheticEvent,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { onboardingSlides } from '../src/features/onboarding/onboarding-contract';
import { expoOnboardingStorage } from '../src/features/onboarding/expo-onboarding-storage';
import { OnboardingSlide } from '../src/features/onboarding/OnboardingSlide';
import { startupBreadcrumb } from '../src/features/diagnostics/startup-breadcrumbs';
import { colors, radius, shadow, spacing } from '../src/theme/tokens';

export default function OnboardingScreen() {
  startupBreadcrumb('onboarding-mounted');
  const { width } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const [index, setIndex] = useState(0);
  const [finishing, setFinishing] = useState(false);
  const isLast = index === onboardingSlides.length - 1;

  function onMomentumScrollEnd(event: NativeSyntheticEvent<NativeScrollEvent>) {
    const nextIndex = Math.round(event.nativeEvent.contentOffset.x / width);
    setIndex(Math.max(0, Math.min(nextIndex, onboardingSlides.length - 1)));
  }

  function next() {
    if (isLast) {
      void finish();
      return;
    }

    const nextIndex = index + 1;
    setIndex(nextIndex);
    scrollRef.current?.scrollTo({ x: nextIndex * width, animated: true });
  }

  async function finish() {
    if (finishing) return;
    setFinishing(true);

    try {
      await expoOnboardingStorage.markSeen();
    } finally {
      router.replace('/');
    }
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <StatusBar style="dark" />

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        bounces={false}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        contentContainerStyle={styles.pager}
      >
        {onboardingSlides.map((slide) => (
          <OnboardingSlide key={slide.id} slide={slide} width={width} />
        ))}
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Omitir introducción"
        onPress={() => void finish()}
        disabled={finishing}
        style={styles.skipButton}
      >
        <Text style={styles.skipText}>Omitir</Text>
      </Pressable>

      <View pointerEvents="box-none" style={styles.controls}>
        <View style={styles.dots}>
          {onboardingSlides.map((slide, dotIndex) => (
            <View
              key={slide.id}
              style={[styles.dot, dotIndex === index && styles.dotActive]}
            />
          ))}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={isLast ? 'Comenzar aventura' : 'Siguiente'}
          disabled={finishing}
          onPress={next}
          style={({ pressed }) => [styles.primaryButton, pressed && styles.primaryButtonPressed]}
        >
          <Text style={styles.primaryButtonText}>
            {isLast ? 'Comenzar aventura  ▶' : 'Siguiente  →'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.warmBackground,
  },
  pager: {
    flexGrow: 1,
  },
  skipButton: {
    position: 'absolute',
    top: spacing[20],
    right: spacing[20],
    zIndex: 20,
    paddingHorizontal: spacing[12],
    paddingVertical: spacing[8],
    borderRadius: radius.pill,
    backgroundColor: 'rgba(250,249,246,0.86)',
  },
  skipText: {
    color: colors.olive900,
    fontSize: 12,
    fontWeight: '800',
  },
  controls: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing[24],
    paddingBottom: spacing[20],
    backgroundColor: colors.warmBackground,
  },
  dots: {
    height: 24,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing[8],
    marginBottom: spacing[8],
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#CACABD',
  },
  dotActive: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: colors.olive900,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.olive900,
    alignItems: 'center',
    justifyContent: 'center',
    ...shadow.card,
  },
  primaryButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },
  primaryButtonText: {
    color: colors.white,
    fontSize: 15,
    fontWeight: '900',
  },
});
