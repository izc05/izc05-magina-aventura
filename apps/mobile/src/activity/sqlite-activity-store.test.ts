import type {
  ActivitySession,
  ActivitySnapshot,
  ActivitySyncBatch,
  LocationSample,
} from '@magina-aventura/contracts';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const execAsync = vi.fn(async () => undefined);
  const runAsync = vi.fn(async () => ({ changes: 1, lastInsertRowId: 1 }));
  const getFirstAsync = vi.fn(async (..._args: unknown[]) => null as unknown);
  const getAllAsync = vi.fn(async (..._args: unknown[]) => [] as unknown[]);
  const database = {
    execAsync,
    runAsync,
    getFirstAsync,
    getAllAsync,
    withExclusiveTransactionAsync: vi.fn(
      async (callback: (db: unknown) => Promise<void>) => {
        await callback(database);
      },
    ),
  };
  return {
    execAsync,
    runAsync,
    getFirstAsync,
    getAllAsync,
    database,
    openDatabaseAsync: vi.fn(async () => database),
  };
});

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: mocks.openDatabaseAsync,
}));

import type { ExplorationPersistence } from './activity-store';
import { SQLiteActivityStore } from './sqlite-activity-store';

function session(state: ActivitySession['state'] = 'ACTIVE'): ActivitySession {
  return {
    activityId: 'activity-sqlite',
    adventureSlug: 'durable-adventure',
    adventureVersion: 1,
    routeId: 'route-sqlite',
    routeSlug: 'route-sqlite',
    geometryVersion: 1,
    state,
    startedAt: '2026-09-28T08:00:00.000Z',
    pausedAt: null,
    finishedAt: state === 'FINISHED' ? '2026-09-28T08:10:00.000Z' : null,
    lastProcessedSequence: 2,
    syncState: 'local',
  };
}

function sample(sequence: number): LocationSample {
  return {
    sequence,
    timestamp: `2026-09-28T08:00:${String(sequence * 5).padStart(2, '0')}.000Z`,
    latitude: 37.82 + sequence * 0.00001,
    longitude: -3.41,
    accuracyMeters: 6,
    altitudeMeters: 900,
    speedMps: 1,
    headingDegrees: 90,
    validForMetrics: true,
    rejectionReason: null,
  };
}

function snapshot(state: ActivitySnapshot['state'] = 'ACTIVE'): ActivitySnapshot {
  return {
    activityId: 'activity-sqlite',
    state,
    lastProcessedSequence: 2,
    validDistanceMeters: 18,
    totalElapsedSeconds: 10,
    movingElapsedSeconds: 10,
    currentSpeedMps: 1,
    paceSecondsPerKm: 600,
    elevationGainMeters: 0,
    elevationLossMeters: 0,
    routeProgress: 0.1,
    maxRouteProgress: 0.1,
    distanceToRouteMeters: 4,
    offRouteState: 'on_route',
    lastValidSample: sample(2),
    algorithmVersion: 1,
    createdAt: '2026-09-28T08:00:10.000Z',
  };
}

const exploration: ExplorationPersistence = {
  state: {
    progressByTargetKey: {},
    unlockedTargetKeys: [],
    lastEvaluatedSequence: 2,
  },
  observations: [],
};

function batch(): ActivitySyncBatch {
  return {
    batchId: 'activity:activity-sqlite:track:1-2',
    activityId: 'activity-sqlite',
    sequenceStart: 1,
    sequenceEnd: 2,
    idempotencyKey: 'activity:activity-sqlite:track:1-2',
    samples: [sample(1), sample(2)],
    snapshot: snapshot('FINISHED'),
    createdAt: '2026-09-28T08:10:00.000Z',
  };
}

beforeEach(() => {
  mocks.execAsync.mockClear();
  mocks.runAsync.mockClear();
  mocks.getFirstAsync.mockReset();
  mocks.getFirstAsync.mockResolvedValue(null);
  mocks.getAllAsync.mockReset();
  mocks.getAllAsync.mockResolvedValue([]);
  mocks.database.withExclusiveTransactionAsync.mockClear();
  mocks.openDatabaseAsync.mockClear();
});

