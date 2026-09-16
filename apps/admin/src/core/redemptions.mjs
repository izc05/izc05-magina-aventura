const ALLOWED_TRANSITIONS = Object.freeze({
  reserved: new Set(['redeemed', 'expired', 'cancelled']),
  redeemed: new Set(),
  expired: new Set(),
  cancelled: new Set()
});

export function canTransitionRedemption(from, to) {
  return ALLOWED_TRANSITIONS[from]?.has(to) ?? false;
}

export function assertRedemptionTransition(from, to) {
  if (!canTransitionRedemption(from, to)) {
    throw new Error(`Invalid redemption transition: ${from} -> ${to}`);
  }
}
