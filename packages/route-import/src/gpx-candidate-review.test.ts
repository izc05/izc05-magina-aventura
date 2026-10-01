import { describe, expect, it } from 'vitest';
import {
  createEmptyGpxCandidateAuthorizationDraft,
  createGpxCandidateReviewRecord,
  type GpxCandidateAuthorizationDraft,
} from './gpx-candidate-review';

const completeRights: GpxCandidateAuthorizationDraft = {
  sourceOrUrl: 'Fuente del titular, referencia local de prueba',
  rightsHolderOrAuthor: 'Titular de prueba',
  licenseOrPermissionType: 'Permiso escrito para este uso',
  permissionDecision: 'granted',
  commercialUse: 'permitted',
  derivatives: 'permitted',
  distribution: 'permitted',
  requiredAttributionText: 'Atribución de prueba',
  localAuthorizationReference: '',
};

describe('local GPX candidate rights review', () => {
  it('keeps a candidate blocked when authorization fields are missing', () => {
    const record = createGpxCandidateReviewRecord(createEmptyGpxCandidateAuthorizationDraft());

    expect(record.status).toBe('CANDIDATE');
    expect(record.verificationStatus).toBe('UNVERIFIED');
    expect(record.authorizationStatus).toBe('incomplete');
    expect(record.missingAuthorizationFields).toEqual(expect.arrayContaining([
      'sourceOrUrl',
      'rightsHolderOrAuthor',
      'licenseOrPermissionType',
      'permissionDecision',
      'commercialUse',
      'derivatives',
      'distribution',
      'requiredAttributionText',
    ]));
    expect(record.capabilities).toEqual({
      canPublishRoute: false,
      canUseForGps: false,
      canCreateCheckpoints: false,
    });
    expect(record.blockers).toContain('authorization-incomplete');
    expect(record.blockers).toContain('official-or-field-verification-required');
  });

  it('blocks partial permission when any required use scope is not allowed', () => {
    const record = createGpxCandidateReviewRecord({
      ...completeRights,
      derivatives: 'not-permitted',
    });

    expect(record.authorizationStatus).toBe('restricted');
    expect(record.restrictedScopeFields).toEqual(['derivatives']);
    expect(record.blockers).toContain('scope-not-permitted');
    expect(record.verificationStatus).toBe('UNVERIFIED');
    expect(record.capabilities.canPublishRoute).toBe(false);
    expect(record.capabilities.canUseForGps).toBe(false);
    expect(record.capabilities.canCreateCheckpoints).toBe(false);
  });

  it('records a rejected permission as rejected and does not unlock any route capability', () => {
    const record = createGpxCandidateReviewRecord({
      ...completeRights,
      permissionDecision: 'rejected',
    });

    expect(record.status).toBe('CANDIDATE');
    expect(record.verificationStatus).toBe('UNVERIFIED');
    expect(record.authorizationStatus).toBe('rejected');
    expect(record.blockers).toContain('authorization-rejected');
    expect(record.capabilities).toEqual({
      canPublishRoute: false,
      canUseForGps: false,
      canCreateCheckpoints: false,
    });
  });

  it('still requires official/on-terrain verification after all rights fields are complete', () => {
    const record = createGpxCandidateReviewRecord(completeRights);

    expect(record.authorizationStatus).toBe('ready-for-official-review');
    expect(record.status).toBe('CANDIDATE');
    expect(record.verificationStatus).toBe('UNVERIFIED');
    expect(record.blockers).toEqual(['official-or-field-verification-required']);
    expect(record.capabilities).toEqual({
      canPublishRoute: false,
      canUseForGps: false,
      canCreateCheckpoints: false,
    });
    expect(Object.keys(record)).not.toContain('geometry');
    expect(Object.keys(record)).not.toContain('gpx');
  });

  it('treats a local authorization-document reference as optional and keeps it as plain local text', () => {
    const withoutReference = createGpxCandidateReviewRecord(completeRights);
    expect(withoutReference.authorizationStatus).toBe('ready-for-official-review');
    expect(withoutReference.authorization.localAuthorizationReference).toBeNull();

    const withReference = createGpxCandidateReviewRecord({
      ...completeRights,
      localAuthorizationReference: 'documentos-privados/permiso.pdf',
    });
    expect(withReference.authorization.localAuthorizationReference).toBe('documentos-privados/permiso.pdf');
    expect(withReference.capabilities.canPublishRoute).toBe(false);
  });
});
