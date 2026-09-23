import type { AdventureDefinition, RouteDetail, RouteMapPayload } from '@magina-aventura/contracts';

export type RouteExperiencePresentation = Readonly<{
  checkpointCount: number;
  discoveryCount: number;
  safetyCount: number;
  weatherStatus: string;
  weatherDetail: string;
  imageLabel: string;
  explorationLabel: string;
  targetNames: string[];
}>;

export function presentRouteExperience(
  route: RouteDetail,
  payload: RouteMapPayload | null,
  definition: AdventureDefinition | null,
): RouteExperiencePresentation {
  const checkpointCount = payload?.checkpoints.length ?? definition?.checkpoints.length ?? 0;
  const discoveryCount = payload?.discoveryHints.length ?? definition?.discoveries.length ?? route.rewardPreview.discoveries;
  const targetNames = [
    ...(payload?.checkpoints.map((checkpoint) => checkpoint.name) ?? []),
    ...(definition?.discoveries.map((discovery, index) => `Discovery ${index + 1}`) ?? []),
  ];

  return {
    checkpointCount,
    discoveryCount,
    safetyCount: route.safetyNotes.length,
    weatherStatus: 'Meteorología preparada',
    weatherDetail: 'Conexión meteorológica pendiente de integración',
    imageLabel: `Paisaje de ${route.municipalityName}`,
    explorationLabel: `${checkpointCount} checkpoint${checkpointCount === 1 ? '' : 's'} · ${discoveryCount} ${discoveryCount === 1 ? 'discovery' : 'discoveries'}`,
    targetNames,
  };
}
