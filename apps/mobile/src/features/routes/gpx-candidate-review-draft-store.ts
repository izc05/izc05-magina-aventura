import * as SQLite from 'expo-sqlite';
import {
  createEmptyGpxCandidateAuthorizationDraft,
  type GpxCandidateAuthorizationDraft,
  type GpxCandidatePermissionDecision,
  type GpxCandidateScopeValue,
} from '@magina-aventura/route-import';

const DATABASE_NAME = 'magina-aventura-local-gpx-candidate-review.db';
const DRAFT_ID = 'active-local-candidate';
const TABLE_NAME = 'local_gpx_candidate_rights_draft';

const CREATE_DRAFT_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS ${TABLE_NAME} (
  owner_id TEXT PRIMARY KEY NOT NULL,
  candidate_id TEXT NOT NULL CHECK (candidate_id = '${DRAFT_ID}'),
  candidate_status TEXT NOT NULL CHECK (candidate_status = 'CANDIDATE'),
  verification_status TEXT NOT NULL CHECK (verification_status = 'UNVERIFIED'),
  source_or_url TEXT NOT NULL DEFAULT '',
  rights_holder_or_author TEXT NOT NULL DEFAULT '',
  license_or_permission_type TEXT NOT NULL DEFAULT '',
  permission_decision TEXT NOT NULL CHECK (permission_decision IN ('pending', 'granted', 'rejected')),
  commercial_use TEXT NOT NULL CHECK (commercial_use IN ('unknown', 'permitted', 'not-permitted')),
  derivatives TEXT NOT NULL CHECK (derivatives IN ('unknown', 'permitted', 'not-permitted')),
  distribution TEXT NOT NULL CHECK (distribution IN ('unknown', 'permitted', 'not-permitted')),
  required_attribution_text TEXT NOT NULL DEFAULT ''
);
`;

interface GpxCandidateDraftRow {
  owner_id: string;
  candidate_id: string;
  candidate_status: string;
  verification_status: string;
  source_or_url: string;
  rights_holder_or_author: string;
  license_or_permission_type: string;
  permission_decision: string;
  commercial_use: string;
  derivatives: string;
  distribution: string;
  required_attribution_text: string;
}

export type GpxCandidateReviewDatabase = Pick<
  SQLite.SQLiteDatabase,
  'execAsync' | 'runAsync' | 'getFirstAsync' | 'closeAsync'
>;

export interface StoredGpxCandidateRightsDraft {
  status: 'CANDIDATE';
  verificationStatus: 'UNVERIFIED';
  authorizationDraft: GpxCandidateAuthorizationDraft;
}

export interface GpxCandidateReviewDraftStore {
  loadDraft(ownerId: string): Promise<StoredGpxCandidateRightsDraft | null>;
  saveDraft(ownerId: string, draft: GpxCandidateAuthorizationDraft): Promise<void>;
  clearDraft(ownerId: string): Promise<void>;
  close(): Promise<void>;
}

function isPermissionDecision(value: string): value is GpxCandidatePermissionDecision {
  return value === 'pending' || value === 'granted' || value === 'rejected';
}

function isScopeValue(value: string): value is GpxCandidateScopeValue {
  return value === 'unknown' || value === 'permitted' || value === 'not-permitted';
}

function requiredOwnerId(ownerId: string): string {
  const normalized = ownerId.trim();
  if (!normalized) throw new Error('A local user owner is required for a private GPX rights draft.');
  return normalized;
}

function mapDraftRow(row: GpxCandidateDraftRow): StoredGpxCandidateRightsDraft | null {
  if (row.candidate_id !== DRAFT_ID || row.candidate_status !== 'CANDIDATE' || row.verification_status !== 'UNVERIFIED') {
    return null;
  }
  const draft = createEmptyGpxCandidateAuthorizationDraft();
  return {
    status: 'CANDIDATE',
    verificationStatus: 'UNVERIFIED',
    authorizationDraft: {
      ...draft,
      sourceOrUrl: row.source_or_url ?? '',
      rightsHolderOrAuthor: row.rights_holder_or_author ?? '',
      licenseOrPermissionType: row.license_or_permission_type ?? '',
      permissionDecision: isPermissionDecision(row.permission_decision) ? row.permission_decision : 'pending',
      commercialUse: isScopeValue(row.commercial_use) ? row.commercial_use : 'unknown',
      derivatives: isScopeValue(row.derivatives) ? row.derivatives : 'unknown',
      distribution: isScopeValue(row.distribution) ? row.distribution : 'unknown',
      requiredAttributionText: row.required_attribution_text ?? '',
      // Local document paths/references are intentionally not persisted.
      localAuthorizationReference: '',
    },
  };
}

/**
 * Creates an account-scoped local draft store. It uses a dedicated private DB and table,
 * with no foreign keys, triggers, outbox, sync queue, GPX bytes, file URI, or geometry.
 */
export function createGpxCandidateReviewDraftStore(
  openDatabase: () => Promise<GpxCandidateReviewDatabase>,
): GpxCandidateReviewDraftStore {
  let databasePromise: Promise<GpxCandidateReviewDatabase> | null = null;
  let writeQueue: Promise<void> = Promise.resolve();

  const database = (): Promise<GpxCandidateReviewDatabase> => {
    if (databasePromise) return databasePromise;
    const opening = openDatabase().then(async (db) => {
      await db.execAsync(CREATE_DRAFT_TABLE_SQL);
      return db;
    });
    const cached = opening.catch((error: unknown) => {
      databasePromise = null;
      throw error;
    });
    databasePromise = cached;
    return cached;
  };

  const enqueueWrite = (operation: () => Promise<void>): Promise<void> => {
    const next = writeQueue.then(operation);
    writeQueue = next.catch(() => undefined);
    return next;
  };

  return {
    async loadDraft(ownerId) {
      const db = await database();
      const row = await db.getFirstAsync<GpxCandidateDraftRow>(
        `SELECT owner_id, candidate_id, candidate_status, verification_status,
                source_or_url, rights_holder_or_author, license_or_permission_type,
                permission_decision, commercial_use, derivatives, distribution,
                required_attribution_text
         FROM ${TABLE_NAME}
         WHERE owner_id = ?`,
        requiredOwnerId(ownerId),
      );
      return row ? mapDraftRow(row) : null;
    },

    saveDraft(ownerId, draft) {
      const normalizedOwnerId = requiredOwnerId(ownerId);
      return enqueueWrite(async () => {
        const db = await database();
        await db.runAsync(
          `INSERT INTO ${TABLE_NAME} (
            owner_id, candidate_id, candidate_status, verification_status,
            source_or_url, rights_holder_or_author, license_or_permission_type,
            permission_decision, commercial_use, derivatives, distribution,
            required_attribution_text
          ) VALUES (?, '${DRAFT_ID}', 'CANDIDATE', 'UNVERIFIED', ?, ?, ?, ?, ?, ?, ?, ?)
          ON CONFLICT(owner_id) DO UPDATE SET
            candidate_id = excluded.candidate_id,
            candidate_status = excluded.candidate_status,
            verification_status = excluded.verification_status,
            source_or_url = excluded.source_or_url,
            rights_holder_or_author = excluded.rights_holder_or_author,
            license_or_permission_type = excluded.license_or_permission_type,
            permission_decision = excluded.permission_decision,
            commercial_use = excluded.commercial_use,
            derivatives = excluded.derivatives,
            distribution = excluded.distribution,
            required_attribution_text = excluded.required_attribution_text`,
          normalizedOwnerId,
          draft.sourceOrUrl,
          draft.rightsHolderOrAuthor,
          draft.licenseOrPermissionType,
          draft.permissionDecision,
          draft.commercialUse,
          draft.derivatives,
          draft.distribution,
          draft.requiredAttributionText,
        );
      });
    },

    clearDraft(ownerId) {
      const normalizedOwnerId = requiredOwnerId(ownerId);
      return enqueueWrite(async () => {
        const db = await database();
        await db.runAsync(
          `DELETE FROM ${TABLE_NAME} WHERE owner_id = ? AND candidate_id = '${DRAFT_ID}'`,
          normalizedOwnerId,
        );
      });
    },

    async close() {
      await writeQueue;
      const current = databasePromise;
      if (!current) return;
      const db = await current;
      await db.closeAsync();
      if (databasePromise === current) databasePromise = null;
    },
  };
}

/** Private app database; never wired to route publication, activity sync, or outbox code. */
export const gpxCandidateReviewDraftStore = createGpxCandidateReviewDraftStore(
  () => SQLite.openDatabaseAsync(DATABASE_NAME),
);
