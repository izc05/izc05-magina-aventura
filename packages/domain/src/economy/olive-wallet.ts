export type OliveMovementType =
  | 'grant'
  | 'reserve'
  | 'release'
  | 'spend'
  | 'refund'
  | 'admin-adjustment';

export interface OliveMovement {
  userId: string;
  type: OliveMovementType;
  amount: number;
  sourceKey: string;
  reservationId: string | null;
  occurredAt: string;
}

export interface OliveWalletProjection {
  available: number;
  reserved: number;
  lifetimeGranted: number;
  lifetimeSpent: number;
  acceptedSourceKeys: string[];
  rejectedSourceKeys: string[];
}

function validTimestamp(value: string): number | null {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function validAmount(value: number): value is number {
  return Number.isFinite(value) && Number.isInteger(value) && value > 0;
}

function normalizedReservationId(value: string | null): string | null {
  if (value === null) {
    return null;
  }

  const normalized = value.trim();
  return normalized.length > 0 ? normalized : null;
}

export function projectOliveWallet(
  userId: string,
  movements: OliveMovement[],
): OliveWalletProjection {
  let available = 0;
  let reserved = 0;
  let lifetimeGranted = 0;
  let lifetimeSpent = 0;

  const acceptedSourceKeys: string[] = [];
  const rejectedSourceKeys: string[] = [];
  const accepted = new Set<string>();
  const reservationBalances = new Map<string, number>();

  const ordered = movements
    .map((movement, index) => ({
      movement,
      index,
      timestamp: validTimestamp(movement.occurredAt),
    }))
    .sort((left, right) => {
      const leftTime = left.timestamp ?? Number.POSITIVE_INFINITY;
      const rightTime = right.timestamp ?? Number.POSITIVE_INFINITY;
      return (
        leftTime - rightTime ||
        left.movement.sourceKey.localeCompare(right.movement.sourceKey) ||
        left.index - right.index
      );
    });

  const reject = (sourceKey: string) => {
    rejectedSourceKeys.push(sourceKey);
  };

  for (const item of ordered) {
    const movement = item.movement;
    const sourceKey = movement.sourceKey.trim();

    if (
      movement.userId !== userId ||
      sourceKey.length === 0 ||
      item.timestamp === null ||
      !validAmount(movement.amount) ||
      accepted.has(sourceKey)
    ) {
      reject(movement.sourceKey);
      continue;
    }

    const reservationId = normalizedReservationId(movement.reservationId);
    let applied = false;

    switch (movement.type) {
      case 'grant':
        available += movement.amount;
        lifetimeGranted += movement.amount;
        applied = true;
        break;

      case 'refund':
      case 'admin-adjustment':
        available += movement.amount;
        applied = true;
        break;

      case 'reserve':
        if (reservationId !== null && available >= movement.amount) {
          available -= movement.amount;
          reserved += movement.amount;
          reservationBalances.set(
            reservationId,
            (reservationBalances.get(reservationId) ?? 0) + movement.amount,
          );
          applied = true;
        }
        break;

      case 'release': {
        if (reservationId === null) {
          break;
        }

        const reservationBalance = reservationBalances.get(reservationId) ?? 0;
        if (reservationBalance < movement.amount) {
          break;
        }

        reservationBalances.set(
          reservationId,
          reservationBalance - movement.amount,
        );
        reserved -= movement.amount;
        available += movement.amount;
        applied = true;
        break;
      }

      case 'spend':
        if (reservationId === null) {
          if (available >= movement.amount) {
            available -= movement.amount;
            lifetimeSpent += movement.amount;
            applied = true;
          }
          break;
        }

        {
          const reservationBalance = reservationBalances.get(reservationId) ?? 0;
          if (reservationBalance >= movement.amount) {
            reservationBalances.set(
              reservationId,
              reservationBalance - movement.amount,
            );
            reserved -= movement.amount;
            lifetimeSpent += movement.amount;
            applied = true;
          }
        }
        break;
    }

    if (!applied) {
      reject(movement.sourceKey);
      continue;
    }

    accepted.add(sourceKey);
    acceptedSourceKeys.push(movement.sourceKey);
  }

  return {
    available,
    reserved,
    lifetimeGranted,
    lifetimeSpent,
    acceptedSourceKeys,
    rejectedSourceKeys,
  };
}
