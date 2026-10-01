import { describe, expect, it, vi } from 'vitest';

import {
  createPersonalRouteGalleryStore,
  getPersonalRoutePhotoViewerDetails,
  selectPersonalRoutePhoto,
  type PersonalRouteGalleryLocalPort,
  type PersonalRoutePhoto,
} from './personal-route-gallery';
import { personalRoutePhotoPickerOptions } from './personal-route-photo-picker-options';

const routeSlug = 'sendero-fluvial-cueva-del-agua';
const savedAt = new Date('2026-10-01T10:00:00.000Z');

function makePort() {
  const rows: PersonalRoutePhoto[] = [];
  const copies: Array<{ sourceUri: string; fileName: string }> = [];
  const removed: string[] = [];
  const port: PersonalRouteGalleryLocalPort = {
    async list(slug) {
      return rows.filter((photo) => photo.routeSlug === slug);
    },
    async copyImageToPrivateStorage(sourceUri, fileName) {
      copies.push({ sourceUri, fileName });
      return `file:///app-private/${fileName}`;
    },
    async insert(photo) {
      rows.push(photo);
    },
    async removePrivateImage(uri) {
      removed.push(uri);
    },
  };

  return { port, rows, copies, removed };
}

const validInput = {
  routeSlug,
  sourceUri: 'file:///picker-cache/selected-photo.webp',
  mimeType: 'image/webp',
  caption: '  Agua junto al puente  ',
  credit: '  IsiVoltPro  ',
};

describe('personal route gallery persistence', () => {
  it('copies only a locally selected image, saves its caption and credit, and lists it after reopening', async () => {
    const local = makePort();
    const store = createPersonalRouteGalleryStore(local.port, {
      createId: () => 'photo-1',
      now: () => savedAt,
    });

    const saved = await store.save(validInput);

    expect(local.copies).toEqual([{
      sourceUri: validInput.sourceUri,
      fileName: 'photo-photo-1.webp',
    }]);
    expect(saved).toEqual({
      id: 'photo-1',
      routeSlug,
      uri: 'file:///app-private/photo-photo-1.webp',
      caption: 'Agua junto al puente',
      credit: 'IsiVoltPro',
      createdAt: savedAt.toISOString(),
    });

    const reopenedStore = createPersonalRouteGalleryStore(local.port);
    await expect(reopenedStore.listForRoute(routeSlug)).resolves.toEqual([saved]);
    await expect(reopenedStore.listForRoute('other-route')).resolves.toEqual([]);
  });

  it('rejects missing caption, missing credit and non-local URLs before copying anything', async () => {
    const local = makePort();
    const store = createPersonalRouteGalleryStore(local.port, { createId: () => 'photo-2' });

    await expect(store.save({ ...validInput, caption: '   ' })).rejects.toThrow('pie de foto');
    await expect(store.save({ ...validInput, credit: '' })).rejects.toThrow('crédito');
    await expect(store.save({ ...validInput, sourceUri: 'https://example.invalid/photo.jpg' }))
      .rejects.toThrow('archivo local');
    expect(local.copies).toEqual([]);
  });

  it('removes the copied private image if SQLite metadata insertion fails', async () => {
    const local = makePort();
    const insert = vi.fn(async (_photo: PersonalRoutePhoto) => {
      throw new Error('SQLite unavailable');
    });
    const port: PersonalRouteGalleryLocalPort = { ...local.port, insert };
    const store = createPersonalRouteGalleryStore(port, { createId: () => 'photo-3' });

    await expect(store.save(validInput)).rejects.toThrow('SQLite unavailable');
    expect(local.removed).toEqual(['file:///app-private/photo-photo-3.webp']);
  });

  it('uses the non-legacy system picker and does not request an online original', () => {
    expect(personalRoutePhotoPickerOptions).toMatchObject({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      legacy: false,
      shouldDownloadFromNetwork: false,
      exif: false,
      base64: false,
    });
  });
});

describe('personal route photo viewer', () => {
  const photos: PersonalRoutePhoto[] = [
    {
      id: 'photo-a',
      routeSlug,
      uri: 'file:///app-private/photo-a.jpg',
      caption: 'Atardecer en el sendero',
      credit: 'IsiVoltPro',
      createdAt: savedAt.toISOString(),
    },
    {
      id: 'photo-b',
      routeSlug,
      uri: 'file:///app-private/photo-b.jpg',
      caption: 'Puente de piedra',
      credit: 'A. Autora',
      createdAt: savedAt.toISOString(),
    },
  ];

  it('selects only the touched photo and resolves closed or stale selection safely', () => {
    expect(selectPersonalRoutePhoto(photos, 'photo-b')).toBe(photos[1]);
    expect(selectPersonalRoutePhoto(photos, null)).toBeNull();
    expect(selectPersonalRoutePhoto(photos, 'missing-photo')).toBeNull();
  });

  it('always supplies the saved caption, author, and device-only context for the enlarged view', () => {
    const selected = selectPersonalRoutePhoto(photos, 'photo-a');
    expect(selected).not.toBeNull();
    expect(getPersonalRoutePhotoViewerDetails(selected!)).toEqual({
      caption: 'Atardecer en el sendero',
      creditLabel: 'Crédito · IsiVoltPro',
      localLabel: 'PERSONAL · LOCAL',
      privacyNote: 'Guardada solo en este dispositivo; no se publica ni se sincroniza.',
    });
  });
});
