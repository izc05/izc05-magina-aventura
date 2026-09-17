export type RewardActionErrorCode =
  | 'authentication-required'
  | 'method-not-allowed'
  | 'route-not-found'
  | 'invalid-request-body'
  | 'forbidden-client-field'
  | 'invalid-reward-id'
  | 'invalid-pickup-location-id'
  | 'invalid-idempotency-key';

export interface PurchaseDigitalRewardCommand {
  kind: 'purchase-digital';
  userId: string;
  rewardId: string;
  idempotencyKey: string;
}

export interface ReservePhysicalRewardCommand {
  kind: 'reserve-physical';
  userId: string;
  rewardId: string;
  pickupLocationId: string;
  idempotencyKey: string;
}

export type RewardActionCommand =
  | PurchaseDigitalRewardCommand
  | ReservePhysicalRewardCommand;

export type RewardActionParseResult =
  | { ok: true; command: RewardActionCommand }
  | {
      ok: false;
      status: 400 | 401 | 404 | 405;
      code: RewardActionErrorCode;
    };

export interface RewardActionRequestInput {
  method: string;
  pathname: string;
  authenticatedUserId: string;
  body: unknown;
}

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const IDEMPOTENCY_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9:._-]{7,127}$/;
const FORBIDDEN_CLIENT_FIELDS = new Set([
  'userId',
  'user_id',
  'p_user_id',
  'expiresAt',
  'expires_at',
  'p_expires_at',
]);

function failure(
  status: 400 | 401 | 404 | 405,
  code: RewardActionErrorCode,
): RewardActionParseResult {
  return { ok: false, status, code };
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function stringValue(
  body: Record<string, unknown>,
  key: string,
): string | null {
  const value = body[key];
  return typeof value === 'string' ? value.trim() : null;
}

function hasForbiddenClientField(body: Record<string, unknown>): boolean {
  return Object.keys(body).some((key) => FORBIDDEN_CLIENT_FIELDS.has(key));
}

function isUuid(value: string | null): value is string {
  return value !== null && UUID_PATTERN.test(value);
}

function isIdempotencyKey(value: string | null): value is string {
  return value !== null && IDEMPOTENCY_KEY_PATTERN.test(value);
}

function normalizedPathname(pathname: string): string {
  const trimmed = pathname.trim();
  if (trimmed.length <= 1) {
    return trimmed || '/';
  }

  return trimmed.endsWith('/') ? trimmed.slice(0, -1) : trimmed;
}

export function parseRewardActionCommand(
  input: RewardActionRequestInput,
): RewardActionParseResult {
  const authenticatedUserId = input.authenticatedUserId.trim();

  if (!isUuid(authenticatedUserId)) {
    return failure(401, 'authentication-required');
  }

  const pathname = normalizedPathname(input.pathname);
  const knownRoute =
    pathname === '/digital-purchases' ||
    pathname === '/physical-reservations';

  if (!knownRoute) {
    return failure(404, 'route-not-found');
  }

  if (input.method.trim().toUpperCase() !== 'POST') {
    return failure(405, 'method-not-allowed');
  }

  if (!isRecord(input.body)) {
    return failure(400, 'invalid-request-body');
  }

  if (hasForbiddenClientField(input.body)) {
    return failure(400, 'forbidden-client-field');
  }

  const rewardId = stringValue(input.body, 'rewardId');
  if (!isUuid(rewardId)) {
    return failure(400, 'invalid-reward-id');
  }

  const idempotencyKey = stringValue(input.body, 'idempotencyKey');
  if (!isIdempotencyKey(idempotencyKey)) {
    return failure(400, 'invalid-idempotency-key');
  }

  if (pathname === '/digital-purchases') {
    return {
      ok: true,
      command: {
        kind: 'purchase-digital',
        userId: authenticatedUserId,
        rewardId,
        idempotencyKey,
      },
    };
  }

  const pickupLocationId = stringValue(input.body, 'pickupLocationId');
  if (!isUuid(pickupLocationId)) {
    return failure(400, 'invalid-pickup-location-id');
  }

  return {
    ok: true,
    command: {
      kind: 'reserve-physical',
      userId: authenticatedUserId,
      rewardId,
      pickupLocationId,
      idempotencyKey,
    },
  };
}
