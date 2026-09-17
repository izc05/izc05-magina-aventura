export type MediaPrivacy = 'PRIVATE' | 'PUBLIC';

export type MediaSyncState = 'LOCAL' | 'QUEUED' | 'UPLOADING' | 'SYNCED' | 'FAILED';

export interface ActivityMediaRef {
  id: string;
  activityId: string;
  discoveryId: string | null;
  localUri: string | null;
  remoteObjectPath: string | null;
  privacy: MediaPrivacy;
  syncState: MediaSyncState;
}

export interface DiagnosticEventV1 {
  schemaVersion: 'diagnostic-event.v1';
  activityId: string | null;
  appVersion: string;
  candidateSha: string;
  type: string;
  occurredAt: string;
  details: Record<string, string | number | boolean | null>;
}

/** Diagnostic event types emitted by the mobile activity system. */
export type DiagnosticEventType =
  | 'START'
  | 'BACKGROUND'
  | 'GPS_LOST'
  | 'GPS_RECOVERED'
  | 'OFF_ROUTE'
  | 'SYNC_ATTEMPT'
  | 'SYNC_ACK'
  | 'SYNC_ERROR'
  | 'RECOVERY';
