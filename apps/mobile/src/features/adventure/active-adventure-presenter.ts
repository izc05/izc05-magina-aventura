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
  const accuracy = snapshot.lastValidSample?.accuracyMeters;

  if (distance === null) {
    if (accuracy === undefined || accuracy === null) {
      return {
        title: 'Buscando señal',
        meta: 'Esperando primera posición GPS válida',
      };
    }

    return {
      title: 'GPS activo',
      meta: `Track oficial no disponible · precisión ±${Math.round(accuracy)} m`,
    };
  }

  if (snapshot.offRouteState === 'off_route') {
    return {
      title: 'Fuera de ruta',
      meta: `A ${Math.round(distance)} m del trazado`,
    };
  }

  if (snapshot.offRouteState === 'recovering') {
    return {
      title: 'Volviendo a la ruta',
      meta: `A ${Math.round(distance)} m del trazado`,
    };
  }

  if (snapshot.offRouteState === 'uncertain') {
    return {
      title: 'Comprobando trazado',
      meta: `Separación ${Math.round(distance)} m`,
    };
  }

  return {
    title: 'En ruta',
    meta:
      accuracy === undefined || accuracy === null
        ? 'Esperando mejor precisión GPS'
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
  const hasPositionWithoutVerifiedRoute =
    state.snapshot.lastValidSample !== null &&
    state.snapshot.distanceToRouteMeters === null;

  return {
    routeTitle: route.title,
    place: route.municipalityName,
    modeLabel: stateLabel(state),
    progress: hasPositionWithoutVerifiedRoute
      ? '—'
      : `${Math.round(Math.max(0, Math.min(1, state.snapshot.maxRouteProgress)) * 100)} %`,
    distance: formatDistance(state.snapshot.validDistanceMeters),
    elapsed: formatElapsed(state.snapshot.totalElapsedSeconds),
    elevation: `+${Math.round(Math.max(0, state.snapshot.elevationGainMeters))} m`,
    objectiveTitle: currentObjective.title,
    objectiveMeta: currentObjective.meta,
    rewardPreview,
  };
}
