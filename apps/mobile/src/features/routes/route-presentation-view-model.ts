import type { RouteDetail } from '@magina-aventura/contracts';

export type RouteDataOrigin =
  | 'verified'
  | 'development-simulation'
  | 'unverified';

export interface RoutePresentationViewModel {
  mode: 'verified' | 'preparing' | 'technical-gps-qa';
  title: string;
  municipalityName: string | null;
  stats: {
    distanceKm: number;
    elevationGainM: number;
    durationMinutes: number;
  } | null;
  rewardPreview: RouteDetail['rewardPreview'] | null;
  description: string | null;
  safetyNotes: string[];
  showVerifiedMap: boolean;
  showVerifiedCheckpoints: boolean;
  showVerifiedOfflinePackage: boolean;
  canStartPhysicalRoute: boolean;
  canCaptureTechnicalGps: boolean;
  preparationLabel: string;
  mapStatusLabel: string;
  checkpointStatusLabel: string;
  technicalGpsNotice: string | null;
}

type RoutePresentationInput = Pick<
  RouteDetail,
  | 'title'
  | 'municipalityName'
  | 'distanceKm'
  | 'elevationGainM'
  | 'durationMinutes'
  | 'rewardPreview'
> & Partial<Pick<RouteDetail, 'description' | 'safetyNotes' | 'developmentFixture'>>;

/**
 * Projects route content according to an explicit trust source. A fixture can
 * never become verified just because a caller accidentally labels it so.
 */
export function routePresentationViewModel(
  route: RoutePresentationInput,
  origin: RouteDataOrigin,
): RoutePresentationViewModel {
  const verified = origin === 'verified' && route.developmentFixture !== true;
  const technicalGpsQa =
    origin === 'development-simulation' && route.developmentFixture === true;

  return {
    mode: verified ? 'verified' : technicalGpsQa ? 'technical-gps-qa' : 'preparing',
    title: verified
      ? route.title
      : 'Ruta en preparación',
    municipalityName: verified ? route.municipalityName : null,
    stats: verified
      ? {
          distanceKm: route.distanceKm,
          elevationGainM: route.elevationGainM,
          durationMinutes: route.durationMinutes,
        }
      : null,
    rewardPreview: verified ? route.rewardPreview : null,
    description: verified ? route.description ?? null : null,
    safetyNotes: verified ? route.safetyNotes ?? [] : [],
    showVerifiedMap: verified,
    showVerifiedCheckpoints: verified,
    showVerifiedOfflinePackage: verified,
    canStartPhysicalRoute: verified,
    canCaptureTechnicalGps: technicalGpsQa,
    preparationLabel: verified
      ? 'CONTENIDO VERIFICADO'
      : technicalGpsQa
        ? 'SIMULACIÓN DE DESARROLLO'
        : 'CONTENIDO EN PREPARACIÓN',
    mapStatusLabel: verified
      ? 'Mapa verificado'
      : 'Cartografía verificada aún no disponible',
    checkpointStatusLabel: verified
      ? 'Checkpoints verificados'
      : 'Sin checkpoints verificados',
    technicalGpsNotice: technicalGpsQa
      ? 'La captura GPS técnica registra métricas auténticas del dispositivo; la ruta, el mapa y los objetivos de esta simulación no están verificados. No recorras una ruta basándote en estos datos.'
      : null,
  };
}
