import type {
  AdventureContentDefinition,
  GeoJsonPosition,
  ProgressionSnapshot,
  QaSimulationContext,
} from '@magina-aventura/contracts';
import { distanceMeters } from '@magina-aventura/geo';

export interface RouteGeometry {
  coordinates: readonly GeoJsonPosition[];
}

export interface SimulatorState {
  context: QaSimulationContext;
  elapsedMs: number;
  progressMeters: number;
  position: GeoJsonPosition;
  reachedCheckpointIds: string[];
  unlockedDiscoveryIds: string[];
}

function cumulativeDistances(coordinates: readonly GeoJsonPosition[]): number[] {
  const distances = [0];
  for (let index = 1; index < coordinates.length; index += 1) {
    const previous = coordinates[index - 1]!;
    const current = coordinates[index]!;
    distances.push(distances[index - 1]! + distanceMeters(
      { latitude: previous[1], longitude: previous[0] },
      { latitude: current[1], longitude: current[0] },
    ));
  }
  return distances;
}

export function routeLengthMeters(geometry: RouteGeometry): number {
  const distances = cumulativeDistances(geometry.coordinates);
  return distances.at(-1) ?? 0;
}

export function interpolatePosition(geometry: RouteGeometry, progressMeters: number): GeoJsonPosition {
  if (geometry.coordinates.length < 2) throw new Error('Simulation requires at least two coordinates');
  const distances = cumulativeDistances(geometry.coordinates);
  const target = Math.max(0, Math.min(progressMeters, distances.at(-1)!));
  for (let index = 1; index < distances.length; index += 1) {
    if (target <= distances[index]!) {
      const startDistance = distances[index - 1]!;
      const segmentLength = distances[index]! - startDistance;
      const ratio = segmentLength === 0 ? 0 : (target - startDistance) / segmentLength;
      const start = geometry.coordinates[index - 1]!;
      const end = geometry.coordinates[index]!;
      return [start[0] + (end[0] - start[0]) * ratio, start[1] + (end[1] - start[1]) * ratio];
    }
  }
  return geometry.coordinates.at(-1)!;
}

function progressionAt(content: AdventureContentDefinition, progressMeters: number, previous: SimulatorState): Pick<SimulatorState, 'reachedCheckpointIds' | 'unlockedDiscoveryIds'> {
  const reached = new Set(previous.reachedCheckpointIds);
  const discoveries = new Set(previous.unlockedDiscoveryIds);
  for (const checkpoint of content.checkpoints) {
    const prerequisitesMet = (checkpoint.prerequisiteCheckpointIds ?? []).every((id) => reached.has(id));
    if (checkpoint.progressMeters <= progressMeters && prerequisitesMet) {
      reached.add(checkpoint.id);
      for (const discoveryId of checkpoint.discoveryIds) discoveries.add(discoveryId);
    }
  }
  return { reachedCheckpointIds: [...reached], unlockedDiscoveryIds: [...discoveries] };
}

export function createSimulator(content: AdventureContentDefinition, geometry: RouteGeometry, simulationId = 'qa-route-01'): SimulatorState {
  const state: SimulatorState = {
    context: { qaSimulated: true, watermark: 'SIMULACIÓN QA', simulationId, mode: 'replay', publicEffectsEnabled: false, commercialRedemptionEnabled: false, physicalQaEvidence: false },
    elapsedMs: 0,
    progressMeters: 0,
    position: geometry.coordinates[0]!,
    reachedCheckpointIds: [],
    unlockedDiscoveryIds: [],
  };
  return advanceReplay(content, geometry, state, 0, 1);
}

export function advanceReplay(content: AdventureContentDefinition, geometry: RouteGeometry, state: SimulatorState, elapsedMs: number, speedMultiplier: 1 | 4 | 10, metersPerSecond = 1.2): SimulatorState {
  const progressMeters = Math.min(routeLengthMeters(geometry), Math.max(0, elapsedMs / 1000 * metersPerSecond * speedMultiplier));
  const progression = progressionAt(content, progressMeters, state);
  return { ...state, context: { ...state.context, mode: 'replay' }, elapsedMs, progressMeters, position: interpolatePosition(geometry, progressMeters), ...progression };
}

export function advanceReplayByDelta(
  content: AdventureContentDefinition,
  geometry: RouteGeometry,
  state: SimulatorState,
  deltaMs: number,
  speedMultiplier: 1 | 4 | 10,
  metersPerSecond = 1.2,
): SimulatorState {
  const normalizedDeltaMs = Math.max(0, Number.isFinite(deltaMs) ? deltaMs : 0);
  const normalizedMetersPerSecond =
    Number.isFinite(metersPerSecond) && metersPerSecond > 0
      ? metersPerSecond
      : 1.2;
  const deltaMeters =
    (normalizedDeltaMs / 1000) *
    normalizedMetersPerSecond *
    speedMultiplier;
  const progressMeters = Math.min(
    routeLengthMeters(geometry),
    Math.max(0, state.progressMeters + deltaMeters),
  );
  const elapsedMs = state.elapsedMs + normalizedDeltaMs;
  const progression = progressionAt(content, progressMeters, state);

  return {
    ...state,
    context: { ...state.context, mode: 'replay' },
    elapsedMs,
    progressMeters,
    position: interpolatePosition(geometry, progressMeters),
    ...progression,
  };
}

export function advanceBySteps(content: AdventureContentDefinition, geometry: RouteGeometry, state: SimulatorState, steps: number, metersPerStep = 0.75): SimulatorState {
  const progressMeters = Math.min(routeLengthMeters(geometry), Math.max(0, state.progressMeters + Math.max(0, steps) * metersPerStep));
  return { ...state, context: { ...state.context, mode: 'walk_to_advance' }, progressMeters, position: interpolatePosition(geometry, progressMeters), ...progressionAt(content, progressMeters, state) };
}

export function jumpToCheckpoint(content: AdventureContentDefinition, geometry: RouteGeometry, state: SimulatorState, checkpointId: string): SimulatorState {
  const checkpoint = content.checkpoints.find((item) => item.id === checkpointId);
  if (!checkpoint) throw new Error(`Unknown checkpoint ${checkpointId}`);
  const progressMeters = Math.min(routeLengthMeters(geometry), Math.max(0, checkpoint.progressMeters));
  return { ...state, context: { ...state.context, mode: 'checkpoint_jump' }, progressMeters, position: interpolatePosition(geometry, progressMeters), ...progressionAt(content, progressMeters, state) };
}

export function snapshot(state: SimulatorState): ProgressionSnapshot {
  return {
    qaSimulated: state.context.qaSimulated,
    progressMeters: state.progressMeters,
    reachedCheckpointIds: [...state.reachedCheckpointIds],
    unlockedDiscoveryIds: [...state.unlockedDiscoveryIds],
    publicAchievementEligible: false,
    rankingEligible: false,
    sponsorRedemptionEligible: false,
  };
}
