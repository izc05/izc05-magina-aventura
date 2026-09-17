import type { MobileRouteView } from './mobile-route-view';
import { difficultyLabel, durationLabel } from './route-utils';

export type FeaturedRoutePresentation = Readonly<{
  distance: string;
  elevation: string;
  duration: string;
  difficulty: string;
  rewards: string;
}>;

export function presentFeaturedRoute(route: MobileRouteView): FeaturedRoutePresentation {
  const betaDataPending = route.developmentFixture === true;

  return {
    distance: route.distanceKm ? route.distanceKm.toFixed(1).replace('.', ',') + ' km' : 'Pendiente',
    elevation: betaDataPending || route.elevationGainM == null ? 'Pendiente' : '+' + route.elevationGainM + ' m',
    duration: durationLabel(route.durationMinutes ?? 0),
    difficulty: difficultyLabel(route.difficulty as any),
    rewards: betaDataPending
      ? 'Recompensas pendientes de validacion'
      : route.rewardsAvailable ? route.discoveriesCount + ' descubrimientos disponibles' : 'Sin recompensas',
  };
}