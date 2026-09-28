import { ACTIVITY_CORE_MIGRATION } from './001-activity-core';
import { EXPLORATION_MIGRATION } from './002-exploration';
import { ADVENTURE_BINDING_MIGRATION } from './003-adventure-binding';

export interface SQLiteMigrationDatabase {
  execAsync(source: string): Promise<void>;
  runAsync(source: string, ...params: unknown[]): Promise<unknown>;
  getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null>;
  withExclusiveTransactionAsync(
    callback: (transaction: SQLiteMigrationDatabase) => Promise<void>,
  ): Promise<void>;
}

interface AppliedMigrationRow {
  version: number;
}

export interface SQLiteMigration {
  version: number;
  name: string;
  sql: string;
}

export const ACTIVITY_MIGRATIONS: readonly SQLiteMigration[] = [
  { version: 1, name: 'activity-core', sql: ACTIVITY_CORE_MIGRATION },
  { version: 2, name: 'exploration', sql: EXPLORATION_MIGRATION },
  { version: 3, name: 'adventure-binding', sql: ADVENTURE_BINDING_MIGRATION },
];

export const ACTIVITY_SCHEMA_VERSION = ACTIVITY_MIGRATIONS.at(-1)?.version ?? 0;

const MIGRATION_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS activity_schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at TEXT NOT NULL
);
`;

export async function activitySchemaVersion(
  database: Pick<SQLiteMigrationDatabase, 'getFirstAsync'>,
): Promise<number> {
  const row = await database.getFirstAsync<AppliedMigrationRow>(
    'SELECT MAX(version) AS version FROM activity_schema_migrations',
  );
  return row?.version ?? 0;
}

/** Applies only missing migrations in version order and never drops activity data. */
export async function runActivityMigrations(
  database: SQLiteMigrationDatabase,
  now: () => string = () => new Date().toISOString(),
): Promise<number> {
  await database.execAsync(MIGRATION_TABLE_SQL);

  for (const migration of ACTIVITY_MIGRATIONS) {
    await database.withExclusiveTransactionAsync(async (transaction) => {
      const existing = await transaction.getFirstAsync<AppliedMigrationRow>(
        'SELECT version FROM activity_schema_migrations WHERE version = ?',
        migration.version,
      );
      if (existing) return;

      await transaction.execAsync(migration.sql);
      await transaction.runAsync(
        'INSERT INTO activity_schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
        migration.version,
        migration.name,
        now(),
      );
    });
  }

  return activitySchemaVersion(database);
}
