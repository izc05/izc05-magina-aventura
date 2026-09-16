import { describe, expect, it } from 'vitest';

import {
  evaluateRewardValidation,
  type RewardValidationCheck,
} from './reward-validation';

const allTrue: Record<RewardValidationCheck, boolean> = {
  'activity-verification': true,
  'route-integrity': true,
  'location-integrity': true,
  'account-eligibility': true,
  'abuse-screen': true,
};

function baseInput() {
  const evidence: Partial<Record<RewardValidationCheck, boolean>> = {
    ...allTrue,
  };

  return {
    userId: 'user-1',
    activityId: 'activity-1',
    verifiedAt: '2026-09-16T06:00:00.000Z',
    evidence,
    policy: {
      requiredChecks: [
        'activity-verification',
        'route-integrity',
        'location-integrity',
      ] as RewardValidationCheck[],
    },
    alreadyCommittedActivityIds: [] as string[],
  };
}

describe('evaluateRewardValidation', () => {
  it('approves when every explicitly required server evidence check passes', () => {
    expect(evaluateRewardValidation(baseInput())).toEqual({
      status: 'approved',
      approved: true,
      validationKey: 'reward-validation:activity-1',
      failedChecks: [],
      reasons: [],
    });
  });

  it('rejects required false or missing evidence and keeps canonical ordering', () => {
    const input = baseInput();
    input.policy.requiredChecks = [
      'abuse-screen',
      'route-integrity',
      'activity-verification',
      'location-integrity',
      'route-integrity',
    ];
    input.evidence['activity-verification'] = false;
    input.evidence['route-integrity'] = false;
    delete input.evidence['location-integrity'];
    input.evidence['abuse-screen'] = false;

    expect(evaluateRewardValidation(input)).toEqual({
      status: 'rejected',
      approved: false,
      validationKey: 'reward-validation:activity-1',
      failedChecks: [
        'activity-verification',
        'route-integrity',
        'location-integrity',
        'abuse-screen',
      ],
      reasons: [
        'required-check-failed:activity-verification',
        'required-check-failed:route-integrity',
        'required-check-failed:location-integrity',
        'required-check-failed:abuse-screen',
      ],
    });
  });

  it('does not reject optional evidence that is false', () => {
    const input = baseInput();
    input.evidence['account-eligibility'] = false;
    input.evidence['abuse-screen'] = false;

    expect(evaluateRewardValidation(input).status).toBe('approved');
  });

  it('returns already-committed for an idempotent replay before evaluating evidence', () => {
    const input = baseInput();
    input.alreadyCommittedActivityIds = ['activity-1'];
    input.evidence['activity-verification'] = false;

    expect(evaluateRewardValidation(input)).toEqual({
      status: 'already-committed',
      approved: false,
      validationKey: 'reward-validation:activity-1',
      failedChecks: [],
      reasons: ['activity-already-committed'],
    });
  });

  it('rejects invalid identity or timestamp without inventing fraud evidence', () => {
    expect(
      evaluateRewardValidation({ ...baseInput(), userId: ' ' }),
    ).toMatchObject({
      status: 'rejected',
      reasons: ['invalid-user-id'],
    });

    expect(
      evaluateRewardValidation({ ...baseInput(), activityId: '' }),
    ).toMatchObject({
      status: 'rejected',
      validationKey: 'reward-validation:invalid-activity',
      reasons: ['invalid-activity-id'],
    });

    expect(
      evaluateRewardValidation({ ...baseInput(), verifiedAt: 'bad-date' }),
    ).toMatchObject({
      status: 'rejected',
      reasons: ['invalid-verified-at'],
    });
  });

  it('allows an explicitly empty required-check policy', () => {
    const input = baseInput();
    input.policy.requiredChecks = [];
    input.evidence['activity-verification'] = false;

    expect(evaluateRewardValidation(input).status).toBe('approved');
  });
});
