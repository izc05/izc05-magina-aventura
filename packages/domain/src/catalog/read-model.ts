import type {
  ActivityType,
  Adventure,
  CatalogPoi,
  CatalogSnapshot,
  OperationalStatus,
  Restriction,
  SimpleDifficulty,
} from '@magina-aventura/contracts';
import {
  calculateCompleteness,
  type CatalogCompleteness,
} from './completeness';
import { deriveOperationalStatus } from './operational-status';

export interface AdventureFilters {
  municipalityId?: string;
  activityType?: ActivityType;
  difficulty?: SimpleDifficulty;
  operationalStatus?: OperationalStatus;
}

export interface AdventureListItem {
  adventure: Adventure;
  operationalStatus: OperationalStatus;
}

export interface AdventureDetailView extends AdventureListItem {
  completeness: CatalogCompleteness;
  pois: CatalogPoi[];
  restrictions: Restriction[];
}

export interface CatalogReader {
  list(filters?: AdventureFilters): AdventureListItem[];
  bySlug(slug: string): AdventureDetailView | null;
  pois(adventureId: string): CatalogPoi[];
  restrictions(adventureId: string): Restriction[];
}

const adventureRestrictions = (
  snapshot: CatalogSnapshot,
  adventureId: string,
): Restriction[] =>
  snapshot.restrictions.filter(
    (restriction) =>
      restriction.scope.type === 'adventure' &&
      restriction.scope.adventureId === adventureId,
  );

const adventurePois = (
  snapshot: CatalogSnapshot,
  adventureId: string,
): CatalogPoi[] =>
  snapshot.pois.filter((poi) => poi.adventureIds.includes(adventureId));

const statusFor = (
  snapshot: CatalogSnapshot,
  adventureId: string,
): OperationalStatus =>
  deriveOperationalStatus(
    adventureId,
    snapshot.restrictions,
    snapshot.sources,
  );

const snapshotDate = (snapshot: CatalogSnapshot): Date => {
  const parsed = new Date(snapshot.generatedAt);
  return Number.isFinite(parsed.getTime()) ? parsed : new Date();
};

export function createCatalogReader(snapshot: CatalogSnapshot): CatalogReader {
  return {
    list(filters = {}) {
      return snapshot.adventures
        .map((adventure) => ({
          adventure,
          operationalStatus: statusFor(snapshot, adventure.id),
        }))
        .filter(({ adventure, operationalStatus }) => {
          if (
            filters.municipalityId !== undefined &&
            !adventure.municipalityIds.includes(filters.municipalityId)
          ) {
            return false;
          }

          if (
            filters.activityType !== undefined &&
            !adventure.activityTypes.includes(filters.activityType)
          ) {
            return false;
          }

          if (
            filters.difficulty !== undefined &&
            adventure.difficulty.simpleLabel !== filters.difficulty
          ) {
            return false;
          }

          if (
            filters.operationalStatus !== undefined &&
            operationalStatus !== filters.operationalStatus
          ) {
            return false;
          }

          return true;
        });
    },

    bySlug(slug) {
      const adventure = snapshot.adventures.find((item) => item.slug === slug);
      if (adventure === undefined) return null;

      return {
        adventure,
        operationalStatus: statusFor(snapshot, adventure.id),
        completeness: calculateCompleteness(
          adventure,
          snapshot,
          snapshotDate(snapshot),
        ),
        pois: adventurePois(snapshot, adventure.id),
        restrictions: adventureRestrictions(snapshot, adventure.id),
      };
    },

    pois(adventureId) {
      return adventurePois(snapshot, adventureId);
    },

    restrictions(adventureId) {
      return adventureRestrictions(snapshot, adventureId);
    },
  };
}
