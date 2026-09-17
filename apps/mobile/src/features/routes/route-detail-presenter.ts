import type { MobileRouteView } from './mobile-route-view';
import { difficultyLabel, durationLabel } from './route-utils';

export type RouteDetailPresentation = {
  distance: string;
  elevation: string;
  duration: string;
  difficulty: string;
  rewardHeadline: string;
  discoveries: string;
};

export function presentRouteDetail(
  route: MobileRouteView,
): RouteDetailPresentation {
  const betaDataPending = route.developmentFixture === true;

  return {
    distance: route.distanceKm ? route.distanceKm.toLocaleString('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }) + ' km' : 'Pendiente',
    elevation: betaDataPending || route.elevationGainM == null ? 'Pendiente' : '+' + route.elevationGainM + ' m',
    duration: durationLabel(route.durationMinutes ?? 0),
    difficulty: difficultyLabel(route.difficulty as any),
    rewardHeadline: betaDataPending
      ? 'Recompensas en validacion'
      : route.rewardsAvailable ? 'Recompensas disponibles' : 'Sin recompensas',
    discoveries: betaDataPending
      ? 'Descubrimientos en preparacion'
      : route.discoveriesCount + ' descubrimientos en la ruta',
  };
}