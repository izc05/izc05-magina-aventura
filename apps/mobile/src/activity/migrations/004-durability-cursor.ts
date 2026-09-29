export const DURABILITY_CURSOR_MIGRATION = `
ALTER TABLE activity_sessions
  ADD COLUMN last_consumed_inbox_id INTEGER NOT NULL DEFAULT 0;
`;
