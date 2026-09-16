import type { AdventureRouteCard } from './route-types';
import { difficultyLabel, durationLabel } from './route-utils';

export type FeaturedRoutePresentation = Readonly<{
  distance: string;
  elevation: string;
  duration: string;
  difficulty: string;
  rewards: string;
}>;

export function presentFeaturedRoute(route: AdventureRouteCard): FeaturedRoutePresentation {
  return {
    distance: `${route.distanceKm.toFixed(1).replace('.', ',')} km`,
    elevation: `+${route.elevationGainM} m`,
    duration: durationLabel(route.durationMinutes),
    difficulty: difficultyLabel(route.difficulty),
    rewards: `${route.rewardPreview.discoveries} descubrimientos · +${route.rewardPreview.xp} XP · +${route.rewardPreview.olives} aceitunas`,
  };
}
