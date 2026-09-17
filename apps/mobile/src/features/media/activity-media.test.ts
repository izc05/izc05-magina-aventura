import { describe, expect, it } from 'vitest';
import {
  captureActivityMedia,
  publishMediaForCommunity,
  unpublishMedia,
  preparePublicDerivative,
} from './activity-media';

describe('activity-media', () => {
  it('captures a photo as PRIVATE with no community publication', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg');

    expect(ref.privacy).toBe('PRIVATE');
    expect(ref.syncState).toBe('LOCAL');
    expect(ref.activityId).toBe('act-1');
    expect(ref.localUri).toBe('file:///photo.jpg');
    expect(ref.remoteObjectPath).toBeNull();
  });

  it('links media to a discovery when provided', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg', 'disc-1');

    expect(ref.discoveryId).toBe('disc-1');
    expect(ref.privacy).toBe('PRIVATE');
  });

  it('rejects publishing unsynced media', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg');

    expect(() => publishMediaForCommunity(ref)).toThrow('not been synced');
  });

  it('publishes synced media explicitly to community', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg');
    const synced = { ...ref, syncState: 'SYNCED' as const, remoteObjectPath: 'media/photo.jpg' };

    const published = publishMediaForCommunity(synced);

    expect(published.privacy).toBe('PUBLIC');
    expect(published.activityId).toBe('act-1'); // evidence link preserved
  });

  it('unpublishing does not destroy private activity evidence', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg');
    const synced = { ...ref, syncState: 'SYNCED' as const, remoteObjectPath: 'media/photo.jpg' };
    const published = publishMediaForCommunity(synced);

    const hidden = unpublishMedia(published);

    expect(hidden.privacy).toBe('PRIVATE');
    expect(hidden.activityId).toBe('act-1'); // evidence preserved
    expect(hidden.localUri).toBe('file:///photo.jpg');
  });

  it('preparePublicDerivative marks EXIF stripping intent', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg');
    const synced = { ...ref, syncState: 'SYNCED' as const, remoteObjectPath: 'media/photo.jpg' };

    const derivative = preparePublicDerivative(synced);

    expect(derivative.stripExif).toBe(true);
    expect(derivative.objectPath).toBe('media/photo.jpg');
  });

  it('rejects derivative without remote object', () => {
    const ref = captureActivityMedia('act-1', 'file:///photo.jpg');

    expect(() => preparePublicDerivative(ref)).toThrow('without remote object');
  });
});
