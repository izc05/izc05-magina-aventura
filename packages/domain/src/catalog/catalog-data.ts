import type {
  Adventure,
  CatalogFact,
  CatalogSnapshot,
  CatalogSource,
  Restriction,
  RouteShape,
  SimpleDifficulty,
} from '@magina-aventura/contracts';

const CHECKED_AT = '2026-09-16';
const VENTANA_BASE =
  'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content';

const officialSource = (
  id: string,
  title: string,
  url: string,
  publishedAt: string | null = null,
): CatalogSource => ({
  id,
  publisher: 'Junta de Andalucía · Ventana del Visitante',
  sourceType: 'official_authority',
  title,
  url,
  publishedAt,
  checkedAt: CHECKED_AT,
  licenseNote: null,
  verificationState: 'official_verified',
});

export const catalogSources: CatalogSource[] = [
  officialSource(
    'junta-sierra-magina-directory',
    'Sierra Mágina — equipamientos y senderos señalizados',
    `${VENTANA_BASE}/es6160007-sierra-m%C3%81gina`,
  ),
  officialSource(
    'junta-adelfal-de-cuadros',
    'Sendero señalizado Adelfal de Cuadros',
    `${VENTANA_BASE}/adelfal-de-cuadros/`,
  ),
  officialSource(
    'junta-cano-del-aguadero',
    'Sendero señalizado Caño del Aguadero',
    `${VENTANA_BASE}/ca%C3%B1o-del-aguadero/255035`,
  ),
  officialSource(
    'junta-castillo-de-albanchez',
    'Sendero señalizado Castillo de Albanchez',
    `${VENTANA_BASE}/castillo-de-albanchez/255035`,
  ),
  officialSource(
    'junta-castillo-de-mata-bejid',
    'Sendero señalizado Castillo de Mata Bejid',
    `${VENTANA_BASE}/castillo-de-mata-bejid/255035`,
  ),
  officialSource(
    'junta-el-peralejo',
    'Sendero señalizado El Peralejo',
    `${VENTANA_BASE}/el-peralejo/255035`,
  ),
  officialSource(
    'junta-fuenmayor',
    'Sendero señalizado Fuenmayor',
    `${VENTANA_BASE}/fuenmayor/null`,
  ),
  officialSource(
    'junta-gibralberca',
    'Sendero señalizado Gibralberca',
    `${VENTANA_BASE}/gibralberca-1/255035`,
  ),
  officialSource(
    'junta-hoyalinos',
    'Sendero señalizado Hoyalinos',
    `${VENTANA_BASE}/hoyalinos/255035`,
  ),
  officialSource(
    'junta-cueva-de-la-graja',
    'Sendero señalizado La Cueva de la Graja',
    `${VENTANA_BASE}/la-cueva-de-la-graja/255035`,
  ),
  officialSource(
    'junta-las-vinas',
    'Sendero señalizado Las Viñas',
    `${VENTANA_BASE}/las-vi%C3%B1as/255035`,
  ),
  officialSource(
    'junta-pinar-de-canava',
    'Sendero señalizado Pinar de Cánava',
    `${VENTANA_BASE}/pinar-de-c%C3%A1nava/255035`,
  ),
  officialSource(
    'junta-puerto-de-la-mata',
    'Sendero señalizado Puerto de la Mata',
    `${VENTANA_BASE}/puerto-de-la-mata/255035`,
  ),
  officialSource(
    'junta-sierra-de-la-cruz',
    'Sendero señalizado Sierra de la Cruz',
    `${VENTANA_BASE}/sierra-de-la-cruz/255035`,
  ),
  officialSource(
    'junta-hoyo-de-la-laguna',
    'Sendero señalizado Subida al Hoyo de la Laguna',
    `${VENTANA_BASE}/subida-al-hoyo-de-la-laguna/`,
  ),
  officialSource(
    'junta-pico-magina-miramundos',
    'Sendero señalizado Subida a Pico Mágina y Miramundos',
    `${VENTANA_BASE}/subida-a-pico-m%C3%81gina-y-miramundos/255035`,
  ),
  officialSource(
    'junta-umbria-de-los-corzos',
    'Sendero señalizado Umbría de los Corzos',
    `${VENTANA_BASE}/umbr%C3%ADa-de-los-corzos/255035`,
  ),
  officialSource(
    'junta-veredon-mojon-blanco',
    'Sendero señalizado Veredón-Mojón Blanco',
    `${VENTANA_BASE}/vered%C3%93n-moj%C3%93n-blanco/255035`,
  ),
  officialSource(
    'junta-cuadros-closure',
    'Área recreativa Cuadros — aviso de cierre temporal',
    `${VENTANA_BASE}/cuadros/null`,
    '2026-02-24',
  ),
];

