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
    activeIntervalStartedAt: state === 'ACTIVE' ? '2026-09-28T08:00:00.000Z' : null,
    gpsGapSecondsExcluded: 0,
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
      owner_id: 'account-a',
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
    const recovered = await store.loadActiveSession('account-a');
    const ownerQueryCall = mocks.getFirstAsync.mock.calls.find(([query]) =>
      String(query ?? '').includes('WHERE owner_id = ? AND state IN'),
    ) as unknown[] | undefined;

    expect(recovered?.ownerId).toBe('account-a');
    expect(String(ownerQueryCall?.[0] ?? '')).toContain("state IN ('ACTIVE', 'PAUSED')");
    expect(ownerQueryCall?.slice(1)).toEqual(['account-a']);
    expect(recovered?.lastConsumedInboxId).toBe(37);
    expect(recovered?.session.activityId).toBe('activity-sqlite');
    expect(recovered?.snapshot.activeIntervalStartedAt).toBe('2026-09-28T08:00:00.000Z');
    expect(recovered?.snapshot.gpsGapSecondsExcluded).toBe(0);
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

  it('lists only verified finished device GPS captures with samples and a final snapshot, newest first', async () => {
    const row = (
      activityId: string,
      finishedAt: string | null,
      sequence: number,
      distanceMeters: number,
      elapsedSeconds: number,
      sampleCount = 2,
    ) => ({
      activity_id: activityId,
      state: 'FINISHED',
      finished_at: finishedAt,
      recording_source: 'device-gps',
      last_processed_sequence: sequence,
      snapshot_last_processed_sequence: sequence,
      snapshot_payload_json: JSON.stringify({
        ...snapshot('FINISHED'),
        activityId,
        lastProcessedSequence: sequence,
        validDistanceMeters: distanceMeters,
        totalElapsedSeconds: elapsedSeconds,
      }),
      sample_count: sampleCount,
    });
    const newer = row('gps-newer', '2026-09-29T08:10:00.000Z', 4, 400, 300, 3);
    const older = row('gps-older', '2026-09-28T08:10:00.000Z', 2, 18, 10, 2);
    const mock = { ...row('mock-session', '2026-09-30T08:10:00.000Z', 2, 80_000, 50_000), recording_source: 'mock' };
    const legacy = { ...row('legacy-session', '2026-09-30T08:10:00.000Z', 2, 8_000, 5_000), recording_source: 'unclassified' };
    const unknownSource = { ...row('unknown-source', '2026-09-30T08:10:00.000Z', 2, 8_000, 5_000), recording_source: 'development-gps-qa' };
    const active = { ...row('active-session', null, 2, 8_000, 5_000), state: 'ACTIVE' };
    const noSamples = row('no-samples', '2026-09-30T08:10:00.000Z', 2, 8_000, 5_000, 0);
    const invalidDate = row('invalid-date', 'not-a-date', 2, 8_000, 5_000);
    const staleSnapshot = { ...row('stale-snapshot', '2026-09-30T08:10:00.000Z', 2, 8_000, 5_000), snapshot_last_processed_sequence: 1 };
    const invalidFinalPayload = {
      ...row('invalid-final-payload', '2026-09-30T08:10:00.000Z', 2, 8_000, 5_000),
      snapshot_payload_json: JSON.stringify({
        ...snapshot('FINISHED'),
        activityId: 'invalid-final-payload',
        state: 'ACTIVE',
      }),
    };
    mocks.getAllAsync.mockResolvedValue([
      older,
      mock,
      invalidDate,
      newer,
      legacy,
      active,
      noSamples,
      unknownSource,
      staleSnapshot,
      invalidFinalPayload,
    ]);

    const store = new SQLiteActivityStore('passport-gps-captures.db');
    const data = await store.loadPassportGpsData('account-a');
    const queryCall = mocks.getAllAsync.mock.calls.at(-1) as unknown[];
    const query = String(queryCall[0]);

    expect(query).toContain('session.state = ?');
    expect(query).toContain('session.finished_at IS NOT NULL');
    expect(query).toContain('session.recording_source = ?');
    expect(query).toContain('session.owner_id = ?');
    expect(query).toContain('latest_snapshot.last_processed_sequence');
    expect(query).toContain('ORDER BY session.finished_at DESC');
    expect(query).not.toContain('route_id');
    expect(query).not.toContain('route_distance_km');
    expect(query).not.toContain('reward_xp');
    expect(queryCall.slice(1)).toEqual(['FINISHED', 'device-gps', 'account-a']);
    expect(data.sessions).toEqual([
      {
        activityId: 'gps-newer',
        finishedAt: '2026-09-29T08:10:00.000Z',
        distanceMeters: 400,
        elapsedSeconds: 300,
        sampleCount: 3,
      },
      {
        activityId: 'gps-older',
        finishedAt: '2026-09-28T08:10:00.000Z',
        distanceMeters: 18,
        elapsedSeconds: 10,
        sampleCount: 2,
      },
    ]);
    expect(data.metrics).toEqual({
      sessionCount: 2,
      distanceMeters: 418,
      elapsedSeconds: 310,
    });
  });

  it('returns an empty list and zero aggregate when no finished GPS captures are saved', async () => {
    const store = new SQLiteActivityStore('empty-passport-metrics.db');

    await expect(store.loadPassportGpsData('account-a')).resolves.toEqual({
      sessions: [],
      metrics: { sessionCount: 0, distanceMeters: 0, elapsedSeconds: 0 },
    });
  });

  it('keeps the aggregate API derived from the same safe capture query', async () => {
    const store = new SQLiteActivityStore('passport-metrics-compat.db');

    await expect(store.loadPassportGpsMetrics('account-a')).resolves.toEqual({
      sessionCount: 0,
      distanceMeters: 0,
      elapsedSeconds: 0,
    });
  });

  it('loads GPS details only for the authenticated owner and validates persisted samples', async () => {
    const activityId = 'synthetic-private-gps-session';
    const finishedAt = '2026-09-28T08:10:00.000Z';
    const payload = {
      activityId,
      state: 'FINISHED',
      lastProcessedSequence: 2,
      algorithmVersion: 1,
      createdAt: finishedAt,
      validDistanceMeters: 240,
      totalElapsedSeconds: 180,
    };
    const detailRow = (sequence: number) => ({
      activity_id: activityId,
      owner_id: 'account-a',
      state: 'FINISHED',
      finished_at: finishedAt,
      recording_source: 'device-gps',
      last_processed_sequence: 2,
      snapshot_last_processed_sequence: 2,
      snapshot_payload_json: JSON.stringify(payload),
      sample_count: 2,
      sample_max_sequence: 2,
      sample_sequence: sequence,
      sample_timestamp: `2026-09-28T08:00:${String(sequence * 5).padStart(2, '0')}.000Z`,
      sample_latitude: 37.5 + sequence * 0.001,
      sample_longitude: -3.5 - sequence * 0.001,
      sample_accuracy_m: 6,
      sample_valid_for_metrics: 1,
      sample_rejection_reason: null,
      sample_active_interval_started_at: '2026-09-28T08:00:00.000Z',
    });
    const rows = [detailRow(1), detailRow(2)];
    mocks.getAllAsync.mockResolvedValue(rows);

    const ownerStore = new SQLiteActivityStore('passport-gps-owner-detail.db');
    const detail = await ownerStore.loadPassportGpsSessionDetail('account-a', activityId);
    const ownerCall = mocks.getAllAsync.mock.calls.at(-1) as unknown[];
    const query = String(ownerCall[0]);
    expect(query).toContain('session.owner_id = ?');
    expect(query).toContain('session.activity_id = ?');
    expect(query).toContain("json_extract(context_snapshot.payload_json, '$.activeIntervalStartedAt')");
    expect(query).toContain('context_snapshot.created_at <= sample.timestamp');
    expect(queryCallValues(ownerCall)).toEqual([activityId, 'account-a', 'FINISHED', 'device-gps']);
    expect(query).not.toMatch(/route_id|route_slug|checkpoint|reward_xp/i);
    expect(detail).toEqual({
      activityId,
      finishedAt,
      distanceMeters: 240,
      elapsedSeconds: 180,
      sampleCount: 2,
      samples: [
        { sequence: 1, timestamp: '2026-09-28T08:00:05.000Z', latitude: 37.501, longitude: -3.501, accuracyMeters: 6, validForMetrics: true, rejectionReason: null, activeIntervalStartedAt: '2026-09-28T08:00:00.000Z' },
        { sequence: 2, timestamp: '2026-09-28T08:00:10.000Z', latitude: 37.502, longitude: -3.502, accuracyMeters: 6, validForMetrics: true, rejectionReason: null, activeIntervalStartedAt: '2026-09-28T08:00:00.000Z' },
      ],
    });

    mocks.getAllAsync.mockResolvedValue(rows);
    const otherOwnerStore = new SQLiteActivityStore('passport-gps-cross-owner-detail.db');
    await expect(otherOwnerStore.loadPassportGpsSessionDetail('account-b', activityId)).resolves.toBeNull();
    const otherOwnerCall = mocks.getAllAsync.mock.calls.at(-1) as unknown[];
    expect(queryCallValues(otherOwnerCall)).toEqual([activityId, 'account-b', 'FINISHED', 'device-gps']);
  });

  it('refuses cross-account GPS deletion and atomically removes only the verified owner session', async () => {
    const activityId = 'synthetic-owner-scoped-delete';
    const finishedAt = '2026-09-28T08:10:00.000Z';
    const row = {
      activity_id: activityId,
      owner_id: 'account-a',
      state: 'FINISHED',
      finished_at: finishedAt,
      recording_source: 'device-gps',
      last_processed_sequence: 2,
      snapshot_last_processed_sequence: 2,
      snapshot_payload_json: JSON.stringify({
        activityId,
        state: 'FINISHED',
        lastProcessedSequence: 2,
        algorithmVersion: 1,
        createdAt: finishedAt,
        validDistanceMeters: 240,
        totalElapsedSeconds: 180,
      }),
      sample_count: 2,
      sample_max_sequence: 2,
    };
    mocks.getFirstAsync.mockImplementation(async (query: unknown) => {
      const sql = String(query ?? '');
      if (sql.includes('FROM activity_sessions AS session')) return row;
      if (sql.includes('sqlite_master')) return { name: 'activity_background_location_inbox' };
      return null;
    });

    const store = new SQLiteActivityStore('passport-gps-owner-delete.db');
    await expect(store.deletePassportGpsSession('account-b', activityId)).resolves.toBe(false);
    expect(mocks.getFirstAsync.mock.calls.at(-1)?.slice(1)).toEqual([
      activityId,
      'account-b',
      'FINISHED',
      'device-gps',
    ]);
    expect((mocks.runAsync.mock.calls as unknown[][]).filter((call) => String(call[0] ?? '').startsWith('DELETE '))).toEqual([]);

    mocks.runAsync.mockClear();
    await expect(store.deletePassportGpsSession('account-a', activityId)).resolves.toBe(true);
    const deleteCalls = (mocks.runAsync.mock.calls as unknown[][])
      .filter((call) => String(call[0] ?? '').startsWith('DELETE '));
    expect(deleteCalls.some((call) => String(call[0]).includes('DELETE FROM activity_samples'))).toBe(true);
    expect(deleteCalls.some((call) => String(call[0]).includes('DELETE FROM activity_snapshots'))).toBe(true);
    expect(deleteCalls.some((call) => String(call[0]).includes('DELETE FROM activity_sync_batches'))).toBe(true);
    expect(deleteCalls.some((call) => String(call[0]).includes('DELETE FROM activity_exploration_observations'))).toBe(true);
    expect(deleteCalls.some((call) => String(call[0]).includes('DELETE FROM activity_exploration_state'))).toBe(true);
    expect(deleteCalls.some((call) => String(call[0]).includes('DELETE FROM activity_background_location_inbox'))).toBe(true);
    const sessionDelete = deleteCalls.find((call) => String(call[0]).includes('DELETE FROM activity_sessions'));
    expect(String(sessionDelete?.[0])).toContain('owner_id = ?');
    expect(sessionDelete?.slice(1)).toEqual([
      activityId,
      'account-a',
      'FINISHED',
      'device-gps',
      finishedAt,
      2,
    ]);
    expect(deleteCalls.some((call) => /DELETE FROM (routes|personal_route_photos)/i.test(String(call[0])))).toBe(false);
  });
});

function queryCallValues(call: unknown[]): unknown[] {
  return call.slice(1);
}
