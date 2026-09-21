import { describe, expect, it } from 'vitest';

import {
  ACTIVITY_SCHEMA_VERSION,
  activitySchemaVersion,
  runActivityMigrations,
  type SQLiteMigrationDatabase,
} from './index';

class MigrationDatabase implements SQLiteMigrationDatabase {
  readonly applied = new Set<number>();
  readonly executed: string[] = [];

  constructor(versions: number[] = []) {
    for (const version of versions) this.applied.add(version);
  }

  async execAsync(source: string): Promise<void> {
    this.executed.push(source);
  }

  async runAsync(source: string, ...params: unknown[]): Promise<void> {
    this.executed.push(source);
    if (source.includes('INSERT INTO activity_schema_migrations')) {
      this.applied.add(params[0] as number);
    }
  }

  async getFirstAsync<T>(source: string, ...params: unknown[]): Promise<T | null> {
    if (source.includes('MAX(version)')) {
      const version = this.applied.size === 0 ? null : Math.max(...this.applied);
      return (version === null ? null : { version }) as T | null;
    }
    if (source.includes('WHERE version = ?')) {
      const version = params[0] as number;
      return (this.applied.has(version) ? { version } : null) as T | null;
    }
    return null;
  }

  async withExclusiveTransactionAsync(
    callback: (transaction: SQLiteMigrationDatabase) => Promise<void>,
  ): Promise<void> {
    await callback(this);
  }
}

describe('activity SQLite migration runner', () => {
  it('migrates an existing pre-exploration database in order without a destructive statement', async () => {
    const database = new MigrationDatabase([1]);

    const version = await runActivityMigrations(
      database,
      () => '2026-09-20T12:00:00.000Z',
    );

    expect(version).toBe(ACTIVITY_SCHEMA_VERSION);
    expect([...database.applied]).toEqual([1, 2, 3]);
    expect(database.executed.join('\n')).toContain('activity_exploration_state');
    expect(database.executed.join('\n')).toContain('ADD COLUMN adventure_slug');
    expect(database.executed.join('\n')).not.toMatch(/DROP\s+TABLE/i);
  });

  it('is idempotent after all migration records have been applied', async () => {
    const database = new MigrationDatabase([1, 2, 3]);

    await runActivityMigrations(database);

    expect(await activitySchemaVersion(database)).toBe(3);
    expect(database.executed.filter((source) => source.includes('ALTER TABLE'))).toHaveLength(0);
    expect(database.executed.filter((source) => source.includes('activity_exploration_state'))).toHaveLength(0);
  });
});
