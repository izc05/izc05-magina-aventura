export interface RewardReservationExpiryInput {
  now: string;
  rewardMetadata: unknown;
  partnerMetadata: unknown;
  platformDefaultTtlMinutes: number;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function metadataTtlMinutes(
  metadata: unknown,
  source: 'reward' | 'partner',
): number | null {
  if (!isRecord(metadata) || !('reservationTtlMinutes' in metadata)) {
    return null;
  }

  const value = metadata.reservationTtlMinutes;
  if (!Number.isInteger(value) || typeof value !== 'number' || value <= 0) {
    throw new Error(`invalid ${source} reservation ttl`);
  }

  return value;
}

function platformTtlMinutes(value: number): number {
  if (!Number.isInteger(value) || value <= 0) {
    throw new Error('invalid platform reservation ttl');
  }

  return value;
}

export function resolveRewardReservationExpiry(
  input: RewardReservationExpiryInput,
): string {
  const nowTimestamp = Date.parse(input.now);
  if (!Number.isFinite(nowTimestamp)) {
    throw new Error('invalid reservation clock');
  }

  const ttlMinutes =
    metadataTtlMinutes(input.rewardMetadata, 'reward') ??
    metadataTtlMinutes(input.partnerMetadata, 'partner') ??
    platformTtlMinutes(input.platformDefaultTtlMinutes);

  const expiresAt = new Date(nowTimestamp + ttlMinutes * 60_000);
  if (!Number.isFinite(expiresAt.getTime())) {
    throw new Error('invalid reservation expiry');
  }

  return expiresAt.toISOString();
}
