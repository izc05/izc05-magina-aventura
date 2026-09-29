import { describe, expect, it } from 'vitest';

import type { SponsorRewardDefinition } from '@magina-aventura/contracts';

import { evaluateSponsorRewardEligibility } from './sponsor-reward-eligibility';

const reward: SponsorRewardDefinition = {
  id: 'reward-breakfast-demo',
  sponsorId: 'sponsor-demo',
  title: '15% en desayuno',
  description: 'Promoción de ejemplo para QA',
  rewardType: 'percentage_discount',
  discountValue: 15,
  terms: 'Solo demostración',
  validFrom: '2026-09-01T00:00:00.000Z',
  validUntil: '2026-12-31T23:59:59.000Z',
  redemptionMode: 'single_use_code',
  eligibleRouteIds: ['dev-bedmar-cuadros-001'],
  requiredCompletionFacts: ['route.completed', 'checkpoint:final'],
  active: true,
};

describe('sponsor reward eligibility', () => {
  it('never enables commercial rewards for simulated QA sessions', () => {
    const result = evaluateSponsorRewardEligibility(reward, {
      routeId: 'dev-bedmar-cuadros-001',
      completedFacts: ['route.completed', 'checkpoint:final'],
      now: '2026-09-29T12:00:00.000Z',
      trust: {
        qaSimulated: true,
        physicalGpsValidated: false,
      },
    });

    expect(result).toEqual({
      eligible: false,
      reason: 'qa-simulated',
      requiresServerAuthorization: true,
    });
  });

  it('requires physical GPS validation even outside simulation', () => {
    const result = evaluateSponsorRewardEligibility(reward, {
      routeId: 'dev-bedmar-cuadros-001',
      completedFacts: ['route.completed', 'checkpoint:final'],
      now: '2026-09-29T12:00:00.000Z',
      trust: {
        qaSimulated: false,
        physicalGpsValidated: false,
      },
    });

    expect(result.reason).toBe('physical-gps-not-validated');
    expect(result.eligible).toBe(false);
  });

  it('requires all completion facts', () => {
    const result = evaluateSponsorRewardEligibility(reward, {
      routeId: 'dev-bedmar-cuadros-001',
      completedFacts: ['route.completed'],
      now: '2026-09-29T12:00:00.000Z',
      trust: {
        qaSimulated: false,
        physicalGpsValidated: true,
      },
    });

    expect(result.reason).toBe('missing-completion-fact');
  });

  it('returns client eligibility while retaining server authorization', () => {
    const result = evaluateSponsorRewardEligibility(reward, {
      routeId: 'dev-bedmar-cuadros-001',
      completedFacts: ['route.completed', 'checkpoint:final'],
      now: '2026-09-29T12:00:00.000Z',
      trust: {
        qaSimulated: false,
        physicalGpsValidated: true,
      },
    });

    expect(result).toEqual({
      eligible: true,
      reason: null,
      requiresServerAuthorization: true,
    });
  });
});
