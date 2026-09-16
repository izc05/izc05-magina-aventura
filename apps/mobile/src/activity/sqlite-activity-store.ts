import type {
  ActivitySession,
  ActivitySnapshot,
  ActivityState,
  LocationRejectionReason,
  LocationSample,
} from '@magina-aventura/contracts';
import * as SQLite from 'expo-sqlite';

import type { ActivityStore, RecoveredActivity } from './activity-store';

const DEFAULT_DATABASE_NAME = 'magina-aventura-activity.db';

type SessionRow = {
  activity_id: string;
  route_id: string;
  route_slug: string;
  geometry_version: number;
  state: ActivityState;
  started_at: string;
  paused_at: string | null;
  finished_at: string | null;
  last_processed_sequence: number;
  sync_state: ActivitySession['syncState'];
};

type SnapshotRow = { payload_json: string };

type SampleRow = {
  sequence: number;
  timestamp: string;
  latitude: number;
  longitude: number;
  accuracy_m: number;
  altitude_m: number | null;
  speed_mps: number | null;
  heading_deg: number | null;
  valid_for_metrics: number;
  rejection_reason: LocationRejectionReason;
};

function sessionFromRow(row: SessionRow): ActivitySession {
  return {
    activityId: row.activity_id,
    routeId: row.route_id,
    routeSlug: row.route_slug,
    geometryVersion: row.geometry_version,
    state: row.state,
    startedAt: row.started_at,
    pausedAt: row.paused_at,
    finishedAt: row.finished_at,
    lastProcessedSequence: row.last_processed_sequence,
    syncState: row.sync_state,
  };
}

function sampleFromRow(row: SampleRow): LocationSample {
  return {
    sequence: row.sequence,
    timestamp: row.timestamp,
    latitude: row.latitude,
    longitude: row.longitude,
    accuracyMeters: row.accuracy_m,
    altitudeMeters: row.altitude_m,
    speedMps: row.speed_mps,
    headingDegrees: row.heading_deg,
    validForMetrics: row.valid_for_metrics === 1,
    rejectionReason: row.rejection_reason,
  };
}

async function writeSession(
  db: SQLite.SQLiteDatabase,
  session: ActivitySession,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO activity_sessions (
      activity_id, route_id, route_slug, geometry_version, state, started_at,
      paused_at, finished_at, last_processed_sequence, sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(activity_id) DO UPDATE SET
      route_id = excluded.route_id,
      route_slug = excluded.route_slug,
      geometry_version = excluded.geometry_version,
      state = excluded.state,
      started_at = excluded.started_at,
      paused_at = excluded.paused_at,
      finished_at = excluded.finished_at,
      last_processed_sequence = excluded.last_processed_sequence,
      sync_state = excluded.sync_state`,
    session.activityId,
    session.routeId,
    session.routeSlug,
    session.geometryVersion,
    session.state,
    session.startedAt,
    session.pausedAt,
    session.finishedAt,
    session.lastProcessedSequence,
    session.syncState,
  );
}

async function writeSnapshot(
  db: SQLite.SQLiteDatabase,
  snapshot: ActivitySnapshot,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO activity_snapshots (
      activity_id, last_processed_sequence, payload_json, created_at
    ) VALUES (?, ?, ?, ?)
    ON CONFLICT(activity_id, last_processed_sequence) DO UPDATE SET
      payload_json = excluded.payload_json,
      created_at = excluded.created_at`,
    snapshot.activityId,
    snapshot.lastProcessedSequence,
    JSON.stringify(snapshot),
    snapshot.createdAt,
  );
}

