import { describe, expect, it } from 'vitest';

import {
  ONBOARDING_STORAGE_KEY,
  onboardingSlides,
  resolveFirstLaunchDestination,
} from './onboarding-contract';

describe('Mágina Aventura onboarding contract', () => {
  it('keeps the approved versioned storage key', () => {
    expect(ONBOARDING_STORAGE_KEY).toBe('magina_onboarding_seen_v1');
  });

  it('keeps the approved four-step first-launch sequence', () => {
    expect(onboardingSlides).toHaveLength(4);
    expect(onboardingSlides.map((slide) => slide.title)).toEqual([
      'Bienvenido a Mágina Aventura',
      'Descubre rutas',
      'Camina y desbloquea',
      'Construye tu progreso',
    ]);
  });

  it('does not promise rewards before validated activity rewards are enabled', () => {
    const rewardsSlide = onboardingSlides.find((slide) => slide.id === 'rewards');

    expect(rewardsSlide?.body).toContain('se activarán');
    expect(rewardsSlide?.body).toContain('validar cada actividad');
    expect(rewardsSlide?.title).not.toContain('Gana');
  });

  it('routes a fresh install to onboarding and a returning install home', () => {
    expect(resolveFirstLaunchDestination(false)).toBe('/onboarding');
    expect(resolveFirstLaunchDestination(true)).toBe('/');
  });
});
