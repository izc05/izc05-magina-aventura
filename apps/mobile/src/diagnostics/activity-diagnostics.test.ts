import { describe, expect, it } from 'vitest';
import { ActivityDiagnostics } from './activity-diagnostics';

describe('activity-diagnostics', () => {
  const diag = () => new ActivityDiagnostics('1.0.0-rc1', 'abc123');

  it('emits START event', () => {
    const d = diag();
    const event = d.emit('START', 'act-1');

    expect(event.type).toBe('START');
    expect(event.activityId).toBe('act-1');
    expect(event.schemaVersion).toBe('diagnostic-event.v1');
    expect(event.appVersion).toBe('1.0.0-rc1');
  });

  it('emits BACKGROUND event', () => {
    const event = diag().emit('BACKGROUND', 'act-1');
    expect(event.type).toBe('BACKGROUND');
  });

  it('emits GPS_LOST event', () => {
    const event = diag().emit('GPS_LOST', 'act-1', { lastAccuracy: 50 });
    expect(event.type).toBe('GPS_LOST');
    expect(event.details.lastAccuracy).toBe(50);
  });

  it('emits GPS_RECOVERED event', () => {
    const event = diag().emit('GPS_RECOVERED', 'act-1');
    expect(event.type).toBe('GPS_RECOVERED');
  });

  it('emits OFF_ROUTE event', () => {
    const event = diag().emit('OFF_ROUTE', 'act-1', { distanceM: 120 });
    expect(event.type).toBe('OFF_ROUTE');
  });

  it('emits SYNC_ATTEMPT event', () => {
    const event = diag().emit('SYNC_ATTEMPT', 'act-1', { batchId: 'b1' });
    expect(event.type).toBe('SYNC_ATTEMPT');
  });

  it('emits SYNC_ACK event', () => {
    const event = diag().emit('SYNC_ACK', 'act-1');
    expect(event.type).toBe('SYNC_ACK');
  });

  it('emits SYNC_ERROR event', () => {
    const event = diag().emit('SYNC_ERROR', 'act-1', { error: 'timeout' });
    expect(event.type).toBe('SYNC_ERROR');
  });

  it('emits RECOVERY event', () => {
    const event = diag().emit('RECOVERY', 'act-1');
    expect(event.type).toBe('RECOVERY');
  });

  it('strips auth token fields from details', () => {
    const event = diag().emit('START', 'act-1', {
      authToken: 'secret-token',
      accessToken: 'access-secret',
      refreshToken: 'refresh-secret',
      apiKey: 'key-123',
      password: 'hunter2',
      supabaseKey: 'sb-key',
      jwt: 'jwt-secret',
      normalField: 'visible',
    } as any);

    expect(event.details).not.toHaveProperty('authToken');
    expect(event.details).not.toHaveProperty('accessToken');
    expect(event.details).not.toHaveProperty('refreshToken');
    expect(event.details).not.toHaveProperty('apiKey');
    expect(event.details).not.toHaveProperty('password');
    expect(event.details).not.toHaveProperty('supabaseKey');
    expect(event.details).not.toHaveProperty('jwt');
    expect(event.details.normalField).toBe('visible');
  });

  it('maintains bounded timeline', () => {
    const d = diag();
    for (let i = 0; i < 510; i++) {
      d.emit('START', `act-${i}`);
    }
    expect(d.getTimeline().length).toBeLessThanOrEqual(500);
  });
});
