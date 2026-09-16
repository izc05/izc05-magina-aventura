import { describe, expect, it } from 'vitest';

import {
  createMemoryBackgroundLocationInboxDatabase,
  MemoryBackgroundLocationInbox,
} from './background-location-inbox';

function point(timestampMs: number, latitude = 37.7) {
  return {
    timestampMs,
    latitude,
    longitude: -3.5,
    accuracyMeters: 8,
    altitudeMeters: 950,
    speedMps: 1.2,
    headingDegrees: 90,
  };
}

describe('BackgroundLocationInbox contract', () => {
  it('persists raw points in order and deduplicates Android redelivery', async () => {
    const inbox = new MemoryBackgroundLocationInbox();
    await inbox.initialize();

    await inbox.append('activity-1', [point(1000), point(2000)]);
    await inbox.append('activity-1', [point(2000), point(3000)]);

    const pending = await inbox.loadPending('activity-1');

    expect(pending.map((item) => item.point.timestampMs)).toEqual([1000, 2000, 3000]);
  });

  it('acknowledges only records already processed by the activity engine', async () => {
    const inbox = new MemoryBackgroundLocationInbox();
    await inbox.initialize();
    await inbox.append('activity-1', [point(1000), point(2000), point(3000)]);

    const pending = await inbox.loadPending('activity-1');
    await inbox.acknowledgeThrough('activity-1', pending[1].inboxId);

    expect((await inbox.loadPending('activity-1')).map((item) => item.point.timestampMs)).toEqual([
      3000,
    ]);
  });

  it('survives process-like re-instantiation over the same backing store', async () => {
    const database = createMemoryBackgroundLocationInboxDatabase();
    const firstProcess = new MemoryBackgroundLocationInbox(database);
    await firstProcess.initialize();
    await firstProcess.append('activity-1', [point(1000)]);

    const secondProcess = new MemoryBackgroundLocationInbox(database);
    await secondProcess.initialize();

    expect((await secondProcess.loadPending('activity-1'))).toHaveLength(1);
  });
});
