export type GpxCandidateScopeValue = 'unknown' | 'permitted' | 'not-permitted';
export type GpxCandidatePermissionDecision = 'pending' | 'granted' | 'rejected';
export type GpxCandidateScopeField = 'commercialUse' | 'derivatives' | 'distribution';
export type GpxCandidateAuthorizationField =
  | 'sourceOrUrl'
  | 'rightsHolderOrAuthor'
  | 'licenseOrPermissionType'
  | 'permissionDecision'
  | GpxCandidateScopeField
  | 'requiredAttributionText';

/** User-provided rights details. This shape deliberately contains no GPX bytes or geometry. */
export interface GpxCandidateAuthorizationDraft {
  sourceOrUrl: string;
  rightsHolderOrAuthor: string;
  licenseOrPermissionType: string;
  permissionDecision: GpxCandidatePermissionDecision;
  commercialUse: GpxCandidateScopeValue;
  derivatives: GpxCandidateScopeValue;
  distribution: GpxCandidateScopeValue;
  requiredAttributionText: string;
  /** Optional local reference only; never read, copied, uploaded, or opened by this flow. */
  localAuthorizationReference: string;
}

export type GpxCandidateAuthorizationStatus =
  | 'incomplete'
  | 'rejected'
  | 'restricted'
  | 'ready-for-official-review';

export type GpxCandidateReviewBlocker =
  | 'authorization-incomplete'
  | 'authorization-rejected'
  | 'scope-not-permitted'
  | 'official-or-field-verification-required';

/**
 * Local-only review projection. Operational capabilities are literal false:
 * this review flow has no transition that can publish, enable GPS, or create checkpoints.
 */
export interface GpxCandidateReviewRecord {
  status: 'CANDIDATE';
  verificationStatus: 'UNVERIFIED';
  authorizationStatus: GpxCandidateAuthorizationStatus;
  authorization: {
    sourceOrUrl: string;
    rightsHolderOrAuthor: string;
    licenseOrPermissionType: string;
    permissionDecision: GpxCandidatePermissionDecision;
    commercialUse: GpxCandidateScopeValue;
    derivatives: GpxCandidateScopeValue;
    distribution: GpxCandidateScopeValue;
    requiredAttributionText: string;
    localAuthorizationReference: string | null;
  };
  missingAuthorizationFields: GpxCandidateAuthorizationField[];
  restrictedScopeFields: GpxCandidateScopeField[];
  blockers: GpxCandidateReviewBlocker[];
  capabilities: {
    canPublishRoute: false;
    canUseForGps: false;
    canCreateCheckpoints: false;
  };
}

export function createEmptyGpxCandidateAuthorizationDraft(): GpxCandidateAuthorizationDraft {
  return {
    sourceOrUrl: '',
    rightsHolderOrAuthor: '',
    licenseOrPermissionType: '',
    permissionDecision: 'pending',
    commercialUse: 'unknown',
    derivatives: 'unknown',
    distribution: 'unknown',
    requiredAttributionText: '',
    localAuthorizationReference: '',
  };
}

/**
 * Evaluates only user-entered rights declarations. It does not verify a license,
 * follow a URL, inspect a proof document, or verify route geometry in the field.
 */
export function createGpxCandidateReviewRecord(
  draft: GpxCandidateAuthorizationDraft,
): GpxCandidateReviewRecord {
  const sourceOrUrl = draft.sourceOrUrl.trim();
  const rightsHolderOrAuthor = draft.rightsHolderOrAuthor.trim();
  const licenseOrPermissionType = draft.licenseOrPermissionType.trim();
  const requiredAttributionText = draft.requiredAttributionText.trim();
  const localAuthorizationReference = draft.localAuthorizationReference.trim();
  const missingAuthorizationFields: GpxCandidateAuthorizationField[] = [];

  if (!sourceOrUrl) missingAuthorizationFields.push('sourceOrUrl');
  if (!rightsHolderOrAuthor) missingAuthorizationFields.push('rightsHolderOrAuthor');
  if (!licenseOrPermissionType) missingAuthorizationFields.push('licenseOrPermissionType');
  if (!requiredAttributionText) missingAuthorizationFields.push('requiredAttributionText');
  if (draft.permissionDecision === 'pending') missingAuthorizationFields.push('permissionDecision');

  const scopeEntries: Array<[GpxCandidateScopeField, GpxCandidateScopeValue]> = [
    ['commercialUse', draft.commercialUse],
    ['derivatives', draft.derivatives],
    ['distribution', draft.distribution],
  ];
  const restrictedScopeFields: GpxCandidateScopeField[] = [];
  for (const [field, value] of scopeEntries) {
    if (value === 'unknown') missingAuthorizationFields.push(field);
    if (value === 'not-permitted') restrictedScopeFields.push(field);
  }

  const authorizationStatus: GpxCandidateAuthorizationStatus = draft.permissionDecision === 'rejected'
    ? 'rejected'
    : missingAuthorizationFields.length > 0
      ? 'incomplete'
      : restrictedScopeFields.length > 0
        ? 'restricted'
        : 'ready-for-official-review';

  const blockers: GpxCandidateReviewBlocker[] = [];
  if (authorizationStatus === 'rejected') blockers.push('authorization-rejected');
  if (authorizationStatus === 'incomplete') blockers.push('authorization-incomplete');
  if (authorizationStatus === 'restricted') blockers.push('scope-not-permitted');
  // No official/on-terrain verification signal or "mark verified" action exists in this flow.
  blockers.push('official-or-field-verification-required');

  return {
    status: 'CANDIDATE',
    verificationStatus: 'UNVERIFIED',
    authorizationStatus,
    authorization: {
      sourceOrUrl,
      rightsHolderOrAuthor,
      licenseOrPermissionType,
      permissionDecision: draft.permissionDecision,
      commercialUse: draft.commercialUse,
      derivatives: draft.derivatives,
      distribution: draft.distribution,
      requiredAttributionText,
      localAuthorizationReference: localAuthorizationReference || null,
    },
    missingAuthorizationFields,
    restrictedScopeFields,
    blockers,
    capabilities: {
      canPublishRoute: false,
      canUseForGps: false,
      canCreateCheckpoints: false,
    },
  };
}
