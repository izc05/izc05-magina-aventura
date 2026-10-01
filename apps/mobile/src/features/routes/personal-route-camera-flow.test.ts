import { describe, expect, it, vi } from 'vitest';
import type {
  CameraPermissionResponse,
  ImagePickerAsset,
  ImagePickerResult,
} from 'expo-image-picker';
import {
  capturePersonalRouteImage,
  isValidPersonalRouteImageAsset,
  type PersonalRouteCameraPicker,
} from './personal-route-camera-flow';

function permissionStatus(value: 'granted' | 'undetermined' | 'denied'): CameraPermissionResponse['status'] {
  return value as unknown as CameraPermissionResponse['status'];
}

const grantedPermission: CameraPermissionResponse = {
  status: permissionStatus('granted'),
  expires: 'never',
  granted: true,
  canAskAgain: true,
};
const undeterminedPermission: CameraPermissionResponse = {
  status: permissionStatus('undetermined'),
  expires: 'never',
  granted: false,
  canAskAgain: true,
};
const deniedPermission: CameraPermissionResponse = {
  status: permissionStatus('denied'),
  expires: 'never',
  granted: false,
  canAskAgain: false,
};
const validAsset = {
  uri: 'file:///camera-cache/capture.jpg',
  type: 'image',
  width: 1200,
  height: 900,
  mimeType: 'image/jpeg',
} as ImagePickerAsset;
const cancelledResult: ImagePickerResult = { canceled: true, assets: null };

function makePicker(
  initialPermission = grantedPermission,
  requestedPermission = grantedPermission,
  result: ImagePickerResult = cancelledResult,
) {
  return {
    getCameraPermissionsAsync: vi.fn(async () => initialPermission),
    requestCameraPermissionsAsync: vi.fn(async () => requestedPermission),
    launchCameraAsync: vi.fn(async () => result),
  } satisfies PersonalRouteCameraPicker;
}

describe('personal route camera flow', () => {
  it('uses an existing grant without requesting any gallery or storage permission', async () => {
    const camera = makePicker(grantedPermission, grantedPermission, {
      canceled: false,
      assets: [validAsset],
    });

    await expect(capturePersonalRouteImage(camera)).resolves.toEqual({ type: 'success', asset: validAsset });
    expect(camera.getCameraPermissionsAsync).toHaveBeenCalledOnce();
    expect(camera.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(camera.launchCameraAsync).toHaveBeenCalledWith({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      exif: false,
      base64: false,
    });
  });

  it('asks for camera access only when the capture flow is invoked and opens after a grant', async () => {
    const camera = makePicker(undeterminedPermission, grantedPermission, {
      canceled: false,
      assets: [validAsset],
    });

    await expect(capturePersonalRouteImage(camera)).resolves.toEqual({ type: 'success', asset: validAsset });
    expect(camera.requestCameraPermissionsAsync).toHaveBeenCalledOnce();
    expect(camera.launchCameraAsync).toHaveBeenCalledOnce();
  });

  it('does not open or save a photo when camera permission is denied', async () => {
    const camera = makePicker(undeterminedPermission, deniedPermission);

    await expect(capturePersonalRouteImage(camera)).resolves.toEqual({
      type: 'permission-denied',
      canAskAgain: false,
    });
    expect(camera.requestCameraPermissionsAsync).toHaveBeenCalledOnce();
    expect(camera.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('does not prompt again when the operating system says permission cannot be requested', async () => {
    const camera = makePicker(deniedPermission);

    await expect(capturePersonalRouteImage(camera)).resolves.toEqual({
      type: 'permission-denied',
      canAskAgain: false,
    });
    expect(camera.requestCameraPermissionsAsync).not.toHaveBeenCalled();
    expect(camera.launchCameraAsync).not.toHaveBeenCalled();
  });

  it('treats camera cancellation as a no-save result', async () => {
    const camera = makePicker(grantedPermission, grantedPermission, cancelledResult);

    await expect(capturePersonalRouteImage(camera)).resolves.toEqual({ type: 'cancelled' });
    expect(camera.launchCameraAsync).toHaveBeenCalledOnce();
  });

  it('rejects non-local URIs and non-image assets before they reach private storage', async () => {
    const remoteAsset = { ...validAsset, uri: 'https://example.invalid/photo.jpg' } as ImagePickerAsset;
    const videoAsset = { ...validAsset, type: 'video', mimeType: 'video/mp4' } as unknown as ImagePickerAsset;
    const camera = makePicker(grantedPermission, grantedPermission, {
      canceled: false,
      assets: [remoteAsset],
    });

    await expect(capturePersonalRouteImage(camera)).resolves.toEqual({ type: 'invalid-file' });
    expect(isValidPersonalRouteImageAsset(videoAsset)).toBe(false);
  });
});
