import type { Adventure, CatalogSnapshot, Restriction } from './catalog';

const adventure = {
  id: 'ma-001',
  slug: 'las-vinas',
  name: 'Las Viñas',
  summary: 'Ruta de senderismo en el entorno de Cuadros.',
  description: 'Entrada canónica de catálogo.',
  activityTypes: ['hiking'],
  municipalityIds: ['bedmar-y-garciez'],
  shape: 'circular',
  publicationState: 'draft',
  verificationState: 'official_verified',
  sourceIds: ['source-junta-las-vinas'],
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
    sourceIds: ['source-junta-las-vinas'],
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
} satisfies Adventure;

const draftWithUnknownShape = {
  ...adventure,
  id: 'ma-002',
  slug: 'draft-with-unknown-shape',
  shape: null,
  sourceIds: ['source-junta-directory'],
  difficulty: {
    physicalDemand: null,
    technicalTerrain: null,
    navigationComplexity: null,
    exposure: null,
    remoteness: null,
    simpleLabel: null,
    sourceIds: ['source-junta-directory'],
    verificationState: 'official_verified',
  },
} satisfies Adventure;

const restriction = {
  id: 'restriction-las-vinas-closure',
  scope: { type: 'adventure', adventureId: adventure.id },
  type: 'temporary_closure',
  severity: 'blocking',
  status: 'active',
  startsAt: null,
  endsAt: null,
  sourceIds: ['source-junta-las-vinas'],
  publishedAt: null,
  checkedAt: '2026-09-16',
  reason: 'Temporary closure recorded by the responsible authority.',
} satisfies Restriction;

const snapshot = {
  generatedAt: '2026-09-16T18:00:00Z',
  adventures: [adventure, draftWithUnknownShape],
  tracks: [],
  pois: [],
  sources: [],
  restrictions: [restriction],
} satisfies CatalogSnapshot;

void snapshot;
