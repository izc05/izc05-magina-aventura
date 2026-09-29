import type {
  CatalogSnapshot,
  OperationalStatus,
} from '@magina-aventura/contracts';
import {
  calculateCompleteness,
  type CatalogCompleteness,
} from './completeness';
import { deriveOperationalStatus } from './operational-status';
import {
  validateCatalog,
  type CatalogValidationIssue,
} from './validate-catalog';

export interface AdventureQualityReport {
  id: string;
  slug: string;
  operationalStatus: OperationalStatus;
  hardErrors: CatalogValidationIssue[];
  completeness: CatalogCompleteness;
}

export interface CatalogQualityReport {
  hardErrorCount: number;
  adventures: AdventureQualityReport[];
}

export function buildCatalogQualityReport(
  snapshot: CatalogSnapshot,
  asOf: Date = new Date(),
): CatalogQualityReport {
  const issues = validateCatalog(snapshot);
  const hardErrors = issues.filter((issue) => issue.severity === 'error');

  return {
    hardErrorCount: hardErrors.length,
    adventures: snapshot.adventures.map((adventure) => ({
      id: adventure.id,
      slug: adventure.slug,
      operationalStatus: deriveOperationalStatus(
        adventure.id,
        snapshot.restrictions,
        snapshot.sources,
      ),
      hardErrors: hardErrors.filter(
        (issue) =>
          issue.entityType === 'adventure' && issue.entityId === adventure.id,
      ),
      completeness: calculateCompleteness(adventure, snapshot, asOf),
    })),
  };
}
