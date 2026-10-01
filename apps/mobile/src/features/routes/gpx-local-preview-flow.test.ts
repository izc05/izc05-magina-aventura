import { describe, expect, it, vi } from 'vitest';
import { GPX_LOCAL_PREVIEW_MAX_BYTES } from '@magina-aventura/route-import';
import { SYNTHETIC_TEST_ONLY_GPX } from '../../../../../packages/route-import/src/gpx-local-preview.test-fixture';
import {
  discardGpxLocalPreview,
  loadGpxLocalPreview,
  type GpxFilePickerPort,
  type SelectedGpxFile,
} from './gpx-local-preview-flow';

function selectedFile(overrides: Partial<SelectedGpxFile> = {}): SelectedGpxFile {
  return {
    name: 'fixture-sintetico.gpx',
    sizeBytes: SYNTHETIC_TEST_ONLY_GPX.length,
    readText: vi.fn(async () => SYNTHETIC_TEST_ONLY_GPX),
    ...overrides,
  };
}

function picker(file: SelectedGpxFile | null): GpxFilePickerPort {
  return { pickFile: vi.fn(async () => file) };
}

describe('local GPX selection flow', () => {
  it('represents a system-picker cancellation explicitly', async () => {
    await expect(loadGpxLocalPreview(picker(null))).resolves.toEqual({ status: 'cancelled' });
  });

  it('rejects a wrong extension without reading the selected file', async () => {
    const file = selectedFile({ name: 'not-a-gpx.xml' });
    await expect(loadGpxLocalPreview(picker(file))).resolves.toEqual({
      status: 'invalid',
      reason: 'wrong-extension',
    });
    expect(file.readText).not.toHaveBeenCalled();
  });

  it('returns a limited local preview for the synthetic test fixture only', async () => {
    const file = selectedFile();
    const result = await loadGpxLocalPreview(picker(file));
    expect(result.status).toBe('valid-local');
    if (result.status !== 'valid-local') throw new Error('Expected valid local preview');
    expect(result.preview).toMatchObject({
      fileName: 'fixture-sintetico.gpx',
      trackCount: 1,
      waypointCount: 2,
      provenanceStatus: 'Sin verificar / pendiente de autorización',
    });
    expect(Object.keys(result.preview)).not.toContain('uri');
    expect(JSON.stringify(result.preview)).not.toMatch(/coordinates|elevations|distance|ascent|checkpoint|geometry/i);
    expect(file.readText).toHaveBeenCalledOnce();
  });

  it('rejects oversized files before reading them', async () => {
    const file = selectedFile({ sizeBytes: GPX_LOCAL_PREVIEW_MAX_BYTES + 1 });
    await expect(loadGpxLocalPreview(picker(file))).resolves.toEqual({
      status: 'invalid',
      reason: 'file-too-large',
    });
    expect(file.readText).not.toHaveBeenCalled();
  });

  it('classifies malformed content as invalid/damaged', async () => {
    const file = selectedFile({ readText: vi.fn(async () => '<gpx version="1.1"><trk>') });
    await expect(loadGpxLocalPreview(picker(file))).resolves.toEqual({
      status: 'invalid',
      reason: 'invalid-xml',
    });
  });

  it('classifies picker and file-read failures as access errors', async () => {
    await expect(loadGpxLocalPreview({ pickFile: async () => { throw new Error('picker unavailable'); } }))
      .resolves.toEqual({ status: 'access-error' });
    const unreadable = selectedFile({ readText: vi.fn(async () => { throw new Error('read denied'); }) });
    await expect(loadGpxLocalPreview(picker(unreadable))).resolves.toEqual({ status: 'access-error' });
  });

  it('discards the in-memory preview without leaving selected-file state', () => {
    expect(discardGpxLocalPreview()).toEqual({ status: 'idle' });
  });
});
