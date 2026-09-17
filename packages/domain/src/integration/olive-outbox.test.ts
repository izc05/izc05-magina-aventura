import { describe, expect, it } from 'vitest';

import type { OliveGrantCandidate } from '../rewards/olive-grants';
import { buildOliveGrantOutboxEvents } from './olive-outbox';

function grant(
  sourceKey: string,
  overrides: Partial<OliveGrantCandidate> = {},
): OliveGrantCandidate {
  return {
    userId: 'user-1',
    amount: 5,
    reason: 'Nivel alcanzado: Brote fuerte',
    sourceType: 'level',
    sourceId: '2',
    sourceKey,
    ...overrides,
  };
}

describe('buildOliveGrantOutboxEvents', () => {
  it('builds a versioned canonical event from a validated olive grant', () => {
    const [event] = buildOliveGrantOutboxEvents({
      grants: [grant('olive:level:2')],
      occurredAt: '2026-09-16T06:00:00.000Z',
      alreadyPublishedEventKeys: [],
    });

    expect(event).toEqual({
      eventKey: 'outbox:olive:level:2',
      eventType: 'magina-aventura.olive-grant.v1',
      aggregateType: 'user',
      aggregateId: 'user-1',
      occurredAt: '2026-09-16T06:00:00.000Z',
      payload: {
        userId: 'user-1',
        amount: 5,
        reason: 'Nivel alcanzado: Brote fuerte',
        sourceType: 'level',
        sourceId: '2',
        sourceKey: 'olive:level:2',
      },
    });
  });

  it('deduplicates repeated grant sources and skips events already published', () => {
    const result = buildOliveGrantOutboxEvents({
      grants: [
        grant('olive:level:2'),
        grant('olive:level:2'),
        grant('olive:challenge:week-10k', {
          sourceType: 'challenge',
          sourceId: 'week-10k',
          reason: 'Reto completado: 10 km',
          amount: 7,
        }),
      ],
      occurredAt: '2026-09-16T06:00:00.000Z',
      alreadyPublishedEventKeys: ['outbox:olive:challenge:week-10k'],
    });

    expect(result.map((event) => event.eventKey)).toEqual([
      'outbox:olive:level:2',
    ]);
  });

  it('filters invalid or non-positive grants and invalid timestamps', () => {
    const invalidGrants = [
      grant('olive:level:2', { amount: 0 }),
      grant('olive:level:3', { amount: -1 }),
      grant('olive:level:4', { amount: Number.NaN }),
      grant('', { amount: 4 }),
    ];

    expect(
      buildOliveGrantOutboxEvents({
        grants: invalidGrants,
        occurredAt: '2026-09-16T06:00:00.000Z',
        alreadyPublishedEventKeys: [],
      }),
    ).toEqual([]);

    expect(
      buildOliveGrantOutboxEvents({
        grants: [grant('olive:level:2')],
        occurredAt: 'not-a-date',
        alreadyPublishedEventKeys: [],
      }),
    ).toEqual([]);
  });

  it('sorts emitted events deterministically by event key', () => {
    const result = buildOliveGrantOutboxEvents({
      grants: [
        grant('olive:level:3', { sourceId: '3' }),
        grant('olive:challenge:a', {
          sourceType: 'challenge',
          sourceId: 'a',
          reason: 'Reto A',
        }),
        grant('olive:level:2', { sourceId: '2' }),
      ],
      occurredAt: '2026-09-16T06:00:00.000Z',
      alreadyPublishedEventKeys: [],
    });

    expect(result.map((event) => event.eventKey)).toEqual([
      'outbox:olive:challenge:a',
      'outbox:olive:level:2',
      'outbox:olive:level:3',
    ]);
  });
});