async function writeSample(
  db: SQLite.SQLiteDatabase,
  activityId: string,
  sample: LocationSample,
): Promise<void> {
  await db.runAsync(
    `INSERT OR IGNORE INTO activity_samples (
      activity_id, sequence, timestamp, latitude, longitude, accuracy_m,
      altitude_m, speed_mps, heading_deg, valid_for_metrics, rejection_reason
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    activityId,
    sample.sequence,
    sample.timestamp,
    sample.latitude,
    sample.longitude,
    sample.accuracyMeters,
    sample.altitudeMeters,
    sample.speedMps,
    sample.headingDegrees,
    sample.validForMetrics ? 1 : 0,
    sample.rejectionReason,
  );
}

export class SQLiteActivityStore implements ActivityStore {
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
      PRAGMA journal_mode = WAL;
      PRAGMA foreign_keys = ON;

      CREATE TABLE IF NOT EXISTS activity_sessions (
        activity_id TEXT PRIMARY KEY NOT NULL,
        route_id TEXT NOT NULL,
        route_slug TEXT NOT NULL,
        geometry_version INTEGER NOT NULL,
        state TEXT NOT NULL,
        started_at TEXT NOT NULL,
        paused_at TEXT,
        finished_at TEXT,
        last_processed_sequence INTEGER NOT NULL DEFAULT 0,
        sync_state TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS activity_samples (
        activity_id TEXT NOT NULL,
        sequence INTEGER NOT NULL,
        timestamp TEXT NOT NULL,
        latitude REAL NOT NULL,
        longitude REAL NOT NULL,
        accuracy_m REAL NOT NULL,
        altitude_m REAL,
        speed_mps REAL,
        heading_deg REAL,
        valid_for_metrics INTEGER NOT NULL,
        rejection_reason TEXT,
        PRIMARY KEY (activity_id, sequence),
        FOREIGN KEY (activity_id) REFERENCES activity_sessions(activity_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_snapshots (
        activity_id TEXT NOT NULL,
        last_processed_sequence INTEGER NOT NULL,
        payload_json TEXT NOT NULL,
        created_at TEXT NOT NULL,
        PRIMARY KEY (activity_id, last_processed_sequence),
        FOREIGN KEY (activity_id) REFERENCES activity_sessions(activity_id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS activity_sync_batches (
        batch_id TEXT PRIMARY KEY NOT NULL,
        activity_id TEXT NOT NULL,
        sequence_start INTEGER NOT NULL,
        sequence_end INTEGER NOT NULL,
        idempotency_key TEXT NOT NULL UNIQUE,
        payload_json TEXT NOT NULL,
        state TEXT NOT NULL,
        created_at TEXT NOT NULL,
        FOREIGN KEY (activity_id) REFERENCES activity_sessions(activity_id) ON DELETE CASCADE
      );

      CREATE INDEX IF NOT EXISTS activity_sessions_recovery_idx
        ON activity_sessions(state, started_at DESC);
      CREATE INDEX IF NOT EXISTS activity_samples_sequence_idx
        ON activity_samples(activity_id, sequence);
      CREATE INDEX IF NOT EXISTS activity_snapshots_latest_idx
        ON activity_snapshots(activity_id, last_processed_sequence DESC);
    `);
  }

  async createSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
  ): Promise<void> {
    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await writeSession(txn, {
        ...session,
        lastProcessedSequence: snapshot.lastProcessedSequence,
      });
      await writeSnapshot(txn, snapshot);
    });
  }

  async appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
  ): Promise<void> {
    if (samples.length === 0 && !snapshot) return;

    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      for (const sample of samples) {
        await writeSample(txn, activityId, sample);
      }

      if (snapshot) {
        await writeSnapshot(txn, snapshot);
        await txn.runAsync(
          `UPDATE activity_sessions
           SET last_processed_sequence = ?
           WHERE activity_id = ?`,
          snapshot.lastProcessedSequence,
          activityId,
        );
      }
    });
  }

  async loadActiveSession(): Promise<RecoveredActivity | null> {
    const db = await this.database();
    const sessionRow = await db.getFirstAsync<SessionRow>(
      `SELECT * FROM activity_sessions
       WHERE state IN ('ACTIVE', 'PAUSED')
       ORDER BY started_at DESC
       LIMIT 1`,
    );

    if (!sessionRow) return null;

    const snapshotRow = await db.getFirstAsync<SnapshotRow>(
      `SELECT payload_json FROM activity_snapshots
       WHERE activity_id = ?
       ORDER BY last_processed_sequence DESC
       LIMIT 1`,
      sessionRow.activity_id,
    );

    if (!snapshotRow) return null;

    const snapshot = JSON.parse(snapshotRow.payload_json) as ActivitySnapshot;
    const sampleRows = await db.getAllAsync<SampleRow>(
      `SELECT sequence, timestamp, latitude, longitude, accuracy_m, altitude_m,
              speed_mps, heading_deg, valid_for_metrics, rejection_reason
       FROM activity_samples
       WHERE activity_id = ? AND sequence > ?
       ORDER BY sequence ASC`,
      sessionRow.activity_id,
      snapshot.lastProcessedSequence,
    );

    return {
      session: {
        ...sessionFromRow(sessionRow),
        lastProcessedSequence: snapshot.lastProcessedSequence,
      },
      snapshot,
      samplesAfterSnapshot: sampleRows.map(sampleFromRow),
    };
  }

  async updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
  ): Promise<void> {
    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await writeSession(txn, {
        ...session,
        lastProcessedSequence: snapshot.lastProcessedSequence,
      });
      await writeSnapshot(txn, snapshot);
    });
  }

  async loadTrack(activityId: string): Promise<LocationSample[]> {
    const db = await this.database();
    const rows = await db.getAllAsync<SampleRow>(
      `SELECT sequence, timestamp, latitude, longitude, accuracy_m, altitude_m,
              speed_mps, heading_deg, valid_for_metrics, rejection_reason
       FROM activity_samples
       WHERE activity_id = ?
       ORDER BY sequence ASC`,
      activityId,
    );
    return rows.map(sampleFromRow);
  }
}

export const sqliteActivityStore = new SQLiteActivityStore();
