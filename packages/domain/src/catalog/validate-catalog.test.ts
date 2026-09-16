import { describe, expect, it } from 'vitest';
import type { Adventure, CatalogSnapshot, CatalogSource } from '@magina-aventura/contracts';
import { validateCatalog } from './validate-catalog';

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
  summary: 'Ruta real de Sierra Mágina.',
  description: 'Ruta de catálogo.',
  activityTypes: ['hiking'],
  municipalityIds: ['bedmar-y-garciez'],
  shape: 'circular',
  publicationState: 'draft',
  verificationState: 'official_verified',
  sourceIds: ['source-1'],
  trackId: null,
  metrics: {
    distanceKm: 8.72,
    ascentM: null,
    descentM: null,
    minElevationM: null,
    maxElevationM: null,
    durationMinutesMin: 180,
    durationMinutesMax: 180,
  },
  difficulty: {
    physicalDemand: null,
    technicalTerrain: null,
    navigationComplexity: null,
    exposure: null,
    remoteness: null,
    simpleLabel: 'moderate',
    sourceIds: ['source-1'],
    verificationState: 'official_verified',
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

function snapshot(overrides: Partial<CatalogSnapshot> = {}): CatalogSnapshot {
  return {
    generatedAt: '2026-09-16T18:00:00Z',
    adventures: [adventure],
    tracks: [],
    pois: [],
    sources: [source],
    restrictions: [],
    ...overrides,
  };
}

describe('validateCatalog', () => {
  it('reports unknown source references', () => {
    const invalidAdventure = { ...adventure, sourceIds: ['missing-source'] };
    expect(validateCatalog(snapshot({ adventures: [invalidAdventure] }))).toContainEqual(
      expect.objectContaining({ code: 'unknown_source_reference', severity: 'error' }),
    );
  });

  it('reports unknown difficulty provenance', () => {
    const invalidAdventure: Adventure = {
      ...adventure,
      difficulty: { ...adventure.difficulty, sourceIds: ['missing-source'] },
    };
    expect(validateCatalog(snapshot({ adventures: [invalidAdventure] }))).toContainEqual(
      expect.objectContaining({ code: 'unknown_source_reference', severity: 'error' }),
    );
  });

  it('requires provenance for water facts', () => {
    const pois = [{
      id: 'poi-water',
      name: 'Fuente',
      category: 'water' as const,
      position: [-3.45, 37.7] as const,
      adventureIds: ['ma-001'],
      sourceIds: [],
      verificationState: 'unknown' as const,
      water: {
        potableStatus: 'confirmed' as const,
        seasonalReliability: 'unknown' as const,
        lastVerifiedAt: null,
      },
    }];

    expect(validateCatalog(snapshot({ pois }))).toContainEqual(
      expect.objectContaining({ code: 'sensitive_fact_without_provenance', severity: 'error' }),
    );
  });

  it('does not allow publishable route adventures without validated geometry', () => {
    const published = { ...adventure, publicationState: 'publishable' as const };
    expect(validateCatalog(snapshot({ adventures: [published] }))).toContainEqual(
      expect.objectContaining({ code: 'published_without_required_core_data', severity: 'error' }),
    );
  });
});
