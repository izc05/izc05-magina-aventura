import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { GpxCandidateAuthorizationDraft } from '@magina-aventura/route-import';
import {
  createGpxCandidateReviewDraftStore,
  type GpxCandidateReviewDatabase,
} from './gpx-candidate-review-draft-store';

const mocks = vi.hoisted(() => {
  const rows = new Map<string, Record<string, string>>();
  const execAsync = vi.fn(async (_sql: string) => undefined);
  const runAsync = vi.fn(async (sql: string, ...params: unknown[]) => {
    if (sql.includes('INSERT INTO local_gpx_candidate_rights_draft')) {
      const [ownerId, source, holder, license, decision, commercial, derivatives, distribution, attribution] = params as string[];
      rows.set(ownerId!, {
        owner_id: ownerId!,
        candidate_id: 'active-local-candidate',
        candidate_status: 'CANDIDATE',
        verification_status: 'UNVERIFIED',
        source_or_url: source!,
        rights_holder_or_author: holder!,
        license_or_permission_type: license!,
        permission_decision: decision!,
        commercial_use: commercial!,
        derivatives: derivatives!,
        distribution: distribution!,
        required_attribution_text: attribution!,
      });
    } else if (sql.includes('DELETE FROM local_gpx_candidate_rights_draft')) {
      rows.delete(params[0] as string);
    }
    return { changes: 1 };
  });
  const getFirstAsync = vi.fn(async <T>(_sql: string, ownerId: string): Promise<T | null> => {
    return (rows.get(ownerId) as T | undefined) ?? null;
  });
  const closeAsync = vi.fn(async () => undefined);
  const database = { execAsync, runAsync, getFirstAsync, closeAsync };
  const openDatabaseAsync = vi.fn(async () => database);
  return { rows, execAsync, runAsync, getFirstAsync, closeAsync, database, openDatabaseAsync };
});

vi.mock('expo-sqlite', () => ({ openDatabaseAsync: mocks.openDatabaseAsync }));

const completeDraft: GpxCandidateAuthorizationDraft = {
  sourceOrUrl: 'fuente local de prueba',
  rightsHolderOrAuthor: 'titular de prueba',
  licenseOrPermissionType: 'permiso escrito de prueba',
  permissionDecision: 'granted',
  commercialUse: 'permitted',
  derivatives: 'permitted',
  distribution: 'permitted',
  requiredAttributionText: 'Texto literal de atribución',
  localAuthorizationReference: 'privado/autorizacion.pdf',
};

function createStore() {
  const openDatabase = vi.fn(async () => mocks.database as unknown as GpxCandidateReviewDatabase);
  return { store: createGpxCandidateReviewDraftStore(openDatabase), openDatabase };
}

beforeEach(() => {
  mocks.rows.clear();
  mocks.execAsync.mockClear();
  mocks.runAsync.mockClear();
  mocks.getFirstAsync.mockClear();
  mocks.closeAsync.mockClear();
});

describe('private SQLite GPX candidate rights draft store', () => {
  it('persists metadata locally and recovers the UNVERIFIED draft after closing and reopening the database', async () => {
    const first = createStore();
    await first.store.saveDraft('user-a', completeDraft);
    await first.store.close();

    const reopened = createStore();
    const loaded = await reopened.store.loadDraft('user-a');

    expect(first.openDatabase).toHaveBeenCalledOnce();
    expect(mocks.closeAsync).toHaveBeenCalledOnce();
    expect(reopened.openDatabase).toHaveBeenCalledOnce();
    expect(loaded).toEqual({
      status: 'CANDIDATE',
      verificationStatus: 'UNVERIFIED',
      authorizationDraft: {
        ...completeDraft,
        // A local path/reference is not among the persisted rights metadata.
        localAuthorizationReference: '',
      },
    });
  });

  it('keeps local rows isolated by account owner and does not return another user\'s draft', async () => {
    const { store } = createStore();
    await store.saveDraft('user-a', completeDraft);

    await expect(store.loadDraft('user-b')).resolves.toBeNull();
    expect(mocks.getFirstAsync.mock.calls.at(-1)?.[1]).toBe('user-b');
  });

  it('creates a dedicated private table without outbox/sync fields, geometry, file URIs, or document references', async () => {
    const { store } = createStore();
    await store.saveDraft('user-a', completeDraft);
    const schema = mocks.execAsync.mock.calls.map(([sql]) => sql).join('\n');
    const insert = mocks.runAsync.mock.calls.map(([sql, ...params]) => `${sql}\n${params.join('\n')}`).join('\n');

    expect(schema).toContain('local_gpx_candidate_rights_draft');
    expect(schema).toContain("candidate_status = 'CANDIDATE'");
    expect(schema).toContain("verification_status = 'UNVERIFIED'");
    expect(schema).not.toMatch(/outbox|sync_queue|geometry|file_uri|gpx_bytes|authorization_document|local_authorization_reference/i);
    expect(insert).toContain('Texto literal de atribución');
    expect(insert).not.toContain('privado/autorizacion.pdf');
    expect(insert).not.toMatch(/outbox|sync_queue|geometry|file_uri|gpx_bytes|authorization_document|local_authorization_reference/i);
  });

  it('deletes only the current account\'s private draft', async () => {
    const { store } = createStore();
    await store.saveDraft('user-a', completeDraft);
    await store.clearDraft('user-a');

    await expect(store.loadDraft('user-a')).resolves.toBeNull();
    expect(mocks.runAsync.mock.calls.at(-1)?.[0]).toContain('DELETE FROM local_gpx_candidate_rights_draft');
    expect(mocks.runAsync.mock.calls.at(-1)?.[1]).toBe('user-a');
  });
});
