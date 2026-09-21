import { createActivityRuntime } from './activity-runtime';
import { createSimulatedLocationProvider } from './simulated-location-provider';
import { devAdventureEngineTestPositions } from '../features/routes/dev-adventure-engine-test';
import type { QaTestPositionKey } from '../features/qa/qa-harness';

export const qaSimulationLocationProvider = createSimulatedLocationProvider();
export const qaSimulationRuntime = createActivityRuntime(qaSimulationLocationProvider);

export async function emitQaTestPosition(positionKey: QaTestPositionKey): Promise<void> {
  const position = devAdventureEngineTestPositions[positionKey];

  await qaSimulationLocationProvider.emit({
    timestampMs: Date.now(),
    latitude: position[1],
    longitude: position[0],
    accuracyMeters: 5,
    altitudeMeters: 100,
    speedMps: 1,
    headingDegrees: 90,
  });
}
