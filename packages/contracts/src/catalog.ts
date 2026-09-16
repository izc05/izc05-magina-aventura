export type VerificationState =
  | 'official_verified'
  | 'cross_checked'
  | 'community_unverified'
  | 'editorial_derived'
  | 'stale'
  | 'unknown';

export type PublicationState = 'draft' | 'publishable' | 'archived';
export type OperationalStatus =
  | 'open'
  | 'caution'
  | 'restricted'
  | 'closed'
  | 'unknown';
export type SimpleDifficulty = 'easy' | 'moderate' | 'hard' | 'expert';
export type ActivityType =
  | 'hiking'
  | 'family_walk'
  | 'nature'
  | 'heritage'
  | 'viewpoint_approach';
export type RouteShape = 'circular' | 'linear' | 'out_and_back';
export type SourceType =
  | 'official_authority'
  | 'municipality'
  | 'tourism_body'
  | 'trail_federation'
  | 'open_data'
  | 'local_organization'
  | 'community';

export interface CatalogSource {
  id: string;
  publisher: string;
  sourceType: SourceType;
  title: string;
  url: string;
  publishedAt: string | null;
  checkedAt: string;
  licenseNote: string | null;
  verificationState: VerificationState;
}

export interface CatalogFact {
  code: string;
  text: string;
  sourceIds: string[];
  verificationState: VerificationState;
}

export interface DifficultyFactors {
  physicalDemand: 1 | 2 | 3 | 4 | 5 | null;
  technicalTerrain: 1 | 2 | 3 | 4 | 5 | null;
  navigationComplexity: 1 | 2 | 3 | 4 | 5 | null;
  exposure: 1 | 2 | 3 | 4 | 5 | null;
  remoteness: 1 | 2 | 3 | 4 | 5 | null;
  simpleLabel: SimpleDifficulty | null;
  sourceIds: string[];
  verificationState: VerificationState;
}

export interface FamilyFactors {
  editorialSuitability:
    | 'suitable'
    | 'conditional'
    | 'not_recommended'
    | 'review_required';
  minimumAge: number | null;
  strollerViability: 'yes' | 'no' | 'unknown';
  factors: CatalogFact[];
}

export interface AccessibilityFact extends CatalogFact {
  feature:
    | 'surface'
    | 'width'
    | 'steps'
    | 'slope'
    | 'barrier'
    | 'adapted_parking'
    | 'adapted_facility';
}

export interface AdventureMetrics {
  distanceKm: number | null;
  ascentM: number | null;
  descentM: number | null;
  minElevationM: number | null;
  maxElevationM: number | null;
  durationMinutesMin: number | null;
  durationMinutesMax: number | null;
}

export interface Adventure {
  id: string;
  slug: string;
  name: string;
  summary: string;
  description: string;
  activityTypes: ActivityType[];
  municipalityIds: string[];
  shape: RouteShape;
  publicationState: PublicationState;
  verificationState: VerificationState;
  sourceIds: string[];
  trackId: string | null;
  metrics: AdventureMetrics;
  difficulty: DifficultyFactors;
  family: FamilyFactors;
  accessibilityFacts: AccessibilityFact[];
  stableSafetyCharacteristics: CatalogFact[];
}

export interface TrackAsset {
  id: string;
  adventureId: string;
  geometryVersion: number;
  format: 'gpx' | 'geojson' | 'kml' | 'gml';
  sourceIds: string[];
  verifiedAt: string | null;
  geometryQuality: 'verified' | 'cross_checked' | 'unverified';
  geometryRef: string;
  metrics: AdventureMetrics;
}

export interface WaterMetadata {
  potableStatus: 'confirmed' | 'not_confirmed' | 'not_potable' | 'unknown';
  seasonalReliability: 'reliable' | 'seasonal' | 'unknown';
  lastVerifiedAt: string | null;
}

export interface CatalogPoi {
  id: string;
  name: string;
  category:
    | 'water'
    | 'viewpoint'
    | 'parking'
    | 'recreation_area'
    | 'refuge'
    | 'geology'
    | 'heritage'
    | 'visitor_facility'
    | 'village_service'
    | 'emergency_reference';
  position: readonly [longitude: number, latitude: number];
  adventureIds: string[];
  sourceIds: string[];
  verificationState: VerificationState;
  water: WaterMetadata | null;
}

export interface Restriction {
  id: string;
  scope:
    | { type: 'adventure'; adventureId: string }
    | { type: 'poi'; poiId: string }
    | { type: 'area'; areaRef: string };
  type:
    | 'temporary_closure'
    | 'access_restriction'
    | 'wildfire'
    | 'forestry_works'
    | 'hunting'
    | 'weather'
    | 'damaged_trail'
    | 'water_outage'
    | 'open_confirmation';
  severity: 'info' | 'warning' | 'restricting' | 'blocking';
  status: 'active' | 'scheduled' | 'resolved' | 'unknown';
  startsAt: string | null;
  endsAt: string | null;
  sourceIds: string[];
  publishedAt: string | null;
  checkedAt: string;
  reason: string;
}

export interface CatalogSnapshot {
  generatedAt: string;
  adventures: Adventure[];
  tracks: TrackAsset[];
  pois: CatalogPoi[];
  sources: CatalogSource[];
  restrictions: Restriction[];
}
