import { describe, expect, it, vi } from 'vitest';

import {
  createPersonalRouteGalleryStore,
  getPersonalRoutePhotoViewerDetails,
  PERSONAL_PHOTO_DELETE_CONFIRMATION,
  selectPersonalRoutePhoto,
  type PersonalRouteGalleryLocalPort,
  type PersonalRoutePhoto,
} from './personal-route-gallery';
import { personalRoutePhotoPickerOptions } from './personal-route-photo-picker-options';

const routeSlug = 'sendero-fluvial-cueva-del-agua';
const savedAt = new Date('2026-10-01T10:00:00.000Z');

function makePort() {
  const rows: PersonalRoutePhoto[] = [];
  const pending = new Map<string, PersonalRoutePhoto>();
  const files = new Set<string>();
  const copies: Array<{ sourceUri: string; fileName: string }> = [];
  const removed: string[] = [];
  const events: string[] = [];
  let failMarkCount = 0;
  let failRemoveCount = 0;
  let failFinalizeCount = 0;

  const port: PersonalRouteGalleryLocalPort = {
    async list(slug) {
      return rows.filter((photo) => photo.routeSlug === slug && !pending.has(photo.id));
    },
    async copyImageToPrivateStorage(sourceUri, fileName) {
      copies.push({ sourceUri, fileName });
      const uri = `file:///app-private/${fileName}`;
      files.add(uri);
      return uri;
    },
    async insert(photo) {
      rows.push(photo);
    },
    async markDeletePending(photoId) {
      events.push('mark-pending');
      if (failMarkCount > 0) {
        failMarkCount -= 1;
        throw new Error('SQLite mark unavailable');
      }
      const photo = rows.find((item) => item.id === photoId);
      if (!photo) return null;
      pending.set(photoId, photo);
      return photo;
    },
    async listPendingDeletes() {
      return [...pending.values()];
    },
    async finalizePendingDelete(photoId) {
      events.push('finalize-metadata');
      if (failFinalizeCount > 0) {
        failFinalizeCount -= 1;
        throw new Error('SQLite finalize unavailable');
      }
      if (!pending.has(photoId)) return;
      const index = rows.findIndex((photo) => photo.id === photoId);
      if (index >= 0) rows.splice(index, 1);
      pending.delete(photoId);
    },
    async removePrivateImage(uri) {
      events.push('remove-file');
      if (failRemoveCount > 0) {
        failRemoveCount -= 1;
        throw new Error('Private filesystem unavailable');
      }
      if (files.delete(uri)) removed.push(uri);
    },
  };

  return {
    port,
    rows,
    pending,
    files,
    copies,
    removed,
    events,
    failNextMark() { failMarkCount += 1; },
    failNextRemove() { failRemoveCount += 1; },
    failNextFinalize() { failFinalizeCount += 1; },
  };
}

const validInput = {
  routeSlug,
  sourceUri: 'file:///picker-cache/selected-photo.webp',
  mimeType: 'image/webp',
  caption: '  Agua junto al puente  ',
  credit: '  IsiVoltPro  ',
};

async function saveOne(local: ReturnType<typeof makePort>, id = 'photo-1') {
  return createPersonalRouteGalleryStore(local.port, {
    createId: () => id,
    now: () => savedAt,
  }).save(validInput);
}

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

  it('marks the row hidden before deleting the file, then purges metadata idempotently', async () => {
    const local = makePort();
    const saved = await saveOne(local);
    const store = createPersonalRouteGalleryStore(local.port);

    await expect(store.markDeletePending(saved.id)).resolves.toEqual(saved);
    expect(await local.port.list(routeSlug)).toEqual([]);
    expect(local.files.has(saved.uri)).toBe(true);

    await expect(store.finishDelete(saved.id)).resolves.toBe('deleted');
    expect(local.events).toEqual(['mark-pending', 'remove-file', 'finalize-metadata']);
    expect(local.files.has(saved.uri)).toBe(false);
    expect(local.rows).toEqual([]);
    await expect(store.finishDelete(saved.id)).resolves.toBe('deleted');
    expect(local.removed).toEqual([saved.uri]);
  });

  it('keeps a failed file deletion tombstoned and completes it on a later gallery-open retry', async () => {
    const local = makePort();
    const saved = await saveOne(local);
    const store = createPersonalRouteGalleryStore(local.port);
    await store.markDeletePending(saved.id);
    local.failNextRemove();

    await expect(store.finishDelete(saved.id)).resolves.toBe('pending');
    expect(local.pending.has(saved.id)).toBe(true);
    expect(local.files.has(saved.uri)).toBe(true);
    expect(await local.port.list(routeSlug)).toEqual([]);

    await expect(store.listForRoute(routeSlug)).resolves.toEqual([]);
    expect(local.rows).toEqual([]);
    expect(local.files.has(saved.uri)).toBe(false);
    await expect(store.listForRoute(routeSlug)).resolves.toEqual([]);
    expect(local.removed).toEqual([saved.uri]);
  });

  it('recovers a crash after file removal but before SQLite finalization', async () => {
    const local = makePort();
    const saved = await saveOne(local);
    const store = createPersonalRouteGalleryStore(local.port);
    await store.markDeletePending(saved.id);
    local.failNextFinalize();

    await expect(store.finishDelete(saved.id)).resolves.toBe('pending');
    expect(local.files.has(saved.uri)).toBe(false);
    expect(local.pending.has(saved.id)).toBe(true);
    expect(await local.port.list(routeSlug)).toEqual([]);

    const reopenedStore = createPersonalRouteGalleryStore(local.port);
    await expect(reopenedStore.listForRoute(routeSlug)).resolves.toEqual([]);
    expect(local.rows).toEqual([]);
    expect(local.pending.size).toBe(0);
    expect(local.removed).toEqual([saved.uri]);
  });

  it('does not hide or remove the photo if SQLite could not persist the tombstone', async () => {
    const local = makePort();
    const saved = await saveOne(local);
    const store = createPersonalRouteGalleryStore(local.port);
    local.failNextMark();

    await expect(store.markDeletePending(saved.id)).rejects.toThrow('SQLite mark unavailable');
    await expect(store.listForRoute(routeSlug)).resolves.toEqual([saved]);
    expect(local.files.has(saved.uri)).toBe(true);
    expect(local.pending.size).toBe(0);
    expect(local.removed).toEqual([]);
  });

  it('uses a system-only picker and an explicit local deletion confirmation', () => {
    expect(personalRoutePhotoPickerOptions).toMatchObject({
      mediaTypes: ['images'],
      allowsMultipleSelection: false,
      legacy: false,
      shouldDownloadFromNetwork: false,
      exif: false,
      base64: false,
    });
    expect(PERSONAL_PHOTO_DELETE_CONFIRMATION).toEqual({
      title: '¿Eliminar esta foto personal?',
      message: 'Se eliminará solo la copia local de esta foto. No se modificará la ficha de ruta ni ninguna otra foto.',
      cancelLabel: 'Conservar foto',
      confirmLabel: 'Eliminar foto',
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
