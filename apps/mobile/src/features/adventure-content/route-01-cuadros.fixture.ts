import type { AdventureContentDefinition } from '@magina-aventura/contracts';

const LAS_VINAS_URL =
  'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/las-vi%C3%B1as/255035';
const TORREON_URL =
  'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-buscador-mapa/-/asset_publisher/Jlbxh2qB3NwR/content/torre%C3%93n-de-cuadros';
const GEOLOGIA_URL =
  'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-actividad-espec-esp-nat';
const HISTORIA_URL =
  'https://www.bedmargarciez.es/turismo/patrimonio-historico/';
const NATURALEZA_URL =
  'https://bedmargarciez.es/turismo/patrimonio-natural/';

/**
 * Development-only editorial fixture for ROUTE-01.
 *
 * The official Las Vinas trail is currently marked temporarily closed by
 * Ventana del Visitante. This fixture is for content/QA simulation only and
 * must not be presented as an invitation to physically walk the route.
 */
export const route01CuadrosContent: AdventureContentDefinition = {
  routeId: 'dev-bedmar-cuadros-001',
  contentVersion: 1,
  title: 'Las Huellas de Cuadros',
  subtitle: 'Agua, frontera, naturaleza y memoria del territorio',
  sources: [
    {
      url: LAS_VINAS_URL,
      title: 'Sendero Las Vinas - Ventana del Visitante',
      publisher: 'Junta de Andalucia',
      lastVerifiedAt: '2026-09-29T16:45:00.000Z',
    },
    {
      url: TORREON_URL,
      title: 'Torreon de Cuadros - Ventana del Visitante',
      publisher: 'Junta de Andalucia',
      lastVerifiedAt: '2026-09-29T16:45:00.000Z',
    },
    {
      url: GEOLOGIA_URL,
      title: 'Geologia de Sierra Magina - Ventana del Visitante',
      publisher: 'Junta de Andalucia',
      lastVerifiedAt: '2026-09-29T16:45:00.000Z',
    },
    {
      url: HISTORIA_URL,
      title: 'Patrimonio Historico',
      publisher: 'Ayuntamiento de Bedmar y Garciez',
      lastVerifiedAt: '2026-09-29T16:45:00.000Z',
    },
    {
      url: NATURALEZA_URL,
      title: 'Patrimonio Natural',
      publisher: 'Ayuntamiento de Bedmar y Garciez',
      lastVerifiedAt: '2026-09-29T16:45:00.000Z',
    },
  ],
  knowledgeCards: [
    {
      id: 'knowledge-adelfal',
      kind: 'fact',
      title: 'El corredor de adelfas',
      summary:
        'El entorno del nacimiento del rio Cuadros conserva un bosque en galeria dominado por adelfas.',
      sourceUrls: [LAS_VINAS_URL, NATURALEZA_URL],
    },
    {
      id: 'knowledge-sistillos',
      kind: 'fact',
      title: 'Los Sistillos',
      summary:
        'El sendero oficial identifica Los Sistillos entre los principales nacimientos de agua de Bedmar.',
      sourceUrls: [LAS_VINAS_URL],
    },
    {
      id: 'knowledge-cornicabra',
      kind: 'fact',
      title: 'El cornicabral',
      summary:
        'La cornicabra aparece de forma abundante durante el ascenso y adquiere tonos amarillos y rojos en otono.',
      sourceUrls: [LAS_VINAS_URL],
    },
    {
      id: 'knowledge-geologia',
      kind: 'fact',
      title: 'La garganta del rio Cuadros',
      summary:
        'La garganta del rio Cuadros corta rocas carbonatadas jurásicas y cretacicas y forma parte del interes geologico de Sierra Magina.',
      sourceUrls: [GEOLOGIA_URL],
    },
    {
      id: 'knowledge-torreon',
      kind: 'fact',
      title: 'El vigia de Cuadros',
      summary:
        'La torre-atalaya de Cuadros reforzaba la defensa del reino de Jaen en una historica linea de frontera y fue declarada BIC en 1985.',
      sourceUrls: [TORREON_URL, HISTORIA_URL],
    },
    {
      id: 'knowledge-santuario',
      kind: 'fact',
      title: 'Memoria del Santuario',
      summary:
        'El Ayuntamiento documenta la devocion a la Virgen de Cuadros en las Relaciones de Felipe II de 1575 y fecha la construccion del santuario en 1615.',
      sourceUrls: [HISTORIA_URL],
    },
  ],
  photoSpots: [
    {
      id: 'photo-torreon-qa',
      checkpointId: 'cp-mid',
      title: 'Punto de foto: entorno del Torreon',
      prompt: 'Encuadra el paisaje sin salir del sendero ni acercarte a zonas de riesgo.',
      communityEligible: true,
    },
    {
      id: 'photo-final-qa',
      checkpointId: 'cp-finish',
      title: 'Punto de foto: final de aventura',
      communityEligible: true,
    },
  ],
  collectibles: [
    {
      id: 'collectible-gota-cuadros',
      title: 'Gota de Cuadros',
      category: 'landscape',
      rarityCode: 'common',
      discoveryId: 'knowledge-sistillos',
    },
    {
      id: 'collectible-hoja-adelfa',
      title: 'Hoja del adelfal',
      category: 'flora',
      rarityCode: 'common',
      discoveryId: 'knowledge-adelfal',
    },
    {
      id: 'collectible-sello-vigia',
      title: 'Sello del vigia',
      category: 'heritage',
      rarityCode: 'rare',
      discoveryId: 'knowledge-torreon',
    },
  ],
  sponsorRewards: [
    {
      id: 'reward-breakfast-mock',
      sponsorId: 'sponsor-local-mock',
      title: '15% en desayuno - DEMO',
      description:
        'Promocion ficticia para validar el flujo de recompensas comerciales.',
      rewardType: 'percentage_discount',
      discountValue: 15,
      terms:
        'Solo QA. No canjeable. No representa un acuerdo con ningun negocio.',
      validFrom: '2026-09-01T00:00:00.000Z',
      validUntil: '2027-09-01T00:00:00.000Z',
      redemptionMode: 'single_use_code',
      eligibleRouteIds: ['dev-bedmar-cuadros-001'],
      requiredCompletionFacts: ['route.completed', 'checkpoint:cp-finish'],
      active: false,
    },
  ],
};
