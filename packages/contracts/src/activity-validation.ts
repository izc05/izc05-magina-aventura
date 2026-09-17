export type ActivityValidationState = 'VALIDATING' | 'VERIFIED' | 'FLAGGED' | 'REJECTED';

export interface ActivityValidationDecision {
  activityId: string;
  state: ActivityValidationState;
  reasonCodes: string[];
  policyVersion: string;
  decidedAt: string;
}