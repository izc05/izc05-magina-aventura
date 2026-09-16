import type {
  Adventure,
  CatalogSnapshot,
  CatalogSource,
  Restriction,
  RouteShape,
  SimpleDifficulty,
} from '@magina-aventura/contracts';

const CHECKED_AT = '2026-09-16';

export const catalogSources: CatalogSource[] = [
  {
    id: 'junta-sierra-magina-directory',
    publisher: 'Junta de Andalucía · Ventana del Visitante',
    sourceType: 'official_authority',
    title: 'Sierra Mágina — equipamientos y senderos señalizados',
    url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/es6160007-sierra-m%C3%81gina',
    publishedAt: null,
    checkedAt: CHECKED_AT,
    licenseNote: null,
    verificationState: 'official_verified',
  },
  {
    id: 'junta-las-vinas',
    publisher: 'Junta de Andalucía · Ventana del Visitante',
    sourceType: 'official_authority',
    title: 'Sendero señalizado Las Viñas',
    url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/las-vi%C3%B1as/255035',
    publishedAt: null,
    checkedAt: CHECKED_AT,
    licenseNote: null,
    verificationState: 'official_verified',
  },
  {
    id: 'junta-hoyalinos',
    publisher: 'Junta de Andalucía · Ventana del Visitante',
    sourceType: 'official_authority',
    title: 'Sendero señalizado Hoyalinos',
    url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/hoyalinos/255035',
    publishedAt: null,
    checkedAt: CHECKED_AT,
    licenseNote: null,
    verificationState: 'official_verified',
  },
  {
    id: 'junta-cuadros-closure',
    publisher: 'Junta de Andalucía · Ventana del Visitante',
    sourceType: 'official_authority',
    title: 'Área recreativa Cuadros — aviso de cierre temporal',
    url: 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/cuadros/null',
    publishedAt: '2026-02-24',
    checkedAt: CHECKED_AT,
    licenseNote: null,
    verificationState: 'official_verified',
  },
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
  municipalityLabel: string;
  sourceIds?: string[];
  shape?: RouteShape | null;
  distanceKm?: number | null;
  durationMinutes?: number | null;
  difficulty?: SimpleDifficulty | null;
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
    municipalityIds: [input.municipalityId],
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
      factors: [],
    },
    accessibilityFacts: [],
    stableSafetyCharacteristics: [],
  };
};

export const catalogAdventures: Adventure[] = [
  createOfficialDraft({ id: 'ma-junta-001', slug: 'adelfal-de-cuadros', name: 'Adelfal de Cuadros', municipalityId: 'bedmar-y-garciez', municipalityLabel: 'Bedmar y Garcíez' }),
  createOfficialDraft({ id: 'ma-junta-002', slug: 'cano-del-aguadero', name: 'Caño del Aguadero', municipalityId: 'bedmar-y-garciez', municipalityLabel: 'Bedmar y Garcíez' }),
  createOfficialDraft({ id: 'ma-junta-003', slug: 'castillo-de-albanchez', name: 'Castillo de Albanchez', municipalityId: 'albanchez-de-magina', municipalityLabel: 'Albanchez de Mágina' }),
  createOfficialDraft({ id: 'ma-junta-004', slug: 'castillo-de-mata-bejid', name: 'Castillo de Mata Bejid', municipalityId: 'cambil', municipalityLabel: 'Cambil' }),
  createOfficialDraft({ id: 'ma-junta-005', slug: 'el-peralejo', name: 'El Peralejo', municipalityId: 'cambil', municipalityLabel: 'Cambil' }),
  createOfficialDraft({ id: 'ma-junta-006', slug: 'fuenmayor', name: 'Fuenmayor', municipalityId: 'torres', municipalityLabel: 'Torres' }),
  createOfficialDraft({ id: 'ma-junta-007', slug: 'gibralberca', name: 'Gibralberca', municipalityId: 'cambil', municipalityLabel: 'Cambil' }),
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
  createOfficialDraft({ id: 'ma-junta-009', slug: 'la-cueva-de-la-graja', name: 'La Cueva de la Graja', municipalityId: 'jimena', municipalityLabel: 'Jimena' }),
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
  createOfficialDraft({ id: 'ma-junta-011', slug: 'pinar-de-canava', name: 'Pinar de Cánava', municipalityId: 'jimena', municipalityLabel: 'Jimena' }),
  createOfficialDraft({ id: 'ma-junta-012', slug: 'puerto-de-la-mata', name: 'Puerto de la Mata', municipalityId: 'cambil', municipalityLabel: 'Cambil' }),
  createOfficialDraft({ id: 'ma-junta-013', slug: 'sierra-de-la-cruz', name: 'Sierra de la Cruz', municipalityId: 'jodar', municipalityLabel: 'Jódar' }),
  createOfficialDraft({ id: 'ma-junta-014', slug: 'subida-al-hoyo-de-la-laguna', name: 'Subida al Hoyo de la Laguna', municipalityId: 'belmez-de-la-moraleda', municipalityLabel: 'Bélmez de la Moraleda' }),
  createOfficialDraft({ id: 'ma-junta-015', slug: 'subida-a-pico-magina-y-miramundos', name: 'Subida a Pico Mágina y Miramundos', municipalityId: 'huelma', municipalityLabel: 'Huelma' }),
  createOfficialDraft({ id: 'ma-junta-016', slug: 'umbria-de-los-corzos', name: 'Umbría de los Corzos', municipalityId: 'cambil', municipalityLabel: 'Cambil' }),
  createOfficialDraft({ id: 'ma-junta-017', slug: 'veredon-mojon-blanco', name: 'Veredón-Mojón Blanco', municipalityId: 'pegalajar', municipalityLabel: 'Pegalajar' }),
];

export const catalogRestrictions: Restriction[] = [
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
  generatedAt: '2026-09-16T18:40:00Z',
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
