import type { AdventureDefinition, RouteMapPayload } from '@magina-aventura/contracts';
import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import { explorationTargetKey } from '@magina-aventura/activity-engine';

export type ExplorationPresentation = Readonly<{
  completedCount: number;
  totalCount: number;
  progressLabel: string;
  nextKind: 'checkpoint' | 'discovery' | 'complete' | 'unknown';
  nextTitle: string;
  nextMeta: string;
  latestEventKind: 'checkpoint' | 'discovery' | null;
  latestEventTitle: string | null;
  latestEventMeta: string | null;
}>;

function titleForTarget(
  kind: 'checkpoint' | 'discovery',
  id: string,
  payload: RouteMapPayload | null,
  definition: AdventureDefinition,
): string {
  if (kind === 'checkpoint') {
    return payload?.checkpoints.find((checkpoint) => checkpoint.id === id)?.name ?? 'Checkpoint de ruta';
  }

  const discoveryNumber = definition.discoveries
    .slice()
    .sort((left, right) => left.sequence - right.sequence)
    .findIndex((target) => target.id === id) + 1;
  return discoveryNumber > 0 ? `Discovery ${discoveryNumber}` : 'Discovery de la ruta';
}

export function presentExploration(
  definition: AdventureDefinition | null,
  state: ActivityEngineState | null | undefined,
  payload: RouteMapPayload | null,
): ExplorationPresentation {
  if (!definition) {
    return {
      completedCount: 0,
      totalCount: 0,
      progressLabel: 'Exploración pendiente',
      nextKind: 'unknown',
      nextTitle: 'Siguiente objetivo',
      nextMeta: 'Contenido de aventura no disponible',
      latestEventKind: null,
      latestEventTitle: null,
      latestEventMeta: null,
    };
  }

  const targets = [...definition.checkpoints, ...definition.discoveries].sort(
    (left, right) => left.sequence - right.sequence,
  );
  const unlocked = new Set(state?.exploration?.unlockedTargetKeys ?? []);
  const completedCount = targets.filter((target) =>
    unlocked.has(explorationTargetKey(target.kind, target.id)),
  ).length;
  const next = targets.find((target) => {
    const key = explorationTargetKey(target.kind, target.id);
    return !unlocked.has(key) && target.prerequisiteTargetKeys.every((prerequisite) => unlocked.has(prerequisite));
  });
  const latest = state?.explorationObservations?.at(-1) ?? null;

  if (!next && targets.length > 0 && completedCount === targets.length) {
    return {
      completedCount,
      totalCount: targets.length,
      progressLabel: `${completedCount}/${targets.length} objetivos`,
      nextKind: 'complete',
      nextTitle: 'Ruta de exploración completa',
      nextMeta: 'Puedes continuar el track o finalizar la aventura cuando quieras',
      latestEventKind: latest?.kind ?? null,
      latestEventTitle: latest ? titleForTarget(latest.kind, latest.targetId, payload, definition) : null,
      latestEventMeta: latest ? `Registrado · ${Math.round(latest.distanceMeters)} m del objetivo` : null,
    };
  }

  if (!next) {
    return {
      completedCount,
      totalCount: targets.length,
      progressLabel: `${completedCount}/${targets.length} objetivos`,
      nextKind: 'unknown',
      nextTitle: 'Siguiente objetivo bloqueado',
      nextMeta: 'Completa el objetivo anterior para continuar',
      latestEventKind: latest?.kind ?? null,
      latestEventTitle: latest ? titleForTarget(latest.kind, latest.targetId, payload, definition) : null,
      latestEventMeta: latest ? `Registrado · ${Math.round(latest.distanceMeters)} m del objetivo` : null,
    };
  }

  const nextTitle = titleForTarget(next.kind, next.id, payload, definition);
  return {
    completedCount,
    totalCount: targets.length,
    progressLabel: `${completedCount}/${targets.length} objetivos`,
    nextKind: next.kind,
    nextTitle,
    nextMeta: next.kind === 'checkpoint' ? 'Sigue el trazado hasta el siguiente checkpoint' : 'Acércate para revelar este discovery',
    latestEventKind: latest?.kind ?? null,
    latestEventTitle: latest ? titleForTarget(latest.kind, latest.targetId, payload, definition) : null,
    latestEventMeta: latest ? `Registrado · ${Math.round(latest.distanceMeters)} m del objetivo` : null,
  };
}
