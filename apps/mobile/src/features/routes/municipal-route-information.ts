export const municipalRouteInformation = {
  slug: 'sendero-fluvial-cueva-del-agua',
  title: 'Sendero Fluvial de la Cueva del Agua',
  municipality: 'Cuadros · Bedmar y Garcíez, Jaén',
  statusLabel: 'Estado reportado por el Ayuntamiento',
  statusDetail:
    'El Ayuntamiento lo comunica como habilitado para el público e indica que fue inaugurado en primavera de 2026.',
  endpoints: [
    'Puente Blanco de Las Tinajas',
    'Entrada de la Cueva del Agua',
  ] as const,
  directionNote:
    'El Ayuntamiento indica que puede recorrerse en ambos sentidos.',
  gpsNotice:
    'Trazado/mapa/checkpoints pendientes; sin navegación GPS.',
  nonNavigationNotice:
    'Ficha informativa basada en comunicaciones municipales; no es una guía para llegar ni para seguir el sendero.',
  sourceLabel: 'Aviso del Ayuntamiento · 9 de septiembre de 2026',
  sourceUrl: 'https://www.facebook.com/reel/28588117584209389/',
} as const;

export type MunicipalRouteInformation = typeof municipalRouteInformation;

export interface MunicipalRouteInformationViewModel {
  kind: 'municipal-information-only';
  title: string;
  municipality: string;
  statusLabel: string;
  statusDetail: string;
  endpoints: readonly [string, string];
  directionNote: string;
  gpsNotice: string;
  nonNavigationNotice: string;
  sourceLabel: string;
  sourceUrl: string;
  canStartPhysicalRoute: false;
  canCaptureTechnicalGps: false;
  showRouteMap: false;
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
 * This projection is intentionally separate from RouteDetail and the operational
 * route preparation flow. Keep this allowlist free of geometry, route metrics,
 * rewards, checkpoints, and GPS start actions until those facts are verified.
 */
export function municipalRouteInformationViewModel(): MunicipalRouteInformationViewModel {
  return {
    kind: 'municipal-information-only',
    title: municipalRouteInformation.title,
    municipality: municipalRouteInformation.municipality,
    statusLabel: municipalRouteInformation.statusLabel,
    statusDetail: municipalRouteInformation.statusDetail,
    endpoints: municipalRouteInformation.endpoints,
    directionNote: municipalRouteInformation.directionNote,
    gpsNotice: municipalRouteInformation.gpsNotice,
    nonNavigationNotice: municipalRouteInformation.nonNavigationNotice,
    sourceLabel: municipalRouteInformation.sourceLabel,
    sourceUrl: municipalRouteInformation.sourceUrl,
    canStartPhysicalRoute: false,
    canCaptureTechnicalGps: false,
    showRouteMap: false,
    showDistance: false,
    showElevation: false,
    showDuration: false,
    showDifficulty: false,
    showRewards: false,
    showCheckpoints: false,
  };
}
