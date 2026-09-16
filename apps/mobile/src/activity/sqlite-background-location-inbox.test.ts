import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const execAsync = vi.fn(async () => undefined);
  const runAsync = vi.fn(async () => ({ changes: 1, lastInsertRowId: 1 }));
  const getAllAsync = vi.fn(async () => [] as unknown[]);
  const database = {
    execAsync,
    runAsync,
    getAllAsync,
    withExclusiveTransactionAsync: vi.fn(async (callback: (db: unknown) => Promise<void>) => {
      await callback(database);
    }),
  };
  return {
    execAsync,
    runAsync,
    getAllAsync,
    database,
    openDatabaseAsync: vi.fn(async () => database),
  };
});

vi.mock('expo-sqlite', () => ({
  openDatabaseAsync: mocks.openDatabaseAsync,
}));

import { SQLiteBackgroundLocationInbox } from './sqlite-background-location-inbox';

function point(timestampMs: number) {
  return {
    timestampMs,
    latitude: 37.7,
    longitude: -3.5,
    accuracyMeters: 8,
    altitudeMeters: 950,
    speedMps: 1.2,
    headingDegrees: 90,
  };
}

beforeEach(() => {
  mocks.execAsync.mockClear();
  mocks.runAsync.mockClear();
  mocks.getAllAsync.mockReset();
  mocks.getAllAsync.mockResolvedValue([]);
  mocks.openDatabaseAsync.mockClear();
});

describe('SQLiteBackgroundLocationInbox', () => {
  it('creates a durable deduplicated inbox schema and inserts with INSERT OR IGNORE', async () => {
    const inbox = new SQLiteBackgroundLocationInbox('test-background-inbox.db');
    await inbox.initialize();
    await inbox.append('activity-1', [point(1000), point(2000)]);

    const schema = String(mocks.execAsync.mock.calls[0]?.[0] ?? '');
    expect(schema).toContain('activity_background_location_inbox');
    expect(schema).toContain('UNIQUE(activity_id, timestamp_ms, latitude, longitude)');

    expect(mocks.runAsync).toHaveBeenCalledTimes(2);
    expect(String(mocks.runAsync.mock.calls[0]?.[0] ?? '')).toContain('INSERT OR IGNORE');
  });

  it('loads pending rows in inbox order and acknowledges only through a processed id', async () => {
    mocks.getAllAsync.mockResolvedValue([
      {
        inbox_id: 4,
        timestamp_ms: 1000,
        latitude: 37.7,
        longitude: -3.5,
        accuracy_m: 8,
        altitude_m: 950,
        speed_mps: 1.2,
        heading_deg: 90,
      },
      {
        inbox_id: 5,
        timestamp_ms: 2000,
        latitude: 37.71,
        longitude: -3.5,
        accuracy_m: 7,
        altitude_m: null,
        speed_mps: null,
        heading_deg: null,
      },
    ]);

    const inbox = new SQLiteBackgroundLocationInbox('test-background-inbox.db');
    const pending = await inbox.loadPending('activity-1');
    await inbox.acknowledgeThrough('activity-1', 4);

    expect(pending.map((item) => item.inboxId)).toEqual([4, 5]);
    expect(pending[1]?.point.altitudeMeters).toBeNull();

    const deleteCall = mocks.runAsync.mock.calls.at(-1);
    expect(String(deleteCall?.[0] ?? '')).toContain('inbox_id <= ?');
    expect(deleteCall?.slice(1)).toEqual(['activity-1', 4]);
  });
});
