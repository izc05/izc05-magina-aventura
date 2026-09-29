import type { Adventure, CatalogSnapshot } from '@magina-aventura/contracts';

export type CompletenessDimension =
  | 'identity'
  | 'geometry'
  | 'metrics'
  | 'pois'
  | 'water'
  | 'difficulty'
  | 'safety'
  | 'family'
  | 'accessibility'
  | 'sources'
  | 'freshness';

export interface DimensionCompleteness {
  complete: boolean;
  score: number;
}

export interface CatalogCompleteness {
  dimensions: Record<CompletenessDimension, DimensionCompleteness>;
  overallScore: number;
}

const asDimension = (complete: boolean): DimensionCompleteness => ({
  complete,
  score: complete ? 100 : 0,
});

const daysBetween = (later: Date, earlier: Date): number =>
  Math.abs(later.getTime() - earlier.getTime()) / 86_400_000;

export function calculateCompleteness(
  adventure: Adventure,
  snapshot: CatalogSnapshot,
  asOf: Date = new Date(),
): CatalogCompleteness {
  const track = adventure.trackId
    ? snapshot.tracks.find((item) => item.id === adventure.trackId)
    : undefined;
  const pois = snapshot.pois.filter((poi) =>
    poi.adventureIds.includes(adventure.id),
  );
  const waterPois = pois.filter((poi) => poi.water !== null);
  const sourceIds = new Set(snapshot.sources.map((source) => source.id));
  const referencedSources = snapshot.sources.filter((source) =>
    adventure.sourceIds.includes(source.id),
  );

  const identityComplete =
    adventure.id.length > 0 &&
    adventure.slug.length > 0 &&
    adventure.name.length > 0 &&
    adventure.summary.length > 0 &&
    adventure.description.length > 0 &&
    adventure.municipalityIds.length > 0;

  const metricsComplete =
    adventure.metrics.distanceKm !== null &&
    adventure.metrics.durationMinutesMin !== null &&
    adventure.metrics.durationMinutesMax !== null;

  const difficultyComplete = Object.values(adventure.difficulty).every(
    (value) => value !== null && value !== undefined,
  );

  const sourcesComplete =
    adventure.sourceIds.length > 0 &&
    adventure.sourceIds.every((sourceId) => sourceIds.has(sourceId));

  const freshnessComplete =
    referencedSources.length > 0 &&
    referencedSources.every((source) => {
      const checked = new Date(source.checkedAt);
      return Number.isFinite(checked.getTime()) && daysBetween(asOf, checked) <= 180;
    });

  const dimensions: Record<CompletenessDimension, DimensionCompleteness> = {
    identity: asDimension(identityComplete),
    geometry: asDimension(
      track !== undefined &&
        (track.geometryQuality === 'verified' ||
          track.geometryQuality === 'cross_checked'),
    ),
    metrics: asDimension(metricsComplete),
    pois: asDimension(pois.length > 0),
    water: asDimension(
      waterPois.length > 0 &&
        waterPois.every(
          (poi) => poi.sourceIds.length > 0 && poi.water?.lastVerifiedAt !== null,
        ),
    ),
    difficulty: asDimension(difficultyComplete),
    safety: asDimension(
      adventure.stableSafetyCharacteristics.length > 0 ||
        snapshot.restrictions.some(
          (restriction) =>
            restriction.scope.type === 'adventure' &&
            restriction.scope.adventureId === adventure.id,
        ),
    ),
    family: asDimension(
      adventure.family.editorialSuitability !== 'review_required' ||
        adventure.family.factors.length > 0,
    ),
    accessibility: asDimension(adventure.accessibilityFacts.length > 0),
    sources: asDimension(sourcesComplete),
    freshness: asDimension(freshnessComplete),
  };

  const scores = Object.values(dimensions).map((dimension) => dimension.score);
  const overallScore = Math.round(
    scores.reduce((total, score) => total + score, 0) / scores.length,
  );

  return { dimensions, overallScore };
}
