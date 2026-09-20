import { describe, expect, it } from 'vitest';

import {
  devAdventureEngineTestDefinition,
  devAdventureEngineTestPositions,
  devAdventureEngineTestRoute,
  DEV_ADVENTURE_ENGINE_TEST_SLUG,
  DEV_TEST_TARGET_KEYS,
} from '../features/routes/dev-adventure-engine-test';
import { devAdventureEngineTestRepository } from '../features/routes/dev-adventure-engine-test-repository';
import { createActivityController } from './activity-controller';
import {
  createMemoryBackgroundLocationInboxDatabase,
  MemoryBackgroundLocationInbox,
} from './background-location-inbox';
import {
  createMemoryActivityStoreDatabase,
  MemoryActivityStore,
} from './memory-activity-store';
import { createSimulatedLocationProvider } from './simulated-location-provider';

const routeLine = devAdventureEngineTestRoute
  ? devAdventureEngineTestRepository
  : undefined;

function point(longitude: number, latitude: number, timestampMs: number) {
  return {
    longitude,
    latitude,
    timestampMs,
    accuracyMeters: 5,
    altitudeMeters: 100,
    speedMps: 1,
    headingDegrees: 90,
  };
}

function dependencies() {
  return {
    storeDatabase: createMemoryActivityStoreDatabase(),
    inboxDatabase: createMemoryBackgroundLocationInboxDatabase(),
  };
}

async function push(
  runtime: ReturnType<typeof createActivityController>,
  provider: ReturnType<typeof createSimulatedLocationProvider>,
  coordinates: readonly [number, number],
  timestampMs: number,
) {
  await provider.emit(point(coordinates[0], coordinates[1], timestampMs));
  await Promise.resolve();
  await Promise.resolve();
  return runtime.refresh();
}

describe('DEV Adventure Engine v2 Android harness', () => {
  it('runs the real location-to-SQLite pipeline through exploration, pause, recovery and explicit finish', async () => {
    expect(devAdventureEngineTestDefinition.slug).toBe(DEV_ADVENTURE_ENGINE_TEST_SLUG);
    expect(devAdventureEngineTestDefinition.progression.rewards).toEqual([]);
    expect(await devAdventureEngineTestRepository.getAdventureDefinition('sendero-de-cuadros-dev')).toBeNull();

    const { storeDatabase, inboxDatabase } = dependencies();
    const provider = createSimulatedLocationProvider();
    const runtime = createActivityController({
      store: new MemoryActivityStore(storeDatabase),
      inbox: new MemoryBackgroundLocationInbox(inboxDatabase),
      locationProvider: provider,
      createActivityId: () => 'dev-simulation-activity',
      now: () => '2026-09-20T10:00:00.000Z',
    });

    expect(await provider.getPermissionState()).toEqual({
      foregroundGranted: true,
      backgroundGranted: false,
      servicesEnabled: true,
    });

    const started = await runtime.start(devAdventureEngineTestDefinition, devAdventureEngineTestRoute);
    expect(started.session.adventureSlug).toBe(DEV_ADVENTURE_ENGINE_TEST_SLUG);
    expect(started.session.adventureVersion).toBe(1);
    expect(started.session.state).toBe('ACTIVE');

    let state = await push(runtime, provider, devAdventureEngineTestPositions.checkpoint1, 10_000);
    expect(state?.session.state).toBe('ACTIVE');
    expect(state?.exploration?.unlockedTargetKeys).toEqual([DEV_TEST_TARGET_KEYS.checkpoint1]);

    state = await push(runtime, provider, devAdventureEngineTestPositions.checkpoint1, 20_000);
    expect(state?.exploration?.unlockedTargetKeys).toEqual([DEV_TEST_TARGET_KEYS.checkpoint1]);
    expect((await runtime.loadTrack()).map((sample) => sample.sequence)).toEqual([1, 2]);

    state = await push(runtime, provider, devAdventureEngineTestPositions.checkpoint2, 40_000);
    expect(state?.exploration?.unlockedTargetKeys).toEqual([
      DEV_TEST_TARGET_KEYS.checkpoint1,
      DEV_TEST_TARGET_KEYS.checkpoint2,
    ]);

    state = await push(runtime, provider, devAdventureEngineTestPositions.discovery, 60_000);
    expect(state?.session.state).toBe('ACTIVE');
    expect(state?.exploration?.unlockedTargetKeys).toContain(DEV_TEST_TARGET_KEYS.discovery);

    await runtime.pause();
    expect(runtime.current()?.session.state).toBe('PAUSED');

    const recoveredProvider = createSimulatedLocationProvider();
    const recoveredRuntime = createActivityController({
      store: new MemoryActivityStore(storeDatabase),
      inbox: new MemoryBackgroundLocationInbox(inboxDatabase),
      locationProvider: recoveredProvider,
      createActivityId: () => 'unused',
      now: () => '2026-09-20T10:01:00.000Z',
    });
    const recovered = await recoveredRuntime.recover(
      devAdventureEngineTestDefinition,
      devAdventureEngineTestRoute,
    );
    expect(recovered?.session.state).toBe('PAUSED');
    expect(recovered?.exploration?.unlockedTargetKeys).toEqual([
      DEV_TEST_TARGET_KEYS.checkpoint1,
      DEV_TEST_TARGET_KEYS.checkpoint2,
      DEV_TEST_TARGET_KEYS.discovery,
    ]);

    await recoveredRuntime.resume();
    state = await push(
      recoveredRuntime,
      recoveredProvider,
      devAdventureEngineTestPositions.checkpoint3,
      80_000,
    );
    expect(state?.session.state).toBe('ACTIVE');
    expect(state?.exploration?.unlockedTargetKeys).toContain(DEV_TEST_TARGET_KEYS.checkpoint3);

    const finished = await recoveredRuntime.finish();
    expect(finished.session.state).toBe('FINISHED');
    expect((await recoveredRuntime.loadTrack()).length).toBe(5);
  });

  it('rejects a different pinned definition version during recovery', async () => {
    const { storeDatabase, inboxDatabase } = dependencies();
    const provider = createSimulatedLocationProvider();
    const runtime = createActivityController({
      store: new MemoryActivityStore(storeDatabase),
      inbox: new MemoryBackgroundLocationInbox(inboxDatabase),
      locationProvider: provider,
      createActivityId: () => 'version-pinned-activity',
      now: () => '2026-09-20T10:00:00.000Z',
    });
    await runtime.start(devAdventureEngineTestDefinition, devAdventureEngineTestRoute);

    const restarted = createActivityController({
      store: new MemoryActivityStore(storeDatabase),
      inbox: new MemoryBackgroundLocationInbox(inboxDatabase),
      locationProvider: createSimulatedLocationProvider(),
      createActivityId: () => 'unused',
      now: () => '2026-09-20T10:01:00.000Z',
    });

    await expect(
      restarted.recover(
        { ...devAdventureEngineTestDefinition, version: 2 },
        devAdventureEngineTestRoute,
      ),
    ).rejects.toThrow(/exact AdventureDefinition version/);
  });

  it('keeps production repository fail-closed and synthetic content isolated by slug', async () => {
    expect(await devAdventureEngineTestRepository.getMapPayload('unknown-production-slug')).toBeNull();
    expect(await devAdventureEngineTestRepository.getAdventureDefinition('unknown-production-slug')).toBeNull();
    expect(routeLine).toBeDefined();
  });
});
