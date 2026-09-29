import { describe, expect, it } from 'vitest';
import { canRedeemSponsorReward, qaProgressionSnapshot, validateAdventureContent } from '@magina-aventura/contracts';
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
    expect(canRedeemSponsorReward(route01CuadrosContent.sponsorRewards[0]!, snapshot, true)).toBe(false);
  });
});
