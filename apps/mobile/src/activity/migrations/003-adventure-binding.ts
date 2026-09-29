export const ADVENTURE_BINDING_MIGRATION = `
ALTER TABLE activity_sessions ADD COLUMN adventure_slug TEXT;
ALTER TABLE activity_sessions ADD COLUMN adventure_version INTEGER;
`;