describe('SQLiteActivityStore durability contract', () => {
  it('advances the inbox cursor in the same exclusive transaction as the committed batch', async () => {
    const store = new SQLiteActivityStore('cursor.db');

    await store.appendBatch(
      'activity-sqlite',
      [sample(1), sample(2)],
      snapshot(),
      exploration,
      42,
    );

    expect(mocks.database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);

    const runCalls = mocks.runAsync.mock.calls as unknown[][];
    const cursorCall = runCalls.find((call) =>
      String(call[0] ?? '').includes('last_consumed_inbox_id'),
    );

    expect(cursorCall).toBeDefined();
    expect(String(cursorCall?.[0] ?? '')).toContain('CASE');
    expect(cursorCall?.slice(1)).toEqual([42, 42, 'activity-sqlite']);
  });

  it('recovers the durable inbox cursor together with the active session', async () => {
    const activeSessionRow = {
      activity_id: 'activity-sqlite',
      adventure_slug: 'durable-adventure',
      adventure_version: 1,
      route_id: 'route-sqlite',
      route_slug: 'route-sqlite',
      geometry_version: 1,
      state: 'ACTIVE',
      started_at: '2026-09-28T08:00:00.000Z',
      paused_at: null,
      finished_at: null,
      last_processed_sequence: 2,
      sync_state: 'local',
      last_consumed_inbox_id: 37,
    };

    mocks.getFirstAsync.mockImplementation(async (query: unknown) => {
      const sql = String(query ?? '');
      if (sql.includes('FROM activity_sessions')) return activeSessionRow;
      if (sql.includes('FROM activity_snapshots')) {
        return { payload_json: JSON.stringify(snapshot()) };
      }
      if (sql.includes('FROM activity_exploration_state')) return null;
      return null;
    });

    const store = new SQLiteActivityStore('recovery.db');
    const recovered = await store.loadActiveSession();

    expect(recovered?.lastConsumedInboxId).toBe(37);
    expect(recovered?.session.activityId).toBe('activity-sqlite');
  });

  it('persists FINISHED state and sync outbox inside one exclusive transaction', async () => {
    const syncBatch = batch();
    mocks.getFirstAsync.mockImplementation(async (query: unknown) => {
      if (String(query ?? '').includes('FROM activity_sync_batches')) {
        return { payload_json: JSON.stringify(syncBatch) };
      }
      return null;
    });

    const store = new SQLiteActivityStore('finish.db');
    const persisted = await store.finishSessionAndQueueSyncBatch(
      session('FINISHED'),
      snapshot('FINISHED'),
      exploration,
      syncBatch,
    );

    expect(mocks.database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);

    const runCalls = mocks.runAsync.mock.calls as unknown[][];
    const sessionWrite = runCalls.find((call) =>
      String(call[0] ?? '').includes('INSERT INTO activity_sessions'),
    );
    const outboxWrite = runCalls.find((call) =>
      String(call[0] ?? '').includes('INSERT OR IGNORE INTO activity_sync_batches'),
    );

    expect(sessionWrite).toBeDefined();
    expect(sessionWrite).toContain('queued');
    expect(outboxWrite).toBeDefined();
    expect(outboxWrite).toContain(syncBatch.idempotencyKey);
    expect(persisted.idempotencyKey).toBe(syncBatch.idempotencyKey);
  });

  it('never opens a second transaction to enqueue the finish batch', async () => {
    const syncBatch = batch();
    mocks.getFirstAsync.mockResolvedValue({
      payload_json: JSON.stringify(syncBatch),
    });

    const store = new SQLiteActivityStore('single-transaction.db');
    await store.finishSessionAndQueueSyncBatch(
      session('FINISHED'),
      snapshot('FINISHED'),
      exploration,
      syncBatch,
    );

    expect(mocks.database.withExclusiveTransactionAsync).toHaveBeenCalledTimes(1);
  });
});
