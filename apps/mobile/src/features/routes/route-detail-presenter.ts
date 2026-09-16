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
  return {
    distance: `${route.distanceKm.toLocaleString('es-ES', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    })} km`,
    elevation: `+${route.elevationGainM} m`,
    duration: durationLabel(route.durationMinutes),
    difficulty: difficultyLabel(route.difficulty),
    rewardHeadline: `+${route.rewardPreview.xp} XP · +${route.rewardPreview.olives} aceitunas`,
    discoveries: `${route.rewardPreview.discoveries} descubrimientos en la ruta`,
  };
}
