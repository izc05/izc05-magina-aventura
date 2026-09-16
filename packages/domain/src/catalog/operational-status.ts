import type {
  CatalogSource,
  OperationalStatus,
  Restriction,
} from '@magina-aventura/contracts';

const isAuthoritativeSource = (source: CatalogSource): boolean =>
  source.verificationState === 'official_verified' ||
  source.verificationState === 'cross_checked';

const appliesToAdventure = (
  restriction: Restriction,
  adventureId: string,
): boolean =>
  restriction.scope.type === 'adventure' &&
  restriction.scope.adventureId === adventureId;

export function deriveOperationalStatus(
  adventureId: string,
  restrictions: Restriction[],
  sources: CatalogSource[] = [],
): OperationalStatus {
  const active = restrictions.filter(
    (restriction) =>
      restriction.status === 'active' &&
      appliesToAdventure(restriction, adventureId),
  );

  if (active.some((restriction) => restriction.severity === 'blocking')) {
    return 'closed';
  }

  if (active.some((restriction) => restriction.severity === 'restricting')) {
    return 'restricted';
  }

  if (active.some((restriction) => restriction.severity === 'warning')) {
    return 'caution';
  }

  const sourceById = new Map(sources.map((source) => [source.id, source]));
  const hasAuthoritativeOpenConfirmation = active.some(
    (restriction) =>
      restriction.type === 'open_confirmation' &&
      restriction.sourceIds.some((sourceId) => {
        const source = sourceById.get(sourceId);
        return source !== undefined && isAuthoritativeSource(source);
      }),
  );

  return hasAuthoritativeOpenConfirmation ? 'open' : 'unknown';
}
