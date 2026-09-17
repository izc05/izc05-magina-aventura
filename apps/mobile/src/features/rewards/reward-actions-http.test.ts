import { describe, expect, it } from 'vitest';

import {
  handleRewardActionHttpRequest,
  type RewardActionHttpDependencies,
} from '../../../../../supabase/functions/_shared/reward-actions-http';

const userId = '50000000-0000-4000-8000-000000000001';
const rewardId = '50000000-0000-4000-8000-000000000010';

describe('handleRewardActionHttpRequest', () => {
  it('authenticates a bearer token and executes the command using the authenticated user', async () => {
    const authenticatedTokens: string[] = [];
    const executed: unknown[] = [];
    const dependencies: RewardActionHttpDependencies = {
      authenticateAccessToken: async (token) => {
        authenticatedTokens.push(token);
        return userId;
      },
      executeCommand: async (command) => {
        executed.push(command);
        return { status: 'purchased', available: 3200 };
      },
    };

    const result = await handleRewardActionHttpRequest(
      {
        method: 'POST',
        pathname: '/functions/v1/rewards-actions/digital-purchases',
        authorization: 'Bearer access-token-123',
        body: {
          rewardId,
          idempotencyKey: 'purchase-mobile-0001',
        },
      },
      dependencies,
    );

    expect(authenticatedTokens).toEqual(['access-token-123']);
    expect(executed).toEqual([
      {
        kind: 'purchase-digital',
        userId,
        rewardId,
        idempotencyKey: 'purchase-mobile-0001',
      },
    ]);
    expect(result).toEqual({
      status: 200,
      body: { status: 'purchased', available: 3200 },
    });
  });

  it('returns 401 without executing when authorization is missing or invalid', async () => {
    const executed: unknown[] = [];
    const dependencies: RewardActionHttpDependencies = {
      authenticateAccessToken: async () => null,
      executeCommand: async (command) => {
        executed.push(command);
        return {};
      },
    };

    const missing = await handleRewardActionHttpRequest(
      {
        method: 'POST',
        pathname: '/functions/v1/rewards-actions/digital-purchases',
        authorization: null,
        body: { rewardId, idempotencyKey: 'purchase-mobile-0002' },
      },
      dependencies,
    );
    const invalid = await handleRewardActionHttpRequest(
      {
        method: 'POST',
        pathname: '/functions/v1/rewards-actions/digital-purchases',
        authorization: 'Bearer bad-token',
        body: { rewardId, idempotencyKey: 'purchase-mobile-0003' },
      },
      dependencies,
    );

    expect(missing).toEqual({
      status: 401,
      body: { code: 'authentication-required' },
    });
    expect(invalid).toEqual({
      status: 401,
      body: { code: 'authentication-required' },
    });
    expect(executed).toEqual([]);
  });

  it('rejects forbidden client fields before any reward command is executed', async () => {
    const executed: unknown[] = [];
    const dependencies: RewardActionHttpDependencies = {
      authenticateAccessToken: async () => userId,
      executeCommand: async (command) => {
        executed.push(command);
        return {};
      },
    };

    const result = await handleRewardActionHttpRequest(
      {
        method: 'POST',
        pathname: '/functions/v1/rewards-actions/digital-purchases',
        authorization: 'Bearer valid-token',
        body: {
          userId: '50000000-0000-4000-8000-000000000099',
          rewardId,
          idempotencyKey: 'purchase-mobile-0004',
        },
      },
      dependencies,
    );

    expect(result).toEqual({
      status: 400,
      body: { code: 'forbidden-client-field' },
    });
    expect(executed).toEqual([]);
  });
});
