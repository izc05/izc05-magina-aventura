import type { ActivityMediaRef, MediaPrivacy } from '@magina-aventura/contracts';

let mediaIdCounter = 0;

/**
 * Creates a new private media reference linked to an activity.
 * Photos are PRIVATE by default — publishing to community is a separate explicit step.
 * Media upload failure never blocks track/activity sync.
 */
export function captureActivityMedia(
  activityId: string,
  localUri: string,
  discoveryId: string | null = null,
): ActivityMediaRef {
  mediaIdCounter += 1;
  return {
    id: `media-${Date.now()}-${mediaIdCounter}`,
    activityId,
    discoveryId,
    localUri,
    remoteObjectPath: null,
    privacy: 'PRIVATE',
    syncState: 'LOCAL',
  };
}

/**
 * Publishes a media ref for community viewing.
 * Returns a new ref with privacy set to PUBLIC.
 * Does NOT destroy the private activity evidence.
 */
export function publishMediaForCommunity(
  ref: ActivityMediaRef,
): ActivityMediaRef {
  if (ref.syncState !== 'SYNCED') {
    throw new Error('Cannot publish media that has not been synced');
  }
  return { ...ref, privacy: 'PUBLIC' };
}

/**
 * Hides/unpublishes a community post without destroying private evidence.
 */
export function unpublishMedia(
  ref: ActivityMediaRef,
): ActivityMediaRef {
  return { ...ref, privacy: 'PRIVATE' };
}

/**
 * Strips GPS EXIF metadata placeholder for public derivatives.
 * The actual EXIF stripping happens server-side; this marks intent.
 */
export function preparePublicDerivative(
  ref: ActivityMediaRef,
): { objectPath: string; stripExif: true } {
  if (!ref.remoteObjectPath) {
    throw new Error('Cannot prepare public derivative without remote object');
  }
  return {
    objectPath: ref.remoteObjectPath,
    stripExif: true,
  };
}
