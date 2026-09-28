import type {
  ActivitySession,
  ActivitySnapshot,
  ActivityState,
  ActivitySyncBatch,
  LocationRejectionReason,
  LocationSample,
} from '@magina-aventura/contracts';
import type {
  ExplorationObservation,
  ExplorationState,
} from '@magina-aventura/activity-engine';
import * as SQLite from 'expo-sqlite';

import { runActivityMigrations } from './migrations';
import type {
  ActivityStore,
  ExplorationPersistence,
  RecoveredActivity,
} from './activity-store';

const DEFAULT_DATABASE_NAME = 'magina-aventura-activity.db';

type SessionRow = {
  activity_id: string;
  adventure_slug: string | null;
  adventure_version: number | null;
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
type SyncBatchRow = { payload_json: string };
type SyncBatchActivityRow = { activity_id: string };
type CountRow = { count: number };
type ExplorationStateRow = { state_json: string; last_evaluated_sequence: number };
type ExplorationObservationRow = { payload_json: string };

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
  if (!row.adventure_slug || !Number.isInteger(row.adventure_version)) {
    throw new Error('Activity is missing its immutable AdventureDefinition binding');
  }

  return {
    activityId: row.activity_id,
    adventureSlug: row.adventure_slug,
    adventureVersion: row.adventure_version!,
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

function syncBatchFromRow(row: SyncBatchRow): ActivitySyncBatch {
  return JSON.parse(row.payload_json) as ActivitySyncBatch;
}

function explorationFromRows(
  stateRow: ExplorationStateRow | null,
  observationRows: ExplorationObservationRow[],
): ExplorationPersistence {
  const state: ExplorationState = stateRow
    ? JSON.parse(stateRow.state_json) as ExplorationState
    : {
        progressByTargetKey: {},
        unlockedTargetKeys: [],
        lastEvaluatedSequence: 0,
      };

  return {
    state: {
      ...state,
      lastEvaluatedSequence: stateRow?.last_evaluated_sequence ?? state.lastEvaluatedSequence,
    },
    observations: observationRows.map(
      (row) => JSON.parse(row.payload_json) as ExplorationObservation,
    ),
  };
}

async function writeExploration(
  db: SQLite.SQLiteDatabase,
  activityId: string,
  exploration: ExplorationPersistence,
  updatedAt: string,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO activity_exploration_state (
      activity_id, state_json, last_evaluated_sequence, updated_at
    ) VALUES (?, ?, ?, ?)
    ON CONFLICT(activity_id) DO UPDATE SET
      state_json = excluded.state_json,
      last_evaluated_sequence = excluded.last_evaluated_sequence,
      updated_at = excluded.updated_at`,
    activityId,
    JSON.stringify(exploration.state),
    exploration.state.lastEvaluatedSequence,
    updatedAt,
  );

  for (const observation of exploration.observations) {
    await db.runAsync(
      `INSERT OR IGNORE INTO activity_exploration_observations (
        activity_id, target_key, target_kind, target_id, observed_at,
        sample_sequence, distance_m, accuracy_m, payload_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      activityId,
      observation.targetKey,
      observation.kind,
      observation.targetId,
      observation.observedAt,
      observation.sampleSequence,
      observation.distanceMeters,
      observation.accuracyMeters,
      JSON.stringify(observation),
    );
  }
}

async function writeSession(
  db: SQLite.SQLiteDatabase,
  session: ActivitySession,
): Promise<void> {
  await db.runAsync(
    `INSERT INTO activity_sessions (
      activity_id, adventure_slug, adventure_version, route_id, route_slug,
      geometry_version, state, started_at, paused_at, finished_at,
      last_processed_sequence, sync_state
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(activity_id) DO UPDATE SET
      adventure_slug = excluded.adventure_slug,
      adventure_version = excluded.adventure_version,
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
    session.adventureSlug,
    session.adventureVersion,
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
    await db.execAsync('PRAGMA journal_mode = WAL; PRAGMA foreign_keys = ON;');
    await runActivityMigrations(db);
  }

  async createSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration: ExplorationPersistence = {
      state: {
        progressByTargetKey: {},
        unlockedTargetKeys: [],
        lastEvaluatedSequence: 0,
      },
      observations: [],
    },
  ): Promise<void> {
    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await writeSession(txn, {
        ...session,
        lastProcessedSequence: snapshot.lastProcessedSequence,
      });
      await writeSnapshot(txn, snapshot);
      await writeExploration(txn, session.activityId, exploration, snapshot.createdAt);
    });
  }

  async appendBatch(
    activityId: string,
    samples: LocationSample[],
    snapshot: ActivitySnapshot | null,
    exploration?: ExplorationPersistence,
  ): Promise<void> {
    if (samples.length === 0 && !snapshot && !exploration) return;

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
      if (exploration) {
        await writeExploration(
          txn,
          activityId,
          exploration,
          snapshot?.createdAt ?? new Date().toISOString(),
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
    const explorationStateRow = await db.getFirstAsync<ExplorationStateRow>(
      `SELECT state_json, last_evaluated_sequence
       FROM activity_exploration_state WHERE activity_id = ?`,
      sessionRow.activity_id,
    );
    const explorationObservationRows = await db.getAllAsync<ExplorationObservationRow>(
      `SELECT payload_json FROM activity_exploration_observations
       WHERE activity_id = ? ORDER BY sample_sequence ASC`,
      sessionRow.activity_id,
    );

    return {
      session: {
        ...sessionFromRow(sessionRow),
        lastProcessedSequence: snapshot.lastProcessedSequence,
      },
      snapshot,
      samplesAfterSnapshot: sampleRows.map(sampleFromRow),
      exploration: explorationFromRows(
        explorationStateRow,
        explorationObservationRows,
      ),
    };
  }

  async updateSession(
    session: ActivitySession,
    snapshot: ActivitySnapshot,
    exploration?: ExplorationPersistence,
  ): Promise<void> {
    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await writeSession(txn, {
        ...session,
        lastProcessedSequence: snapshot.lastProcessedSequence,
      });
      await writeSnapshot(txn, snapshot);
      if (exploration) {
        await writeExploration(txn, session.activityId, exploration, snapshot.createdAt);
      }
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

  async loadExploration(activityId: string): Promise<ExplorationPersistence> {
    const db = await this.database();
    const stateRow = await db.getFirstAsync<ExplorationStateRow>(
      `SELECT state_json, last_evaluated_sequence
       FROM activity_exploration_state WHERE activity_id = ?`,
      activityId,
    );
    const observationRows = await db.getAllAsync<ExplorationObservationRow>(
      `SELECT payload_json FROM activity_exploration_observations
       WHERE activity_id = ? ORDER BY sample_sequence ASC`,
      activityId,
    );
    return explorationFromRows(stateRow, observationRows);
  }

  async queueSyncBatch(batch: ActivitySyncBatch): Promise<ActivitySyncBatch> {
    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      await txn.runAsync(
        `INSERT OR IGNORE INTO activity_sync_batches (
          batch_id, activity_id, sequence_start, sequence_end, idempotency_key,
          payload_json, state, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, 'queued', ?)`,
        batch.batchId,
        batch.activityId,
        batch.sequenceStart,
        batch.sequenceEnd,
        batch.idempotencyKey,
        JSON.stringify(batch),
        batch.createdAt,
      );
      await txn.runAsync(
        `UPDATE activity_sessions
         SET sync_state = 'queued'
         WHERE activity_id = ? AND sync_state <> 'synced'`,
        batch.activityId,
      );
    });

    const row = await db.getFirstAsync<SyncBatchRow>(
      `SELECT payload_json
       FROM activity_sync_batches
       WHERE idempotency_key = ?`,
      batch.idempotencyKey,
    );
    if (!row) {
      throw new Error('Unable to persist activity sync batch');
    }
    return syncBatchFromRow(row);
  }

  async loadPendingSyncBatches(activityId: string): Promise<ActivitySyncBatch[]> {
    const db = await this.database();
    const rows = await db.getAllAsync<SyncBatchRow>(
      `SELECT payload_json
       FROM activity_sync_batches
       WHERE activity_id = ? AND state <> 'synced'
       ORDER BY sequence_start ASC`,
      activityId,
    );
    return rows.map(syncBatchFromRow);
  }

  async markSyncBatchSynced(batchId: string): Promise<void> {
    const db = await this.database();
    await db.withExclusiveTransactionAsync(async (txn) => {
      const batchRow = await txn.getFirstAsync<SyncBatchActivityRow>(
        `SELECT activity_id
         FROM activity_sync_batches
         WHERE batch_id = ?`,
        batchId,
      );
      if (!batchRow) return;

      await txn.runAsync(
        `UPDATE activity_sync_batches
         SET state = 'synced'
         WHERE batch_id = ?`,
        batchId,
      );

      const pending = await txn.getFirstAsync<CountRow>(
        `SELECT COUNT(*) AS count
         FROM activity_sync_batches
         WHERE activity_id = ? AND state <> 'synced'`,
        batchRow.activity_id,
      );
      if ((pending?.count ?? 0) === 0) {
        await txn.runAsync(
          `UPDATE activity_sessions
           SET sync_state = 'synced'
           WHERE activity_id = ?`,
          batchRow.activity_id,
        );
      }
    });
  }
}

export const sqliteActivityStore = new SQLiteActivityStore();
