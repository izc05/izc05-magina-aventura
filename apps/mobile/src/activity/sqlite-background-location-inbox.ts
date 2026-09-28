import * as SQLite from 'expo-sqlite';

import type {
  BackgroundLocationInbox,
  BackgroundLocationPoint,
  PendingBackgroundLocation,
} from './background-location-inbox';

const DEFAULT_DATABASE_NAME = 'magina-aventura-activity.db';

type InboxRow = {
  inbox_id: number;
  timestamp_ms: number;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  altitude_m: number | null;
  speed_mps: number | null;
  heading_deg: number | null;
};

function rowToPending(row: InboxRow): PendingBackgroundLocation {
  return {
    inboxId: row.inbox_id,
    point: {
      timestampMs: row.timestamp_ms,
      latitude: row.latitude,
      longitude: row.longitude,
      accuracyMeters: row.accuracy_m,
      altitudeMeters: row.altitude_m,
      speedMps: row.speed_mps,
      headingDegrees: row.heading_deg,
    },
  };
}

export class SQLiteBackgroundLocationInbox implements BackgroundLocationInbox {
  private db: SQLite.SQLiteDatabase | null = null;

  constructor(private readonly databaseName = DEFAULT_DATABASE_NAME) {}

  private async database(): Promise<SQLite.SQLiteDatabase> {
    if (this.db) return this.db;
    this.db = await SQLite.openDatabaseAsync(this.databaseName);
    return this.db;
  }

  async initialize(): Promise<void> {
    const db = await this.database();
    await db.execAsync(`
      CREATE TABLE IF NOT EXISTS activity_background_location_inbox (
        inbox_id INTEGER PRIMARY KEY AUTOINCREMENT,
        activity_id TEXT NOT NULL,
        timestamp_ms INTEGER NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy_m REAL NOT NULL,
        altitude_m REAL,
        speed_mps REAL,
        heading_deg REAL,
        UNIQUE(activity_id, timestamp_ms, latitude, longitude)
      );

      CREATE INDEX IF NOT EXISTS activity_background_location_inbox_pending_idx
        ON activity_background_location_inbox(activity_id, inbox_id);
    `);
  }

  async append(
    activityId: string,
    points: BackgroundLocationPoint[],
  ): Promise<void> {
    if (points.length === 0) return;

    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const point of points) {
        await txn.runAsync(
          `INSERT OR IGNORE INTO activity_background_location_inbox (
            activity_id,
            timestamp_ms,
            latitude,
            longitude,
            accuracy_m,
            altitude_m,
            speed_mps,
            heading_deg
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          activityId,
          point.timestampMs,
          point.latitude,
          point.longitude,
          point.accuracyMeters,
          point.altitudeMeters,
          point.speedMps,
          point.headingDegrees,
        );
      }
    });
  }

  async loadPending(activityId: string): Promise<PendingBackgroundLocation[]> {
    const db = await this.database();
    const rows = await db.getAllAsync<InboxRow>(
      `SELECT inbox_id, timestamp_ms, latitude, longitude, accuracy_m,
              altitude_m, speed_mps, heading_deg
       FROM activity_background_location_inbox
       WHERE activity_id = ?
       ORDER BY inbox_id ASC`,
      activityId,
    );

    return rows.map(rowToPending);
  }

  async acknowledgeThrough(activityId: string, inboxId: number): Promise<void> {
    const db = await this.database();
    await db.runAsync(
      `DELETE FROM activity_background_location_inbox
       WHERE activity_id = ? AND inbox_id <= ?`,
      activityId,
      inboxId,
    );
  }
}

export const sqliteBackgroundLocationInbox = new SQLiteBackgroundLocationInbox();
