import { describe, expect, it } from 'vitest';
import { deduplicateSyncOperations } from './idempotency';

describe('deduplicateSyncOperations', () => {
  it('keeps the first occurrence of an idempotency key', () => {
    const result = deduplicateSyncOperations([
      { idempotencyKey: 'activity:1:finish', kind: 'activity.finish' },
      { idempotencyKey: 'activity:1:finish', kind: 'activity.finish' },
      { idempotencyKey: 'activity:1:checkpoint:2', kind: 'checkpoint.reached' },
    ]);

    expect(result.map((item) => item.idempotencyKey)).toEqual([
      'activity:1:finish',
      'activity:1:checkpoint:2',
    ]);
  });
});
