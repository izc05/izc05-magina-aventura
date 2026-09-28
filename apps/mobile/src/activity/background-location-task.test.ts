import { describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  defineTask: vi.fn(),
  handleBackgroundLocations: vi.fn(async () => undefined),
}));

vi.mock('expo-task-manager', () => ({
  defineTask: mocks.defineTask,
}));

vi.mock('./background-location-handler', () => ({
  handleBackgroundLocations: mocks.handleBackgroundLocations,
}));

vi.mock('./sqlite-activity-store', () => ({
  sqliteActivityStore: { kind: 'store' },
}));

vi.mock('./sqlite-background-location-inbox', () => ({
  sqliteBackgroundLocationInbox: { kind: 'inbox' },
}));

import { ACTIVITY_LOCATION_TASK } from './expo-location-adapter';
import './background-location-task';

describe('background location task registration', () => {
  it('registers the activity task at module load in global scope', () => {
    expect(mocks.defineTask).toHaveBeenCalledTimes(1);
    expect(mocks.defineTask).toHaveBeenCalledWith(
      ACTIVITY_LOCATION_TASK,
      expect.any(Function),
    );
  });

  it('forwards delivered locations to the durable background handler', async () => {
    const executor = mocks.defineTask.mock.calls[0]?.[1] as
      | ((input: {
          data?: unknown;
          error?: unknown;
          executionInfo?: unknown;
        }) => Promise<void>)
      | undefined;

    expect(executor).toBeDefined();
    if (!executor) throw new Error('Expected registered TaskManager executor');

    const locations = [
      {
        timestamp: 1234,
        coords: {
          latitude: 37.82,
          longitude: -3.41,
          accuracy: 6,
          altitude: 900,
          speed: 1,
          heading: 90,
        },
      },
    ];

    await executor({ data: { locations } });

    expect(mocks.handleBackgroundLocations).toHaveBeenCalledWith(
      locations,
      expect.objectContaining({
        store: { kind: 'store' },
        inbox: { kind: 'inbox' },
      }),
    );
  });

  it('does not forward empty/error deliveries', async () => {
    const executor = mocks.defineTask.mock.calls[0]?.[1] as
      | ((input: {
          data?: unknown;
          error?: unknown;
          executionInfo?: unknown;
        }) => Promise<void>)
      | undefined;

    if (!executor) throw new Error('Expected registered TaskManager executor');

    await executor({ error: new Error('simulated') });
    await executor({ data: { locations: [] } });

    expect(mocks.handleBackgroundLocations).toHaveBeenCalledTimes(0);
  });
});
