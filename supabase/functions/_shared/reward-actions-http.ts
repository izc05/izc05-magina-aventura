import {
  parseRewardActionCommand,
  type RewardActionCommand,
} from './reward-actions-core';

export interface RewardActionHttpDependencies {
  authenticateAccessToken: (token: string) => Promise<string | null>;
  executeCommand: (command: RewardActionCommand) => Promise<unknown>;
}

export interface RewardActionHttpRequestInput {
  method: string;
  pathname: string;
  authorization: string | null;
  body: unknown;
}

export interface RewardActionHttpResult {
  status: number;
  body: unknown;
}

function bearerToken(authorization: string | null): string | null {
  if (authorization === null) {
    return null;
  }

  const match = /^Bearer\s+(.+)$/i.exec(authorization.trim());
  const token = match?.[1]?.trim();
  return token && token.length > 0 ? token : null;
}

function rewardActionPathname(pathname: string): string {
  const normalized = pathname.trim();
  const marker = '/rewards-actions';
  const markerIndex = normalized.indexOf(marker);

  if (markerIndex < 0) {
    return normalized;
  }

  const subpath = normalized.slice(markerIndex + marker.length);
  return subpath.length > 0 ? subpath : '/';
}

export async function handleRewardActionHttpRequest(
  input: RewardActionHttpRequestInput,
  dependencies: RewardActionHttpDependencies,
): Promise<RewardActionHttpResult> {
  const token = bearerToken(input.authorization);
  if (token === null) {
    return {
      status: 401,
      body: { code: 'authentication-required' },
    };
  }

  const authenticatedUserId = await dependencies.authenticateAccessToken(token);
  if (authenticatedUserId === null) {
    return {
      status: 401,
      body: { code: 'authentication-required' },
    };
  }

  const parsed = parseRewardActionCommand({
    method: input.method,
    pathname: rewardActionPathname(input.pathname),
    authenticatedUserId,
    body: input.body,
  });

  if (!parsed.ok) {
    return {
      status: parsed.status,
      body: { code: parsed.code },
    };
  }

  const result = await dependencies.executeCommand(parsed.command);
  return {
    status: 200,
    body: result,
  };
}
