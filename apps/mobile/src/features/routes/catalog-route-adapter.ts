import type { AdventureDetailView } from '@magina-aventura/domain';
import type { MobileRouteView, MobileOperationalStatus } from './mobile-route-view';

function mapOperationalStatus(status: string): MobileOperationalStatus {
  switch (status) {
    case 'open': return 'OPEN';
    case 'caution': return 'CAUTION';
    case 'restricted': return 'RESTRICTED';
    case 'closed': return 'CLOSED';
    default: return 'UNKNOWN';
  }
}

export function adaptCatalogRoute(view: AdventureDetailView): MobileRouteView {
  const { adventure, operationalStatus, pois, completeness, restrictions } = view;

  const isGeometryVerified = completeness.dimensions.geometry.complete;
  
  // Mobile UI uses a numeric difficulty 1-5 for backwards compatibility in UI,
  // or null if unknown.
  const difficultyMap: Record<string, number> = {
    easy: 1,
    moderate: 2,
    hard: 4,
    expert: 5,
  };

  const difficultyLevel = adventure.difficulty.simpleLabel 
    ? difficultyMap[adventure.difficulty.simpleLabel] ?? null 
    : null;

  const highestSeverityRestriction = restrictions.find(r => r.status === 'active' && (r.severity === 'blocking' || r.severity === 'restricting'));

  return {
    id: adventure.id,
    slug: adventure.slug,
    title: adventure.name,
    municipalityNames: adventure.municipalityIds, // Ideally mapped to human names
    distanceKm: isGeometryVerified ? adventure.metrics?.distanceKm : null,
    elevationGainM: isGeometryVerified ? adventure.metrics?.ascentM : null,
    durationMinutes: isGeometryVerified ? adventure.metrics?.durationMinutesMin : null,
    difficulty: difficultyLevel,
    operationalStatus: mapOperationalStatus(operationalStatus),
    safetyHeadline: highestSeverityRestriction ? highestSeverityRestriction.reason : null,
    discoveriesCount: 0, // Placeholder if discoveries are handled separately
    rewardsAvailable: completeness.dimensions.pois.complete,
    developmentFixture: false,
  };
}
