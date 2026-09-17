import { describe, expect, it } from 'vitest';

import type { ChallengeProgressProjection } from '../gamification/challenge-progress';
import type { LevelDefinition } from '../gamification/level-progression';
import {
  buildRewardDeliveryPlan,
  type RewardDeliveryPlanInput,
} from './reward-delivery';

function crossedLevel(): LevelDefinition {
  return {
    level: 2,
    name: 'Brote fuerte',
    minXp: 100,
    rewardOlives: 5,
    active: true,
  };
}

function completedChallenge(): ChallengeProgressProjection {
  return {
    challengeId: 'week-10k',
    title: '10 km semanales',
    description: 'Completa 10 km esta semana',
    scope: 'weekly',
    metric: 'distanceMeters',
    current: 10_000,
    target: 10_000,
    percentage: 100,
    completed: true,
    sourceKey: 'challenge:week-10k:completion',
  };
}

function input(): RewardDeliveryPlanInput {
  return {
    validation: {
      userId: 'user-1',
      activityId: 'activity-1',
      verifiedAt: '2026-09-16T06:00:00.000Z',
      evidence: {
        'activity-verification': true,
        'route-integrity': true,
        'location-integrity': true,
      },
      policy: {
        requiredChecks: [
          'activity-verification',
          'route-integrity',
          'location-integrity',
        ],
      },
      alreadyCommittedActivityIds: [],
    },
    progression: {
      crossedLevels: [crossedLevel()],
      completedChallenges: [completedChallenge()],
    },
    challengeRewards: [{ challengeId: 'week-10k', rewardOlives: 7 }],
    multiplier: 1,
    rounding: 'floor',
    alreadyGrantedSourceKeys: [],
    occurredAt: '2026-09-16T06:00:01.000Z',
    alreadyPublishedEventKeys: [],
  };
}

describe('buildRewardDeliveryPlan', () => {
  it('composes approved validation into ledger entries and matching outbox events', () => {
    const result = buildRewardDeliveryPlan(input());

    expect(result.validation.status).toBe('approved');
    expect(result.shouldPersist).toBe(true);
    expect(result.ledgerEntries.map((entry) => entry.sourceKey)).toEqual([
      'olive:challenge:week-10k',
      'olive:level:2',
    ]);
    expect(result.ledgerEntries.every((entry) => entry.userId === 'user-1')).toBe(
      true,
    );
    expect(result.outboxEvents.map((event) => event.eventKey)).toEqual([
      'outbox:olive:challenge:week-10k',
      'outbox:olive:level:2',
    ]);
  });

  it('emits nothing when required validation evidence rejects the activity', () => {
    const value = input();
    value.validation.evidence['location-integrity'] = false;

    const result = buildRewardDeliveryPlan(value);

    expect(result.validation.status).toBe('rejected');
    expect(result.shouldPersist).toBe(false);
    expect(result.ledgerEntries).toEqual([]);
    expect(result.outboxEvents).toEqual([]);
  });

  it('treats an already committed activity as an idempotent no-op', () => {
    const value = input();
    value.validation.alreadyCommittedActivityIds = ['activity-1'];

    const result = buildRewardDeliveryPlan(value);

    expect(result.validation.status).toBe('already-committed');
    expect(result.shouldPersist).toBe(false);
    expect(result.ledgerEntries).toEqual([]);
    expect(result.outboxEvents).toEqual([]);
  });

  it('does not persist grants whose ledger source keys were already committed', () => {
    const value = input();
    value.alreadyGrantedSourceKeys = [
      'olive:challenge:week-10k',
      'olive:level:2',
    ];

    const result = buildRewardDeliveryPlan(value);

    expect(result.validation.status).toBe('approved');
    expect(result.shouldPersist).toBe(false);
    expect(result.ledgerEntries).toEqual([]);
    expect(result.outboxEvents).toEqual([]);
  });

  it('keeps a pending ledger entry while suppressing its already-published outbox event', () => {
    const value = input();
    value.alreadyPublishedEventKeys = ['outbox:olive:level:2'];

    const result = buildRewardDeliveryPlan(value);

    expect(result.shouldPersist).toBe(true);
    expect(result.ledgerEntries).toHaveLength(2);
    expect(result.outboxEvents.map((event) => event.eventKey)).toEqual([
      'outbox:olive:challenge:week-10k',
    ]);
  });

  it('uses the validated user identity even though progression has no user field', () => {
    const value = input();
    value.validation.userId = 'authoritative-user';

    const result = buildRewardDeliveryPlan(value);

    expect(
      result.ledgerEntries.every((entry) => entry.userId === 'authoritative-user'),
    ).toBe(true);
    expect(
      result.outboxEvents.every(
        (event) => event.aggregateId === 'authoritative-user',
      ),
    ).toBe(true);
  });
});
