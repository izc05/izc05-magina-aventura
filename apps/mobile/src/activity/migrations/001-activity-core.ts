export const ACTIVITY_CORE_MIGRATION = `
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
CREATE INDEX IF NOT EXISTS activity_sync_batches_pending_idx
  ON activity_sync_batches(activity_id, state, sequence_start);
`;