const emptyMetrics = () => ({
  distanceKm: null,
  ascentM: null,
  descentM: null,
  minElevationM: null,
  maxElevationM: null,
  durationMinutesMin: null,
  durationMinutesMax: null,
});

const unknownDifficulty = () => ({
  physicalDemand: null,
  technicalTerrain: null,
  navigationComplexity: null,
  exposure: null,
  remoteness: null,
  simpleLabel: null,
  sourceIds: [],
  verificationState: 'unknown' as const,
});

interface OfficialDraftInput {
  id: string;
  slug: string;
  name: string;
  municipalityId: string;
  municipalityIds?: string[];
  municipalityLabel: string;
  sourceIds?: string[];
  shape?: RouteShape | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  difficulty?: SimpleDifficulty | null;
  familyFactors?: CatalogFact[];
}

const createOfficialDraft = (input: OfficialDraftInput): Adventure => {
  const sourceIds = input.sourceIds ?? ['junta-sierra-magina-directory'];
  const hasDifficulty = input.difficulty !== undefined && input.difficulty !== null;

  return {
    id: input.id,
    slug: input.slug,
    name: input.name,
    summary: `Sendero señalizado oficial de Sierra Mágina en ${input.municipalityLabel}.`,
    description: `Entrada canónica en revisión para el sendero señalizado ${input.name}.`,
    activityTypes: ['hiking'],
    municipalityIds: input.municipalityIds ?? [input.municipalityId],
    shape: input.shape ?? null,
    publicationState: 'draft',
    verificationState: 'official_verified',
    sourceIds,
    trackId: null,
    metrics: {
      ...emptyMetrics(),
      distanceKm: input.distanceKm ?? null,
      durationMinutesMin: input.durationMinutes ?? null,
      durationMinutesMax: input.durationMinutes ?? null,
    },
    difficulty: hasDifficulty
      ? {
          physicalDemand: null,
          technicalTerrain: null,
          navigationComplexity: null,
          exposure: null,
          remoteness: null,
          simpleLabel: input.difficulty ?? null,
          sourceIds,
          verificationState: 'official_verified',
        }
      : unknownDifficulty(),
    family: {
      editorialSuitability: 'review_required',
      minimumAge: null,
      strollerViability: 'unknown',
      factors: input.familyFactors ?? [],
    },
    accessibilityFacts: [],
    stableSafetyCharacteristics: [],
  };
};

