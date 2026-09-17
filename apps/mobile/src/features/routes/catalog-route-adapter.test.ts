import { describe, it, expect } from 'vitest';
import { adaptCatalogRoute } from './catalog-route-adapter';
import type { AdventureDetailView } from '@magina-aventura/domain';
import type { ActivityType, PublicationState, RouteShape, VerificationState, OperationalStatus, SimpleDifficulty } from '@magina-aventura/contracts';

describe('catalog-route-adapter', () => {
  it('maps unverified geometry metrics to null', () => {
    const view: AdventureDetailView = {
      adventure: {
        id: '1',
        slug: 'test',
        name: 'Test',
        summary: '',
        description: '',
        activityTypes: ['hiking' as ActivityType],
        municipalityIds: [],
        shape: 'circular' as RouteShape,
        publicationState: 'publishable' as PublicationState,
        verificationState: 'official_verified' as VerificationState,
        sourceIds: [],
        trackId: null,
        metrics: {
          distanceKm: 10,
          ascentM: 500,
          descentM: 500,
          minElevationM: null,
          maxElevationM: null,
          durationMinutesMin: 120,
          durationMinutesMax: 180,
        },
        difficulty: {
          physicalDemand: null, technicalTerrain: null, navigationComplexity: null, exposure: null, remoteness: null,
          simpleLabel: 'moderate' as SimpleDifficulty, sourceIds: [], verificationState: 'official_verified'
        },
        family: { editorialSuitability: 'suitable', minimumAge: null, strollerViability: 'unknown', factors: [] },
        accessibilityFacts: [],
        stableSafetyCharacteristics: [],
      },
      operationalStatus: 'open' as OperationalStatus,
      completeness: {
        
        dimensions: { geometry: { complete: false, score: 0 }, pois: { complete: true, score: 1 }, identity: { complete: true, score: 1 }, metrics: { complete: true, score: 1 }, water: { complete: true, score: 1 }, difficulty: { complete: true, score: 1 }, safety: { complete: true, score: 1 }, family: { complete: true, score: 1 }, accessibility: { complete: true, score: 1 }, sources: { complete: true, score: 1 }, freshness: { complete: true, score: 1 } },
        overallScore: 1
        
      },
      pois: [],
      restrictions: []
    };

    const result = adaptCatalogRoute(view);
    expect(result.distanceKm).toBeNull();
    expect(result.elevationGainM).toBeNull();
    expect(result.durationMinutes).toBeNull();
    expect(result.operationalStatus).toBe('OPEN');
  });

  it('maps closed operational status correctly', () => {
    const view: AdventureDetailView = {
      adventure: {
        id: '2',
        slug: 'test-2',
        name: 'Test 2',
        summary: '',
        description: '',
        activityTypes: ['hiking' as ActivityType],
        municipalityIds: [],
        shape: 'circular' as RouteShape,
        publicationState: 'publishable' as PublicationState,
        verificationState: 'official_verified' as VerificationState,
        sourceIds: [],
        trackId: null,
        metrics: {
          distanceKm: 10,
          ascentM: 500,
          descentM: 500,
          minElevationM: null,
          maxElevationM: null,
          durationMinutesMin: 120,
          durationMinutesMax: 180,
        },
        difficulty: {
          physicalDemand: null, technicalTerrain: null, navigationComplexity: null, exposure: null, remoteness: null,
          simpleLabel: 'moderate' as SimpleDifficulty, sourceIds: [], verificationState: 'official_verified'
        },
        family: { editorialSuitability: 'suitable', minimumAge: null, strollerViability: 'unknown', factors: [] },
        accessibilityFacts: [],
        stableSafetyCharacteristics: [],
      },
      operationalStatus: 'closed' as OperationalStatus,
      completeness: {
        
        dimensions: { geometry: { complete: true, score: 1 }, pois: { complete: true, score: 1 }, identity: { complete: true, score: 1 }, metrics: { complete: true, score: 1 }, water: { complete: true, score: 1 }, difficulty: { complete: true, score: 1 }, safety: { complete: true, score: 1 }, family: { complete: true, score: 1 }, accessibility: { complete: true, score: 1 }, sources: { complete: true, score: 1 }, freshness: { complete: true, score: 1 } },
        overallScore: 1
        
      },
      pois: [],
      restrictions: []
    };

    const result = adaptCatalogRoute(view);
    expect(result.distanceKm).toBe(10);
    expect(result.elevationGainM).toBe(500);
    expect(result.durationMinutes).toBe(120);
    expect(result.operationalStatus).toBe('CLOSED');
  });
});
