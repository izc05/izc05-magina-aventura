import type { AdventureRouteCard } from '../routes/route-types';

export type AdventureSummaryPresentation = Readonly<{
  title: string;
  routeTitle: string;
  place: string;
  distance: string;
  elapsed: string;
  elevation: string;
  xpRecorded: string;
  olivesRecorded: string;
  targetReward: string;
  note: string;
}>;

export function presentAdventureSummary(
  route: AdventureRouteCard,
): AdventureSummaryPresentation {
  return {
    title: 'Resumen de aventura',
    routeTitle: route.title,
    place: route.municipalityName,
    distance: '0,0 km',
    elapsed: '00:00',
    elevation: '+0 m',
    xpRecorded: '0 XP registrados',
    olivesRecorded: '0 aceitunas registradas',
    targetReward: `Objetivo: +${route.rewardPreview.xp} XP · +${route.rewardPreview.olives} aceitunas`,
    note: 'Vista demo: no se guarda actividad ni se conceden recompensas.',
  };
}
