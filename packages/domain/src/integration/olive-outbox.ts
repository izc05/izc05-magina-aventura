import type { OliveGrantCandidate } from '../rewards/olive-grants';

export const OLIVE_GRANT_EVENT_TYPE = 'magina-aventura.olive-grant.v1' as const;

export interface OliveGrantOutboxPayload {
  userId: string;
  amount: number;
  reason: string;
  sourceType: OliveGrantCandidate['sourceType'];
  sourceId: string;
  sourceKey: string;
}

export interface OliveGrantOutboxEvent {
  eventKey: string;
  eventType: typeof OLIVE_GRANT_EVENT_TYPE;
  aggregateType: 'user';
  aggregateId: string;
  occurredAt: string;
  payload: OliveGrantOutboxPayload;
}

export interface OliveGrantOutboxInput {
  grants: OliveGrantCandidate[];
  occurredAt: string;
  alreadyPublishedEventKeys: string[];
}

function validTimestamp(value: string): boolean {
  return Number.isFinite(Date.parse(value));
}

function validGrant(grant: OliveGrantCandidate): boolean {
  return (
    grant.userId.trim().length > 0 &&
    grant.sourceId.trim().length > 0 &&
    grant.sourceKey.trim().length > 0 &&
    Number.isFinite(grant.amount) &&
    Number.isInteger(grant.amount) &&
    grant.amount > 0
  );
}

export function buildOliveGrantOutboxEvents(
  input: OliveGrantOutboxInput,
): OliveGrantOutboxEvent[] {
  if (!validTimestamp(input.occurredAt)) {
    return [];
  }

  const alreadyPublished = new Set(input.alreadyPublishedEventKeys);
  const emitted = new Set<string>();
  const events: OliveGrantOutboxEvent[] = [];

  for (const grant of input.grants) {
    if (!validGrant(grant)) {
      continue;
    }

    const eventKey = `outbox:${grant.sourceKey}`;
    if (alreadyPublished.has(eventKey) || emitted.has(eventKey)) {
      continue;
    }

    emitted.add(eventKey);
    events.push({
      eventKey,
      eventType: OLIVE_GRANT_EVENT_TYPE,
      aggregateType: 'user',
      aggregateId: grant.userId,
      occurredAt: input.occurredAt,
      payload: {
        userId: grant.userId,
        amount: grant.amount,
        reason: grant.reason,
        sourceType: grant.sourceType,
        sourceId: grant.sourceId,
        sourceKey: grant.sourceKey,
      },
    });
  }

  return events.sort((left, right) => left.eventKey.localeCompare(right.eventKey));
}
