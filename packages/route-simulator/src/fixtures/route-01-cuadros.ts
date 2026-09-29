import type { AdventureContentDefinition } from '@magina-aventura/contracts';
import { validateAdventureContent } from '@magina-aventura/contracts';

const junta = 'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante';
const ayuntamiento = 'https://www.bedmargarciez.es/';
const verified = '2026-09-29';

const checkpointSeeds = [
  ['portal-cuadros', 'Portal de Cuadros — Inicio', 0],
  ['corredor-adelfas', 'El corredor de adelfas — Naturaleza', 1100],
  ['sistillos', 'Los Sistillos — El agua', 2300],
  ['cornicabral', 'Cornicabral — Cambio de estación', 3400],
  ['garganta', 'La garganta — Geología', 4700],
  ['torreon-cuadros', 'Torreón de Cuadros — Frontera', 6100],
  ['santuario-cuadros', 'Santuario de Cuadros — Memoria', 7300],
  ['cueva-agua', 'Cueva del Agua — Final', 8720],
] as const;

const knowledgeCardSeeds = [
  ['portal-cuadros', 'Portal de Cuadros', 'fact', 'Inicio editorial de la aventura; la disponibilidad física queda bloqueada mientras la fuente oficial indique cierre temporal.'],
  ['corredor-adelfas', 'El adelfal del río Cuadros', 'fact', 'Tarjeta de naturaleza sobre el corredor de adelfas citado en la descripción oficial.'],
  ['sistillos', 'Los Sistillos', 'fact', 'Tarjeta sobre los nacimientos de agua citados por la ruta oficial.'],
  ['cornicabral', 'Cornicabral', 'interpretation', 'Lectura editorial para observar el cambio estacional en el paisaje.'],
  ['garganta', 'Rocas de la garganta', 'fact', 'La ruta describe formaciones carbonatadas jurásicas y cretácicas; el texto final requiere revisión editorial.'],
  ['torreon-cuadros', 'Torreón de Cuadros', 'fact', 'Patrimonio e historia documentados por fuentes municipales; no se mezclan con leyendas.'],
  ['santuario-cuadros', 'Memoria del Santuario', 'fact', 'Contenido histórico verificado; cualquier tradición local se publicará en una tarjeta separada y etiquetada.'],
  ['cueva-agua', 'Cueva del Agua', 'interpretation', 'Cierre narrativo de la aventura, pendiente de completar con la ficha oficial verificada.'],
] as const;

const discoverySeeds = [
  ['portal-cuadros', 'Primeras huellas'],
  ['corredor-adelfas', 'Hoja de adelfa'],
  ['sistillos', 'Gota de Cuadros'],
  ['cornicabral', 'Cambio de estación'],
  ['garganta', 'Fragmento geológico'],
  ['torreon-cuadros', 'Sello del vigía'],
  ['santuario-cuadros', 'Memoria del Santuario'],
  ['cueva-agua', 'Huellas de Cuadros'],
] as const;

const photoSpotSeeds = [
  ['corredor-adelfas', 'El corredor de adelfas'],
  ['cornicabral', 'Cornicabral'],
  ['santuario-cuadros', 'Santuario de Cuadros'],
  ['cueva-agua', 'Cueva del Agua'],
] as const;

const collectibleSeeds = [
  ['portal-cuadros', 'Primer rastro'],
  ['corredor-adelfas', 'Hoja de adelfa'],
  ['sistillos', 'Gota de Cuadros'],
  ['cornicabral', 'Cambio de estación'],
  ['garganta', 'Fragmento geológico'],
  ['torreon-cuadros', 'Sello del vigía'],
  ['santuario-cuadros', 'Memoria del Santuario'],
  ['cueva-agua', 'Huellas de Cuadros'],
] as const;

export const route01CuadrosContent = validateAdventureContent({
  routeId: 'route-01-cuadros',
  contentVersion: 1,
  title: 'Las Huellas de Cuadros',
  availability: 'simulation_only',
  officialRouteStatus: 'temporarily_closed',
  routeSourceUrls: [junta, ayuntamiento],
  lastVerifiedAt: verified,
  checkpoints: checkpointSeeds.map(([id, title, progressMeters], index) => ({
    id,
    title,
    summary: 'Contenido editorial pendiente de revisión de campo y geometría oficial.',
    required: true,
    progressMeters,
    knowledgeCardIds: [`${id}-card`],
    discoveryIds: [`${id}-discovery`],
    ...(index > 0 ? { prerequisiteCheckpointIds: [checkpointSeeds[index - 1]![0]] } : {}),
  })),
  knowledgeCards: knowledgeCardSeeds.map(([slug, title, kind, body]) => ({
    id: `${slug}-card`,
    title,
    kind,
    body,
    sourceUrls: [junta, ayuntamiento],
    lastVerifiedAt: verified,
  })),
  discoveries: discoverySeeds.map(([slug, title]) => ({
    id: `${slug}-discovery`,
    title,
    description: 'Coleccionable digital MOCK ligado a contenido editorial.',
    xp: 10,
    collectibleId: `${slug}-collectible`,
  })),
  photoSpots: photoSpotSeeds.map(([checkpointId, title], index) => ({
    id: `cuadros-photo-${index + 1}`,
    checkpointId,
    title,
    captionRequired: false,
    publicPoiOnly: true,
  })),
  collectibles: collectibleSeeds.map(([slug, title]) => ({
    id: `${slug}-collectible`,
    title,
    description: 'Coleccionable digital; no es un objeto físico.',
  })),
  sponsorRewards: [{
    sponsorId: 'mock-local-breakfast',
    title: '15 % en desayuno — patrocinador local (MOCK)',
    description: 'Contrato de ejemplo no canjeable.',
    rewardType: 'discount',
    discountValue: 15,
    terms: 'Solo diseño QA; sin comercio asociado.',
    validFrom: '2026-01-01',
    validUntil: '2026-12-31',
    maxRedemptions: 0,
    redemptionMode: 'single_use_code',
    eligibleRouteIds: ['route-01-cuadros'],
    requiredCompletionFacts: ['route.complete'],
    status: 'mock',
  }],
} satisfies AdventureContentDefinition);
