export const RECORDING_SOURCE_MIGRATION = `
ALTER TABLE activity_sessions
  ADD COLUMN recording_source TEXT NOT NULL DEFAULT 'unclassified';
`;