export const catalogAdventures: Adventure[] = [
  createOfficialDraft({
    id: 'ma-junta-001',
    slug: 'adelfal-de-cuadros',
    name: 'Adelfal de Cuadros',
    municipalityId: 'bedmar-y-garciez',
    municipalityLabel: 'Bedmar y Garcíez',
    sourceIds: ['junta-sierra-magina-directory', 'junta-adelfal-de-cuadros'],
    shape: 'linear',
    distanceKm: 0.453,
    durationMinutes: 20,
    difficulty: 'easy',
  }),
  createOfficialDraft({
    id: 'ma-junta-002',
    slug: 'cano-del-aguadero',
    name: 'Caño del Aguadero',
    municipalityId: 'bedmar-y-garciez',
    municipalityLabel: 'Bedmar y Garcíez',
    sourceIds: ['junta-sierra-magina-directory', 'junta-cano-del-aguadero'],
    shape: 'linear',
    distanceKm: 14.306,
    durationMinutes: 300,
    difficulty: 'hard',
  }),
  createOfficialDraft({
    id: 'ma-junta-003',
    slug: 'castillo-de-albanchez',
    name: 'Castillo de Albanchez',
    municipalityId: 'albanchez-de-magina',
    municipalityLabel: 'Albanchez de Mágina',
    sourceIds: ['junta-sierra-magina-directory', 'junta-castillo-de-albanchez'],
    shape: 'linear',
    distanceKm: 0.206,
    durationMinutes: 20,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-004',
    slug: 'castillo-de-mata-bejid',
    name: 'Castillo de Mata Bejid',
    municipalityId: 'cambil',
    municipalityLabel: 'Cambil',
    sourceIds: ['junta-sierra-magina-directory', 'junta-castillo-de-mata-bejid'],
    shape: 'linear',
    distanceKm: 3.55,
    durationMinutes: 75,
    difficulty: 'easy',
  }),
  createOfficialDraft({
    id: 'ma-junta-005',
    slug: 'el-peralejo',
    name: 'El Peralejo',
    municipalityId: 'cambil',
    municipalityLabel: 'Cambil',
    sourceIds: ['junta-sierra-magina-directory', 'junta-el-peralejo'],
    shape: 'circular',
    distanceKm: 2.268,
    durationMinutes: 60,
    difficulty: 'easy',
    familyFactors: [
      {
        code: 'official_family_friendly',
        text: 'La ficha oficial describe el sendero como corto, con poco desnivel y muy adecuado para ir con niños.',
        sourceIds: ['junta-el-peralejo'],
        verificationState: 'official_verified',
      },
    ],
  }),
  createOfficialDraft({
    id: 'ma-junta-006',
    slug: 'fuenmayor',
    name: 'Fuenmayor',
    municipalityId: 'torres',
    municipalityLabel: 'Torres',
    sourceIds: ['junta-sierra-magina-directory', 'junta-fuenmayor'],
    shape: 'linear',
    distanceKm: 6.405,
    durationMinutes: 140,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-007',
    slug: 'gibralberca',
    name: 'Gibralberca',
    municipalityId: 'cambil',
    municipalityLabel: 'Cambil',
    sourceIds: ['junta-sierra-magina-directory', 'junta-gibralberca'],
    shape: 'circular',
    distanceKm: 5.653,
    durationMinutes: 120,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-008',
    slug: 'hoyalinos',
    name: 'Hoyalinos',
    municipalityId: 'torres',
    municipalityLabel: 'Torres',
    sourceIds: ['junta-hoyalinos'],
    shape: 'circular',
    distanceKm: 2.092,
    durationMinutes: 60,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-009',
    slug: 'la-cueva-de-la-graja',
    name: 'La Cueva de la Graja',
    municipalityId: 'jimena',
    municipalityLabel: 'Jimena',
    sourceIds: ['junta-sierra-magina-directory', 'junta-cueva-de-la-graja'],
    shape: 'linear',
    distanceKm: 0.575,
    durationMinutes: 30,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-010',
    slug: 'las-vinas',
    name: 'Las Viñas',
    municipalityId: 'bedmar-y-garciez',
    municipalityLabel: 'Bedmar y Garcíez',
    sourceIds: ['junta-sierra-magina-directory', 'junta-las-vinas'],
    shape: 'circular',
    distanceKm: 8.72,
    durationMinutes: 180,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-011',
    slug: 'pinar-de-canava',
    name: 'Pinar de Cánava',
    municipalityId: 'jimena',
    municipalityLabel: 'Jimena',
    sourceIds: ['junta-sierra-magina-directory', 'junta-pinar-de-canava'],
    shape: 'linear',
    distanceKm: 2.35,
    durationMinutes: 60,
    difficulty: 'hard',
  }),
  createOfficialDraft({
    id: 'ma-junta-012',
    slug: 'puerto-de-la-mata',
    name: 'Puerto de la Mata',
    municipalityId: 'cambil',
    municipalityLabel: 'Cambil',
    sourceIds: ['junta-sierra-magina-directory', 'junta-puerto-de-la-mata'],
    shape: 'linear',
    distanceKm: 13.17,
    durationMinutes: 290,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-013',
    slug: 'sierra-de-la-cruz',
    name: 'Sierra de la Cruz',
    municipalityId: 'jodar',
    municipalityLabel: 'Jódar',
    sourceIds: ['junta-sierra-magina-directory', 'junta-sierra-de-la-cruz'],
    shape: 'circular',
    distanceKm: 7.292,
    durationMinutes: 150,
    difficulty: 'moderate',
  }),
  createOfficialDraft({
    id: 'ma-junta-014',
    slug: 'subida-al-hoyo-de-la-laguna',
    name: 'Subida al Hoyo de la Laguna',
    municipalityId: 'belmez-de-la-moraleda',
    municipalityLabel: 'Bélmez de la Moraleda',
    sourceIds: ['junta-sierra-magina-directory', 'junta-hoyo-de-la-laguna'],
    shape: 'linear',
    distanceKm: 5.475,
    durationMinutes: 180,
    difficulty: 'hard',
  }),
  createOfficialDraft({
    id: 'ma-junta-015',
    slug: 'subida-a-pico-magina-y-miramundos',
    name: 'Subida a Pico Mágina y Miramundos',
    municipalityId: 'huelma',
    municipalityLabel: 'Huelma',
    sourceIds: ['junta-sierra-magina-directory', 'junta-pico-magina-miramundos'],
    shape: 'linear',
    distanceKm: 14.773,
    durationMinutes: 300,
    difficulty: 'hard',
  }),
  createOfficialDraft({
    id: 'ma-junta-016',
    slug: 'umbria-de-los-corzos',
    name: 'Umbría de los Corzos',
    municipalityId: 'cambil',
    municipalityLabel: 'Cambil',
    sourceIds: ['junta-sierra-magina-directory', 'junta-umbria-de-los-corzos'],
    shape: 'linear',
    distanceKm: 2.63,
    durationMinutes: 60,
    difficulty: 'easy',
  }),
  createOfficialDraft({
    id: 'ma-junta-017',
    slug: 'veredon-mojon-blanco',
    name: 'Veredón-Mojón Blanco',
    municipalityId: 'pegalajar',
    municipalityIds: ['mancha-real', 'pegalajar', 'torres'],
    municipalityLabel: 'Mancha Real, Pegalajar y Torres',
    sourceIds: ['junta-sierra-magina-directory', 'junta-veredon-mojon-blanco'],
    shape: 'linear',
    distanceKm: 3.156,
    durationMinutes: 90,
    difficulty: 'moderate',
  }),
];

