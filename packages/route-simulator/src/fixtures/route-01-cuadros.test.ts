import { describe, expect, it } from 'vitest';
import { canRedeemSponsorReward, isSponsorRewardActiveAt, qaProgressionSnapshot, validateAdventureContent } from '@magina-aventura/contracts';
import { route01CuadrosContent } from './route-01-cuadros';

describe('ROUTE-01 content fixture', () => {
  it('is simulation-only while the official route is closed', () => {
    expect(route01CuadrosContent.availability).toBe('simulation_only');
    expect(route01CuadrosContent.officialRouteStatus).toBe('temporarily_closed');
    expect(() => validateAdventureContent(route01CuadrosContent)).not.toThrow();
  });

  it('keeps every knowledge card sourced and separates editorial kinds', () => {
    expect(route01CuadrosContent.knowledgeCards).toHaveLength(8);
    expect(route01CuadrosContent.knowledgeCards.every((card) => card.sourceUrls.length > 0 && card.lastVerifiedAt)).toBe(true);
    expect(route01CuadrosContent.knowledgeCards.some((card) => card.kind === 'tradition')).toBe(false);
  });

  it('never authorizes a mock sponsor reward from a QA snapshot', () => {
    const snapshot = qaProgressionSnapshot(8720, ['cueva-agua'], ['cueva-agua-discovery']);
    expect(canRedeemSponsorReward(route01CuadrosContent.sponsorRewards[0]!, snapshot, true, '2026-09-29T12:00:00Z')).toBe(false);
  });

  it('enforces the sponsor reward validity window before redemption', () => {
    const reward = {
      ...route01CuadrosContent.sponsorRewards[0]!,
      status: 'active' as const,
      maxRedemptions: 1,
    };
    const snapshot = {
      ...qaProgressionSnapshot(8720, ['cueva-agua'], ['cueva-agua-discovery']),
      qaSimulated: false,
      sponsorRedemptionEligible: true,
    };

    expect(isSponsorRewardActiveAt(reward, '2026-01-01T00:00:00Z')).toBe(true);
    expect(isSponsorRewardActiveAt(reward, '2026-12-31T23:59:59Z')).toBe(true);
    expect(canRedeemSponsorReward(reward, snapshot, true, '2025-12-31T23:59:59Z')).toBe(false);
    expect(canRedeemSponsorReward(reward, snapshot, true, '2027-01-01T00:00:00Z')).toBe(false);
    expect(canRedeemSponsorReward(reward, snapshot, true, '2026-09-29T12:00:00Z')).toBe(true);
  });

  it('rejects reversed sponsor validity windows', () => {
    const invalid = {
      ...route01CuadrosContent,
      sponsorRewards: [{
        ...route01CuadrosContent.sponsorRewards[0]!,
        validFrom: '2027-01-01',
        validUntil: '2026-01-01',
      }],
    };
    expect(() => validateAdventureContent(invalid)).toThrow(/invalid validity window/);
  });
});
