import type { ActivityEngineState } from '@magina-aventura/activity-engine';

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

function formatDistance(meters: number): string {
  return `${Math.max(0, meters / 1000).toFixed(2).replace('.', ',')} km`;
}

function formatElapsed(seconds: number): string {
  const total = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const rest = total % 60;

  if (hours > 0) {
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
  }

  return `${String(minutes).padStart(2, '0')}:${String(rest).padStart(2, '0')}`;
}

function stateLabel(state: ActivityEngineState): string {
  if (state.session.state === 'PAUSED') return 'AVENTURA EN PAUSA · GPS DETENIDO';
  if (state.session.state === 'FINISHED') return 'AVENTURA FINALIZADA';
  return 'GPS ACTIVO · GUARDADO OFFLINE';
}

function objective(state: ActivityEngineState): { title: string; meta: string } {
  const { snapshot } = state;
  const distance = snapshot.distanceToRouteMeters;

  if (snapshot.offRouteState === 'off_route') {
    return {
      title: 'Fuera de ruta',
      meta: distance === null ? 'Busca de nuevo el trazado' : `A ${Math.round(distance)} m del trazado`,
    };
  }

  if (snapshot.offRouteState === 'recovering') {
    return {
      title: 'Volviendo a la ruta',
      meta: distance === null ? 'Comprobando posición' : `A ${Math.round(distance)} m del trazado`,
    };
  }

  if (snapshot.offRouteState === 'uncertain') {
    return {
      title: 'Comprobando trazado',
      meta: distance === null ? 'Esperando mejor precisión GPS' : `Separación ${Math.round(distance)} m`,
    };
  }

  const accuracy = snapshot.lastValidSample?.accuracyMeters;
  return {
    title: 'En ruta',
    meta:
      accuracy === undefined || accuracy === null
        ? 'Esperando primera posición GPS válida'
        : `Precisión GPS ±${Math.round(accuracy)} m`,
  };
}

export function presentActiveAdventure(
  route: AdventureRouteCard,
  state?: ActivityEngineState | null,
): ActiveAdventurePresentation {
  const rewardPreview = `+${route.rewardPreview.xp} XP · +${route.rewardPreview.olives} aceitunas`;

  if (!state) {
    return {
      routeTitle: route.title,
      place: route.municipalityName,
      modeLabel: 'GPS PREPARADO · SIN ACTIVIDAD',
      progress: '0 %',
      distance: '0,00 km',
      elapsed: '00:00',
      elevation: '+0 m',
      objectiveTitle: 'Inicia la aventura',
      objectiveMeta: 'El track comenzará al activar el GPS',
      rewardPreview,
    };
  }

  const currentObjective = objective(state);

  return {
    routeTitle: route.title,
    place: route.municipalityName,
    modeLabel: stateLabel(state),
    progress: `${Math.round(Math.max(0, Math.min(1, state.snapshot.maxRouteProgress)) * 100)} %`,
    distance: formatDistance(state.snapshot.validDistanceMeters),
    elapsed: formatElapsed(state.snapshot.totalElapsedSeconds),
    elevation: `+${Math.round(Math.max(0, state.snapshot.elevationGainMeters))} m`,
    objectiveTitle: currentObjective.title,
    objectiveMeta: currentObjective.meta,
    rewardPreview,
  };
}