export const catalogRestrictions: Restriction[] = [
  {
    id: 'restriction-adelfal-de-cuadros-temporary-closure-2026',
    scope: { type: 'adventure', adventureId: 'ma-junta-001' },
    type: 'temporary_closure',
    severity: 'blocking',
    status: 'active',
    startsAt: null,
    endsAt: null,
    sourceIds: ['junta-adelfal-de-cuadros', 'junta-cuadros-closure'],
    publishedAt: '2026-02-24',
    checkedAt: CHECKED_AT,
    reason: 'La ficha oficial de Adelfal de Cuadros figura cerrada temporalmente y el entorno de Cuadros mantiene aviso oficial de cierre temporal.',
  },
  {
    id: 'restriction-las-vinas-temporary-closure-2026',
    scope: { type: 'adventure', adventureId: 'ma-junta-010' },
    type: 'temporary_closure',
    severity: 'blocking',
    status: 'active',
    startsAt: null,
    endsAt: null,
    sourceIds: ['junta-las-vinas', 'junta-cuadros-closure'],
    publishedAt: '2026-02-24',
    checkedAt: CHECKED_AT,
    reason: 'La ficha oficial de Las Viñas figura cerrada temporalmente y el entorno de Cuadros mantiene aviso oficial de cierre temporal.',
  },
];

const snapshot: CatalogSnapshot = {
  generatedAt: '2026-09-16T18:55:00Z',
  adventures: catalogAdventures,
  tracks: [],
  pois: [],
  sources: catalogSources,
  restrictions: catalogRestrictions,
};

export function getCatalogSnapshot(): CatalogSnapshot {
  return snapshot;
}

export function getAdventureBySlug(slug: string): Adventure | null {
  return catalogAdventures.find((adventure) => adventure.slug === slug) ?? null;
}
