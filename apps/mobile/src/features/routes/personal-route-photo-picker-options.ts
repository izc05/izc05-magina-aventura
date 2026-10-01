import type { ImagePickerOptions } from 'expo-image-picker';

/**
 * Use the platform's scoped Photo Picker, return only the selected image, and
 * never ask the picker to fetch a remote/iCloud original on the app's behalf.
 */
export const personalRoutePhotoPickerOptions: ImagePickerOptions = {
  mediaTypes: ['images'],
  allowsMultipleSelection: false,
  exif: false,
  base64: false,
  legacy: false,
  shouldDownloadFromNetwork: false,
};
