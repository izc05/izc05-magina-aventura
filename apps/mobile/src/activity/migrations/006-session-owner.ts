export const SESSION_OWNER_MIGRATION = `
ALTER TABLE activity_sessions
  ADD COLUMN owner_id TEXT;
CREATE INDEX IF NOT EXISTS activity_sessions_owner_state_started
  ON activity_sessions (owner_id, state, started_at DESC);
`;
