import {
  createGpxLocalPreview,
  GPX_LOCAL_PREVIEW_MAX_BYTES,
  GpxLocalPreviewValidationError,
  type GpxLocalPreview,
  type GpxLocalPreviewInvalidReason,
} from '@magina-aventura/route-import';

export interface SelectedGpxFile {
  name: string;
  sizeBytes: number;
  readText(): Promise<string>;
}

export interface GpxFilePickerPort {
  pickFile(): Promise<SelectedGpxFile | null>;
}

export type GpxLocalPreviewLoadState =
  | { status: 'idle' }
  | { status: 'cancelled' }
  | { status: 'invalid'; reason: GpxLocalPreviewInvalidReason }
  | { status: 'valid-local'; preview: GpxLocalPreview }
  | { status: 'access-error' };

export async function loadGpxLocalPreview(
  picker: GpxFilePickerPort,
): Promise<GpxLocalPreviewLoadState> {
  let selected: SelectedGpxFile | null;
  try {
    selected = await picker.pickFile();
  } catch {
    return { status: 'access-error' };
  }
  if (!selected) return { status: 'cancelled' };
  if (!selected.name.toLocaleLowerCase().endsWith('.gpx')) {
    return { status: 'invalid', reason: 'wrong-extension' };
  }
  if (!Number.isFinite(selected.sizeBytes) || selected.sizeBytes < 0) {
    return { status: 'access-error' };
  }
  if (selected.sizeBytes === 0) {
    return { status: 'invalid', reason: 'empty-file' };
  }
  if (selected.sizeBytes > GPX_LOCAL_PREVIEW_MAX_BYTES) {
    return { status: 'invalid', reason: 'file-too-large' };
  }

  try {
    const xml = await selected.readText();
    const preview = createGpxLocalPreview(selected.name, xml, selected.sizeBytes);
    return { status: 'valid-local', preview };
  } catch (error) {
    if (error instanceof GpxLocalPreviewValidationError) {
      return { status: 'invalid', reason: error.reason };
    }
    return { status: 'access-error' };
  }
}

export function discardGpxLocalPreview(): GpxLocalPreviewLoadState {
  return { status: 'idle' };
}
