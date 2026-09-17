import { describe, expect, it } from 'vitest';

import { resolveRewardReservationExpiry } from '../../../../../supabase/functions/_shared/reward-reservation-expiry';

const now = '2026-09-17T00:00:00.000Z';

describe('resolveRewardReservationExpiry', () => {
  it('prefers the reward-specific ttl over partner and platform defaults', () => {
    expect(
      resolveRewardReservationExpiry({
        now,
        rewardMetadata: { reservationTtlMinutes: 90 },
        partnerMetadata: { reservationTtlMinutes: 240 },
        platformDefaultTtlMinutes: 1440,
      }),
    ).toBe('2026-09-17T01:30:00.000Z');
  });

  it('falls back to partner and then platform configuration', () => {
    expect(
      resolveRewardReservationExpiry({
        now,
        rewardMetadata: {},
        partnerMetadata: { reservationTtlMinutes: 180 },
        platformDefaultTtlMinutes: 1440,
      }),
    ).toBe('2026-09-17T03:00:00.000Z');

    expect(
      resolveRewardReservationExpiry({
        now,
        rewardMetadata: {},
        partnerMetadata: {},
        platformDefaultTtlMinutes: 1440,
      }),
    ).toBe('2026-09-18T00:00:00.000Z');
  });

  it('rejects malformed or unsafe ttl configuration instead of silently inventing a duration', () => {
    expect(() =>
      resolveRewardReservationExpiry({
        now,
        rewardMetadata: { reservationTtlMinutes: 'forever' },
        partnerMetadata: {},
        platformDefaultTtlMinutes: 1440,
      }),
    ).toThrow('invalid reward reservation ttl');

    expect(() =>
      resolveRewardReservationExpiry({
        now,
        rewardMetadata: {},
        partnerMetadata: {},
        platformDefaultTtlMinutes: 0,
      }),
    ).toThrow('invalid platform reservation ttl');
  });
});
