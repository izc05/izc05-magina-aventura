export const municipalRouteInformation = {
  slug: 'sendero-fluvial-cueva-del-agua',
  title: 'Sendero Fluvial de la Cueva del Agua',
  municipality: 'Cuadros · Bedmar y Garcíez, Jaén',
  qaLabel: 'FICHA PILOTO MUNICIPAL',
  statusLabel: 'Información publicada por el Ayuntamiento',
  statusDetail:
    'El Ayuntamiento presentó el sendero como inaugurado en primavera e invitó a recorrerlo; la publicación no confirma las condiciones actuales del acceso.',
  endpoints: [
    'Puente Blanco de Las Tinajas',
    'Entrada de la Cueva del Agua',
  ] as const,
  directionNote:
    'El Ayuntamiento indica que puede recorrerse en ambos sentidos.',
  officialDataNotice:
    'La publicación municipal consultada no aporta distancia oficial ni un archivo GPX.',
  traceStatus: 'Trazado en preparación',
  gpsNotice:
    'No hay geometría verificada para seguimiento GPS; esta ficha no ofrece navegación.',
  nonNavigationNotice:
    'El mapa es solo contexto urbano aproximado: no representa el sendero ni marca su salida o llegada. No lo uses para llegar ni para orientarte por la ruta.',
  contextMap: {
    title: 'Contexto de Bedmar',
    areaLabel: 'Centro urbano aproximado',
    note:
      'Mapa base centrado cerca del núcleo principal de Bedmar. No señala el Puente Blanco, la cueva ni el trazado.',
    accessibilityLabel:
      'Mapa base de Bedmar, centrado aproximadamente en el núcleo urbano. No muestra la ruta, la salida ni la llegada.',
  },
  gallery: {
    title: 'Galería de la ruta',
    statusLabel: 'IMAGEN CON LICENCIA COMPATIBLE PENDIENTE',
    accessibilityLabel:
      'Galería vacía. No se muestra una fotografía porque falta una imagen con permiso o licencia compatible verificada.',
    body:
      'No se incorpora la foto localizada de esta cueva: su licencia Flickr CC BY-NC-ND 2.0 excluye usos comerciales y obras derivadas. Falta una foto original con autorización compatible o una licencia que permita el uso previsto.',
  },
  communityReference: {
    label: 'Referencia comunitaria · Wikiloc',
    note:
      'Referencia externa no oficial. Esta ficha no reproduce métricas, texto, fotos ni geometría de Wikiloc.',
    sourceLabel:
      'Abrir ficha comunitaria no oficial del Sendero Fluvial de la Cueva del Agua en Wikiloc',
    sourceUrl:
      'https://www.wikiloc.com/walking-trails/sendero-fluvial-cueva-del-agua-278776231',
  },
  generalHikingRecommendations: {
    title: 'Recomendaciones generales oficiales',
    attribution:
      'Fuente: Junta de Andalucía · Ventana del Visitante · «Senderismo», apartado «Buenas prácticas».',
    scopeNote:
      'Son orientaciones generales de senderismo; no constituyen una evaluación de seguridad específica del Sendero Fluvial de la Cueva del Agua ni verifican sus condiciones actuales.',
    items: [
      'Consulta la previsión meteorológica antes de iniciar tu actividad.',
      'Lleva agua, protección solar, ropa y calzado adecuados.',
      'Lleva un móvil con suficiente batería en caso de emergencia (112), pero recuerda que no siempre hay cobertura.',
      'Evita salir solo. Si lo haces, comunica recorrido y hora de regreso a otras personas.',
      'Por tu seguridad y la del entorno, no te salgas del camino señalizado ni tomes atajos.',
    ],
    sourceLabel: 'Recomendaciones generales de senderismo · Junta de Andalucía',
    sourceUrl:
      'https://www.juntadeandalucia.es/medioambiente/portal/web/ventanadelvisitante/detalle-actividad/-/asset_publisher/QYwm8uHC3ojh/content/senderismo-1/255035',
  },
  sourceLinks: [
    {
      id: 'municipal',
      label: 'Publicación del Ayuntamiento · 9 sep 2026',
      url: 'https://www.facebook.com/reel/28588117584209389/',
    },
    {
      id: 'map-center',
      label: 'Centro urbano aproximado · fuente secundaria',
      url: 'https://vivemasandalucia.es/municipios/bedmar-y-garciez/',
    },
    {
      id: 'photo-license',
      label: 'Foto localizada en Flickr · licencia no incorporada',
      url: 'https://www.flickr.com/photos/jamebla/51635640356/',
    },
    {
      id: 'base-map',
      label: 'Cartografía base · OpenFreeMap / OpenStreetMap',
      url: 'https://openfreemap.org/',
    },
  ] as const,
} as const;

