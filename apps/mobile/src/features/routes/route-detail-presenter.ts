import type { AdventureRouteCard } from './route-types';
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
  route: AdventureRouteCard,
): RouteDetailPresentation {
  const betaDataPending = route.developmentFixture === true;

  return {
    distance: `${route.distanceKm.toLocaleString('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km`,
    elevation: betaDataPending ? 'Pendiente' : `+${route.elevationGainM} m`,
    duration: durationLabel(route.durationMinutes),
    difficulty: difficultyLabel(route.difficulty),
    rewardHeadline: betaDataPending
      ? 'Recompensas en validación'
      : `+${route.rewardPreview.xp} XP · +${route.rewardPreview.olives} aceitunas`,
    discoveries: betaDataPending
      ? 'Descubrimientos en preparación'
      : `${route.rewardPreview.discoveries} descubrimientos en la ruta`,
  };
}
