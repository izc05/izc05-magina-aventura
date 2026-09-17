import type { DiagnosticEventV1 } from '@magina-aventura/contracts';
import { ActivityDiagnostics } from './activity-diagnostics';

export interface SupportBundle {
  appVersion: string;
  candidateSha: string;
  environment: 'dev' | 'staging' | 'production';
  deviceMetadata: Record<string, string>;
  activityId: string | null;
  activityState: string | null;
  eventTimeline: readonly DiagnosticEventV1[];
  syncStatus: string | null;
  /** Raw track inclusion defaults to false for privacy. */
  includeRawTrack: false;
}

export function buildSupportBundle(
  diagnostics: ActivityDiagnostics,
  options: {
    environment: 'dev' | 'staging' | 'production';
    deviceMetadata: Record<string, string>;
    activityId: string | null;
    activityState: string | null;
    syncStatus: string | null;
  },
): SupportBundle {
  const timeline = diagnostics.getTimeline();
  const first = timeline[0];

  return {
    appVersion: first?.appVersion ?? 'unknown',
    candidateSha: first?.candidateSha ?? 'unknown',
    environment: options.environment,
    deviceMetadata: options.deviceMetadata,
    activityId: options.activityId,
    activityState: options.activityState,
    eventTimeline: timeline,
    syncStatus: options.syncStatus,
    includeRawTrack: false,
  };
}
