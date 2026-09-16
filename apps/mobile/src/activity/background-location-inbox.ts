export interface BackgroundLocationPoint {
  timestampMs: number;
  latitude: number;
  longitude: number;
  accuracyMeters: number;
  altitudeMeters: number | null;
  speedMps: number | null;
  headingDegrees: number | null;
}

export interface PendingBackgroundLocation {
  inboxId: number;
  point: BackgroundLocationPoint;
}

export interface BackgroundLocationInbox {
  initialize(): Promise<void>;
  append(activityId: string, points: BackgroundLocationPoint[]): Promise<void>;
  loadPending(activityId: string): Promise<PendingBackgroundLocation[]>;
  acknowledgeThrough(activityId: string, inboxId: number): Promise<void>;
}

export interface MemoryBackgroundLocationInboxDatabase {
  nextInboxId: number;
  records: Map<string, PendingBackgroundLocation[]>;
  dedupeKeys: Set<string>;
}

export function createMemoryBackgroundLocationInboxDatabase(): MemoryBackgroundLocationInboxDatabase {
  return {
    nextInboxId: 1,
    records: new Map(),
    dedupeKeys: new Set(),
  };
}

function clonePoint(point: BackgroundLocationPoint): BackgroundLocationPoint {
  return { ...point };
}

function dedupeKey(activityId: string, point: BackgroundLocationPoint): string {
  return `${activityId}:${point.timestampMs}:${point.latitude}:${point.longitude}`;
}

export class MemoryBackgroundLocationInbox implements BackgroundLocationInbox {
  constructor(
    private readonly database: MemoryBackgroundLocationInboxDatabase =
      createMemoryBackgroundLocationInboxDatabase(),
  ) {}

  async initialize(): Promise<void> {
    return undefined;
  }

  async append(activityId: string, points: BackgroundLocationPoint[]): Promise<void> {
    const records = this.database.records.get(activityId) ?? [];

    for (const point of points) {
      const key = dedupeKey(activityId, point);
      if (this.database.dedupeKeys.has(key)) continue;

      this.database.dedupeKeys.add(key);
      records.push({
        inboxId: this.database.nextInboxId,
        point: clonePoint(point),
      });
      this.database.nextInboxId += 1;
    }

    this.database.records.set(activityId, records);
  }

  async loadPending(activityId: string): Promise<PendingBackgroundLocation[]> {
    return (this.database.records.get(activityId) ?? [])
      .slice()
      .sort((left, right) => left.inboxId - right.inboxId)
      .map((record) => ({
        inboxId: record.inboxId,
        point: clonePoint(record.point),
      }));
  }

  async acknowledgeThrough(activityId: string, inboxId: number): Promise<void> {
    const remaining = (this.database.records.get(activityId) ?? []).filter(
      (record) => record.inboxId > inboxId,
    );
    this.database.records.set(activityId, remaining);
  }
}