export type MunicipalRouteInformation = typeof municipalRouteInformation;

export interface MunicipalRouteInformationViewModel {
  kind: 'municipal-information-only';
  qaLabel: string;
  title: string;
  municipality: string;
  statusLabel: string;
  statusDetail: string;
  endpoints: readonly [string, string];
  directionNote: string;
  officialDataNotice: string;
  traceStatus: string;
  gpsNotice: string;
  nonNavigationNotice: string;
  contextMap: MunicipalRouteInformation['contextMap'];
  gallery: MunicipalRouteInformation['gallery'];
  officialSource: MunicipalRouteInformation['sourceLinks'][0];
  communityReference: MunicipalRouteInformation['communityReference'];
  generalHikingRecommendations: MunicipalRouteInformation['generalHikingRecommendations'];
  sourceLinks: MunicipalRouteInformation['sourceLinks'];
  canStartPhysicalRoute: false;
  canCaptureTechnicalGps: false;
  showRouteMap: false;
  showContextMap: true;
  showGallerySlot: true;
  showDistance: false;
  showElevation: false;
  showDuration: false;
  showDifficulty: false;
  showRewards: false;
  showCheckpoints: false;
}

export function getMunicipalRouteInformationBySlug(
  slug: string | undefined,
): MunicipalRouteInformation | undefined {
  return slug === municipalRouteInformation.slug
    ? municipalRouteInformation
    : undefined;
}

/**
 * This projection deliberately separates official notice text from community
 * references. It must remain free of route geometry, checkpoints, rewards,
 * navigation, and official route metrics until those data are verified.
 */
export function municipalRouteInformationViewModel(): MunicipalRouteInformationViewModel {
  return {
    kind: 'municipal-information-only',
    qaLabel: municipalRouteInformation.qaLabel,
    title: municipalRouteInformation.title,
    municipality: municipalRouteInformation.municipality,
    statusLabel: municipalRouteInformation.statusLabel,
    statusDetail: municipalRouteInformation.statusDetail,
    endpoints: municipalRouteInformation.endpoints,
    directionNote: municipalRouteInformation.directionNote,
    officialDataNotice: municipalRouteInformation.officialDataNotice,
    traceStatus: municipalRouteInformation.traceStatus,
    gpsNotice: municipalRouteInformation.gpsNotice,
    nonNavigationNotice: municipalRouteInformation.nonNavigationNotice,
    contextMap: municipalRouteInformation.contextMap,
    gallery: municipalRouteInformation.gallery,
    officialSource: municipalRouteInformation.sourceLinks[0],
    communityReference: municipalRouteInformation.communityReference,
    generalHikingRecommendations: municipalRouteInformation.generalHikingRecommendations,
    sourceLinks: municipalRouteInformation.sourceLinks,
    canStartPhysicalRoute: false,
    canCaptureTechnicalGps: false,
    showRouteMap: false,
    showContextMap: true,
    showGallerySlot: true,
    showDistance: false,
    showElevation: false,
    showDuration: false,
    showDifficulty: false,
    showRewards: false,
    showCheckpoints: false,
  };
}
