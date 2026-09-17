import { describe, expect, it } from 'vitest';

import { serveRewardActionRequest } from '../../../../../supabase/functions/_shared/reward-actions-entrypoint';
import type { RewardActionHttpDependencies } from '../../../../../supabase/functions/_shared/reward-actions-http';

const userId = '50000000-0000-4000-8000-000000000001';
const rewardId = '50000000-0000-4000-8000-000000000010';

describe('serveRewardActionRequest', () => {
  it('returns a cors preflight without authenticating or executing rewards', async () => {
    let authCalls = 0;
    let executeCalls = 0;
    const dependencies: RewardActionHttpDependencies = {
      authenticateAccessToken: async () => {
        authCalls += 1;
        return userId;
      },
      executeCommand: async () => {
        executeCalls += 1;
        return {};
      },
    };

    const response = await serveRewardActionRequest(
      new Request('https://example.test/functions/v1/rewards-actions/digital-purchases', {
        method: 'OPTIONS',
      }),
      dependencies,
    );

    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-methods')).toContain('POST');
    expect(authCalls).toBe(0);
    expect(executeCalls).toBe(0);
  });

  it('returns the authenticated reward result as json with cors headers', async () => {
    const dependencies: RewardActionHttpDependencies = {
      authenticateAccessToken: async () => userId,
      executeCommand: async () => ({ status: 'purchased', available: 3200 }),
    };

    const response = await serveRewardActionRequest(
      new Request('https://example.test/functions/v1/rewards-actions/digital-purchases', {
        method: 'POST',
        headers: {
          authorization: 'Bearer access-token',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          rewardId,
          idempotencyKey: 'purchase-mobile-0020',
        }),
      }),
      dependencies,
    );

    expect(response.status).toBe(200);
    expect(response.headers.get('access-control-allow-origin')).toBe('*');
    await expect(response.json()).resolves.toEqual({
      status: 'purchased',
      available: 3200,
    });
  });

  it('rejects malformed json before authentication or rpc execution', async () => {
    let authCalls = 0;
    let executeCalls = 0;
    const dependencies: RewardActionHttpDependencies = {
      authenticateAccessToken: async () => {
        authCalls += 1;
        return userId;
      },
      executeCommand: async () => {
        executeCalls += 1;
        return {};
      },
    };

    const response = await serveRewardActionRequest(
      new Request('https://example.test/functions/v1/rewards-actions/digital-purchases', {
        method: 'POST',
        headers: {
          authorization: 'Bearer access-token',
          'content-type': 'application/json',
        },
        body: '{not-json',
      }),
      dependencies,
    );

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toEqual({
      code: 'invalid-request-body',
    });
    expect(authCalls).toBe(0);
    expect(executeCalls).toBe(0);
  });
});
