import { describe, expect, it } from 'vitest';

import {
  projectOliveWallet,
  type OliveMovement,
} from './olive-wallet';

function movement(
  overrides: Partial<OliveMovement> & Pick<OliveMovement, 'type' | 'amount' | 'sourceKey'>,
): OliveMovement {
  return {
    userId: 'user-1',
    reservationId: null,
    occurredAt: '2026-09-16T10:00:00.000Z',
    ...overrides,
  };
}

describe('projectOliveWallet', () => {
  it('credits grants once and rejects duplicate source keys', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
    ]);

    expect(result.available).toBe(100);
    expect(result.reserved).toBe(0);
    expect(result.lifetimeGranted).toBe(100);
    expect(result.acceptedSourceKeys).toEqual(['grant:1']);
    expect(result.rejectedSourceKeys).toEqual(['grant:1']);
  });

  it('supports a direct spend from available olives', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
      movement({
        type: 'spend',
        amount: 35,
        sourceKey: 'purchase:1:spend',
        occurredAt: '2026-09-16T10:01:00.000Z',
      }),
    ]);

    expect(result.available).toBe(65);
    expect(result.reserved).toBe(0);
    expect(result.lifetimeSpent).toBe(35);
  });

  it('moves olives between available and reserved without creating value', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
      movement({
        type: 'reserve',
        amount: 60,
        sourceKey: 'reservation:r1:reserve',
        reservationId: 'r1',
        occurredAt: '2026-09-16T10:01:00.000Z',
      }),
      movement({
        type: 'release',
        amount: 20,
        sourceKey: 'reservation:r1:release:1',
        reservationId: 'r1',
        occurredAt: '2026-09-16T10:02:00.000Z',
      }),
    ]);

    expect(result.available).toBe(60);
    expect(result.reserved).toBe(40);
    expect(result.lifetimeSpent).toBe(0);
  });

  it('consumes only the matching reservation when a physical reward is spent', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
      movement({
        type: 'reserve',
        amount: 70,
        sourceKey: 'reservation:r1:reserve',
        reservationId: 'r1',
        occurredAt: '2026-09-16T10:01:00.000Z',
      }),
      movement({
        type: 'spend',
        amount: 50,
        sourceKey: 'reservation:r1:spend',
        reservationId: 'r1',
        occurredAt: '2026-09-16T10:02:00.000Z',
      }),
    ]);

    expect(result.available).toBe(30);
    expect(result.reserved).toBe(20);
    expect(result.lifetimeSpent).toBe(50);
  });

  it('rejects operations that would make available or reserved balances negative', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
      movement({
        type: 'reserve',
        amount: 120,
        sourceKey: 'reservation:r1:reserve',
        reservationId: 'r1',
        occurredAt: '2026-09-16T10:01:00.000Z',
      }),
      movement({
        type: 'spend',
        amount: 120,
        sourceKey: 'purchase:too-expensive',
        occurredAt: '2026-09-16T10:02:00.000Z',
      }),
      movement({
        type: 'release',
        amount: 10,
        sourceKey: 'reservation:r1:release',
        reservationId: 'r1',
        occurredAt: '2026-09-16T10:03:00.000Z',
      }),
    ]);

    expect(result.available).toBe(100);
    expect(result.reserved).toBe(0);
    expect(result.rejectedSourceKeys).toEqual([
      'reservation:r1:reserve',
      'purchase:too-expensive',
      'reservation:r1:release',
    ]);
  });

  it('orders valid movements by timestamp before applying them', () => {
    const result = projectOliveWallet('user-1', [
      movement({
        type: 'spend',
        amount: 60,
        sourceKey: 'purchase:1',
        occurredAt: '2026-09-16T10:01:00.000Z',
      }),
      movement({
        type: 'grant',
        amount: 100,
        sourceKey: 'grant:1',
        occurredAt: '2026-09-16T10:00:00.000Z',
      }),
    ]);

    expect(result.available).toBe(40);
    expect(result.acceptedSourceKeys).toEqual(['grant:1', 'purchase:1']);
  });

  it('rejects invalid amounts, timestamps and movements from another user', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 0, sourceKey: 'invalid:amount' }),
      movement({
        type: 'grant',
        amount: 20,
        sourceKey: 'invalid:time',
        occurredAt: 'not-a-date',
      }),
      movement({
        type: 'grant',
        amount: 20,
        sourceKey: 'invalid:user',
        userId: 'user-2',
      }),
    ]);

    expect(result.available).toBe(0);
    expect(result.rejectedSourceKeys.sort()).toEqual([
      'invalid:amount',
      'invalid:time',
      'invalid:user',
    ]);
  });

  it('credits refunds without counting them as newly earned olives', () => {
    const result = projectOliveWallet('user-1', [
      movement({ type: 'grant', amount: 100, sourceKey: 'grant:1' }),
      movement({
        type: 'spend',
        amount: 50,
        sourceKey: 'purchase:1',
        occurredAt: '2026-09-16T10:01:00.000Z',
      }),
      movement({
        type: 'refund',
        amount: 20,
        sourceKey: 'refund:1',
        occurredAt: '2026-09-16T10:02:00.000Z',
      }),
    ]);

    expect(result.available).toBe(70);
    expect(result.lifetimeGranted).toBe(100);
    expect(result.lifetimeSpent).toBe(50);
  });
});
