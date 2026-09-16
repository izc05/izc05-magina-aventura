import type {
  Adventure,
  CatalogFact,
  CatalogSnapshot,
  Restriction,
} from '@magina-aventura/contracts';

export type CatalogValidationCode =
  | 'duplicate_id'
  | 'duplicate_slug'
  | 'unknown_source_reference'
  | 'unknown_track_reference'
  | 'unknown_poi_reference'
  | 'sensitive_fact_without_provenance'
  | 'invalid_checked_at'
  | 'published_without_required_core_data';

export interface CatalogValidationIssue {
  code: CatalogValidationCode;
  severity: 'error' | 'warning';
  entityType: 'adventure' | 'track' | 'poi' | 'source' | 'restriction';
  entityId: string;
  message: string;
}

const validDate = (value: string | null): boolean =>
  value === null || Number.isFinite(Date.parse(value));

const pushUnknownSources = (
  issues: CatalogValidationIssue[],
  sourceIds: string[],
  knownSourceIds: Set<string>,
  entityType: CatalogValidationIssue['entityType'],
  entityId: string,
): void => {
  for (const sourceId of sourceIds) {
    if (!knownSourceIds.has(sourceId)) {
      issues.push({
        code: 'unknown_source_reference',
        severity: 'error',
        entityType,
        entityId,
        message: `Unknown source reference: ${sourceId}`,
      });
    }
  }
};

const requireFactProvenance = (
  issues: CatalogValidationIssue[],
  facts: CatalogFact[],
  entityId: string,
): void => {
  for (const fact of facts) {
    if (fact.sourceIds.length === 0) {
      issues.push({
        code: 'sensitive_fact_without_provenance',
        severity: 'error',
        entityType: 'adventure',
        entityId,
        message: `Sensitive fact ${fact.code} has no provenance.`,
      });
    }
  }
};

const hasPublishableCore = (
  adventure: Adventure,
  snapshot: CatalogSnapshot,
): boolean => {
  if (
    adventure.sourceIds.length === 0 ||
    adventure.metrics.distanceKm === null ||
    adventure.metrics.durationMinutesMin === null ||
    adventure.metrics.durationMinutesMax === null ||
    adventure.trackId === null
  ) {
    return false;
  }

  const track = snapshot.tracks.find((item) => item.id === adventure.trackId);
  return (
    track !== undefined &&
    (track.geometryQuality === 'verified' ||
      track.geometryQuality === 'cross_checked')
  );
};

const reportDuplicates = (
  issues: CatalogValidationIssue[],
  entityType: CatalogValidationIssue['entityType'],
  ids: string[],
): void => {
  const seen = new Set<string>();
  for (const id of ids) {
    if (seen.has(id)) {
      issues.push({
        code: 'duplicate_id',
        severity: 'error',
        entityType,
        entityId: id,
        message: `Duplicate ${entityType} id: ${id}`,
      });
    }
    seen.add(id);
  }
};

const validateRestrictionProvenance = (
  issues: CatalogValidationIssue[],
  restriction: Restriction,
): void => {
  if (restriction.sourceIds.length === 0) {
    issues.push({
      code: 'sensitive_fact_without_provenance',
      severity: 'error',
      entityType: 'restriction',
      entityId: restriction.id,
      message: 'Operational restriction has no provenance.',
    });
  }
};

export function validateCatalog(
  snapshot: CatalogSnapshot,
): CatalogValidationIssue[] {
  const issues: CatalogValidationIssue[] = [];
  const knownSourceIds = new Set(snapshot.sources.map((source) => source.id));
  const knownTrackIds = new Set(snapshot.tracks.map((track) => track.id));
  const knownAdventureIds = new Set(
    snapshot.adventures.map((adventure) => adventure.id),
  );

  reportDuplicates(
    issues,
    'adventure',
    snapshot.adventures.map((adventure) => adventure.id),
  );
  reportDuplicates(issues, 'track', snapshot.tracks.map((track) => track.id));
  reportDuplicates(issues, 'poi', snapshot.pois.map((poi) => poi.id));
  reportDuplicates(issues, 'source', snapshot.sources.map((source) => source.id));
  reportDuplicates(
    issues,
    'restriction',
    snapshot.restrictions.map((restriction) => restriction.id),
  );

  const seenSlugs = new Set<string>();
  for (const adventure of snapshot.adventures) {
    if (seenSlugs.has(adventure.slug)) {
      issues.push({
        code: 'duplicate_slug',
        severity: 'error',
        entityType: 'adventure',
        entityId: adventure.id,
        message: `Duplicate adventure slug: ${adventure.slug}`,
      });
    }
    seenSlugs.add(adventure.slug);

    pushUnknownSources(
      issues,
      adventure.sourceIds,
      knownSourceIds,
      'adventure',
      adventure.id,
    );

    if (adventure.trackId !== null && !knownTrackIds.has(adventure.trackId)) {
      issues.push({
        code: 'unknown_track_reference',
        severity: 'error',
        entityType: 'adventure',
        entityId: adventure.id,
        message: `Unknown track reference: ${adventure.trackId}`,
      });
    }

    requireFactProvenance(
      issues,
      adventure.stableSafetyCharacteristics,
      adventure.id,
    );
    requireFactProvenance(issues, adventure.family.factors, adventure.id);
    requireFactProvenance(issues, adventure.accessibilityFacts, adventure.id);

    if (
      adventure.publicationState === 'publishable' &&
      !hasPublishableCore(adventure, snapshot)
    ) {
      issues.push({
        code: 'published_without_required_core_data',
        severity: 'error',
        entityType: 'adventure',
        entityId: adventure.id,
        message:
          'Publishable adventure is missing source-backed core data or validated geometry.',
      });
    }
  }

  for (const source of snapshot.sources) {
    if (!validDate(source.checkedAt) || !validDate(source.publishedAt)) {
      issues.push({
        code: 'invalid_checked_at',
        severity: 'error',
        entityType: 'source',
        entityId: source.id,
        message: 'Source contains an invalid date.',
      });
    }
  }

  for (const track of snapshot.tracks) {
    pushUnknownSources(
      issues,
      track.sourceIds,
      knownSourceIds,
      'track',
      track.id,
    );
  }

  for (const poi of snapshot.pois) {
    pushUnknownSources(issues, poi.sourceIds, knownSourceIds, 'poi', poi.id);

    if (poi.water !== null && poi.sourceIds.length === 0) {
      issues.push({
        code: 'sensitive_fact_without_provenance',
        severity: 'error',
        entityType: 'poi',
        entityId: poi.id,
        message: 'Water-point data has no provenance.',
      });
    }

    for (const adventureId of poi.adventureIds) {
      if (!knownAdventureIds.has(adventureId)) {
        issues.push({
          code: 'unknown_poi_reference',
          severity: 'error',
          entityType: 'poi',
          entityId: poi.id,
          message: `POI references unknown adventure: ${adventureId}`,
        });
      }
    }
  }

  for (const restriction of snapshot.restrictions) {
    pushUnknownSources(
      issues,
      restriction.sourceIds,
      knownSourceIds,
      'restriction',
      restriction.id,
    );
    validateRestrictionProvenance(issues, restriction);

    if (
      !validDate(restriction.checkedAt) ||
      !validDate(restriction.publishedAt) ||
      !validDate(restriction.startsAt) ||
      !validDate(restriction.endsAt)
    ) {
      issues.push({
        code: 'invalid_checked_at',
        severity: 'error',
        entityType: 'restriction',
        entityId: restriction.id,
        message: 'Restriction contains an invalid date.',
      });
    }
  }

  return issues;
}
