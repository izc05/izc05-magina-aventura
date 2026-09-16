import { describe, expect, it } from 'vitest';
import type { Adventure, CatalogSnapshot, CatalogSource } from '@magina-aventura/contracts';
import { calculateCompleteness } from './completeness';

const source: CatalogSource = {
  id: 'source-1',
  publisher: 'Junta de Andalucía',
  sourceType: 'official_authority',
  title: 'Ficha oficial',
  url: 'https://example.test/source',
  publishedAt: null,
  checkedAt: '2026-09-16',
  licenseNote: null,
  verificationState: 'official_verified',
};

const adventure: Adventure = {
  id: 'ma-001',
  slug: 'las-vinas-cuadros',
  name: 'Las Viñas',
  summary: 'Ruta de senderismo.',
  description: 'Ruta de catálogo.',
  activityTypes: ['hiking'],
  municipalityIds: ['bedmar-y-garciez'],
  shape: 'circular',
  publicationState: 'draft',
  verificationState: 'official_verified',
  sourceIds: ['source-1'],
  trackId: null,
  metrics: {
    distanceKm: 8.7,
    ascentM: null,
    descentM: null,
    minElevationM: null,
    maxElevationM: null,
    durationMinutesMin: 180,
    durationMinutesMax: 180,
  },
  difficulty: {
    physicalDemand: 3,
    technicalTerrain: 2,
    navigationComplexity: 2,
    exposure: 1,
    remoteness: 2,
    simpleLabel: 'moderate',
  },
  family: {
    editorialSuitability: 'review_required',
    minimumAge: null,
    strollerViability: 'unknown',
    factors: [],
  },
  accessibilityFacts: [],
  stableSafetyCharacteristics: [],
};

const snapshot: CatalogSnapshot = {
  generatedAt: '2026-09-16T18:00:00Z',
  adventures: [adventure],
  tracks: [],
  pois: [],
  sources: [source],
  restrictions: [],
};

describe('calculateCompleteness', () => {
  it('reports identity and sources complete while geometry remains incomplete', () => {
    const report = calculateCompleteness(adventure, snapshot, new Date('2026-09-16T18:00:00Z'));
    expect(report.dimensions.identity.complete).toBe(true);
    expect(report.dimensions.sources.complete).toBe(true);
    expect(report.dimensions.geometry.complete).toBe(false);
    expect(report.overallScore).toBeGreaterThan(0);
    expect(report.overallScore).toBeLessThan(100);
  });
});
