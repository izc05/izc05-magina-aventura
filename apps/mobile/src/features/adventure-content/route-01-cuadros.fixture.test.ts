import { describe, expect, it } from 'vitest';

import { validateAdventureContent } from '@magina-aventura/contracts';

import { route01CuadrosContent } from './route-01-cuadros.fixture';

describe('ROUTE-01 Cuadros content', () => {
  it('validates the sourced development fixture', () => {
    const validated = validateAdventureContent(route01CuadrosContent);

    expect(validated.routeId).toBe('dev-bedmar-cuadros-001');
    expect(validated.knowledgeCards.length).toBeGreaterThanOrEqual(6);
    expect(validated.sources.length).toBeGreaterThanOrEqual(4);
  });

  it('keeps the commercial reward disabled and explicitly mock', () => {
    const [reward] = route01CuadrosContent.sponsorRewards;

    expect(reward?.active).toBe(false);
    expect(reward?.title).toContain('DEMO');
    expect(reward?.terms).toContain('No canjeable');
  });

  it('requires factual cards to point at registered sources', () => {
    const broken = {
      ...route01CuadrosContent,
      knowledgeCards: [
        ...route01CuadrosContent.knowledgeCards,
        {
          id: 'knowledge-broken',
          kind: 'fact' as const,
          title: 'Dato sin fuente',
          summary: 'No debe pasar validacion.',
          sourceUrls: ['https://example.invalid/no-source'],
        },
      ],
    };

    expect(() => validateAdventureContent(broken)).toThrow(
      'Unknown knowledge source URL',
    );
  });

  it('rejects duplicate content ids across content families', () => {
    const broken = {
      ...route01CuadrosContent,
      photoSpots: [
        ...route01CuadrosContent.photoSpots,
        {
          id: 'knowledge-adelfal',
          checkpointId: 'cp-start',
          title: 'Duplicado',
          communityEligible: false,
        },
      ],
    };

    expect(() => validateAdventureContent(broken)).toThrow(
      'Duplicate adventure content id',
    );
  });
});
