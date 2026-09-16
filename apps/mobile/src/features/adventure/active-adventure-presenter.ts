import type { AdventureRouteCard } from '../routes/route-types';

export type ActiveAdventurePresentation = Readonly<{
  routeTitle: string;
  place: string;
  modeLabel: string;
  progress: string;
  distance: string;
  elapsed: string;
  elevation: string;
  objectiveTitle: string;
  objectiveMeta: string;
  rewardPreview: string;
}>;

export function presentActiveAdventure(
  route: AdventureRouteCard,
): ActiveAdventurePresentation {
  return {
    routeTitle: route.title,
    place: route.municipalityName,
    modeLabel: 'MODO DEMO · GPS AÚN NO ACTIVO',
    progress: '0 %',
    distance: '0,0 km',
    elapsed: '00:00',
    elevation: '+0 m',
    objectiveTitle: 'Explora el entorno',
    objectiveMeta: 'Los descubrimientos aparecerán con el GPS real',
    rewardPreview: `+${route.rewardPreview.xp} XP · +${route.rewardPreview.olives} aceitunas`,
  };
}
