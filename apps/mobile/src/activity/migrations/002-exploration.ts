export const EXPLORATION_MIGRATION = `
CREATE TABLE IF NOT EXISTS activity_exploration_state (
  activity_id TEXT PRIMARY KEY NOT NULL,
  state_json TEXT NOT NULL,
  last_evaluated_sequence INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (activity_id) REFERENCES activity_sessions(activity_id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS activity_exploration_observations (
  activity_id TEXT NOT NULL,
  target_key TEXT NOT NULL,
  target_kind TEXT NOT NULL,
  target_id TEXT NOT NULL,
  observed_at TEXT NOT NULL,
  sample_sequence INTEGER NOT NULL,
  distance_m REAL NOT NULL,
  accuracy_m REAL NOT NULL,
  payload_json TEXT NOT NULL,
  PRIMARY KEY (activity_id, target_key),
  FOREIGN KEY (activity_id) REFERENCES activity_sessions(activity_id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS activity_exploration_observations_sequence_idx
  ON activity_exploration_observations(activity_id, sample_sequence);
`;
