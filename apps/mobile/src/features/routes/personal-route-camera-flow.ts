import type {
  CameraPermissionResponse,
  ImagePickerAsset,
  ImagePickerOptions,
  ImagePickerResult,
} from 'expo-image-picker';

export interface PersonalRouteCameraPicker {
  getCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
  requestCameraPermissionsAsync(): Promise<CameraPermissionResponse>;
  launchCameraAsync(options: ImagePickerOptions): Promise<ImagePickerResult>;
}

export type PersonalRouteCameraResult =
  | { type: 'permission-denied'; canAskAgain: boolean }
  | { type: 'permission-limited' }
  | { type: 'cancelled' }
  | { type: 'invalid-file' }
  | { type: 'success'; asset: ImagePickerAsset };

/** Accept only an image file that the existing private gallery can copy locally. */
export function isValidPersonalRouteImageAsset(
  asset: ImagePickerAsset | null | undefined,
): asset is ImagePickerAsset {
  if (!asset || !/^file:\/\//i.test(asset.uri)) return false;
  if (asset.type != null && asset.type !== 'image' && asset.type !== 'livePhoto') return false;
  const mimeType = asset.mimeType?.split(';', 1)[0]?.trim().toLowerCase();
  return !mimeType || mimeType.startsWith('image/');
}

function permissionIsLimited(permission: CameraPermissionResponse): boolean {
  return String(permission.status).toLowerCase() === 'limited';
}

/** Called from an authenticated, explicit camera-button press; never from render or mount. */
export async function capturePersonalRouteImage(
  picker: PersonalRouteCameraPicker,
): Promise<PersonalRouteCameraResult> {
  let permission = await picker.getCameraPermissionsAsync();
  if (permissionIsLimited(permission)) return { type: 'permission-limited' };

  if (!permission.granted) {
    if (!permission.canAskAgain) {
      return { type: 'permission-denied', canAskAgain: false };
    }
    permission = await picker.requestCameraPermissionsAsync();
    if (permissionIsLimited(permission)) return { type: 'permission-limited' };
    if (!permission.granted) {
      return { type: 'permission-denied', canAskAgain: permission.canAskAgain };
    }
  }

  const result = await picker.launchCameraAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: false,
    exif: false,
    base64: false,
  });
  if (result.canceled) return { type: 'cancelled' };

  const asset = result.assets?.[0];
  if (!isValidPersonalRouteImageAsset(asset)) return { type: 'invalid-file' };
  return { type: 'success', asset };
}
