export const PERSONAL_PHOTO_CAPTION_MAX_LENGTH = 160;
export const PERSONAL_PHOTO_CREDIT_MAX_LENGTH = 100;

export const PERSONAL_PHOTO_DELETE_CONFIRMATION = {
  title: '¿Eliminar esta foto personal?',
  message: 'Se eliminará solo la copia local de esta foto. No se modificará la ficha de ruta ni ninguna otra foto.',
  cancelLabel: 'Conservar foto',
  confirmLabel: 'Eliminar foto',
} as const;

export type DeletePersonalRoutePhotoResult = 'deleted' | 'pending';

export interface PersonalRoutePhoto {
  id: string;
  routeSlug: string;
  uri: string;
  caption: string;
  credit: string;
  createdAt: string;
}

export interface PersonalRoutePhotoViewerDetails {
  caption: string;
  creditLabel: string;
  localLabel: string;
  privacyNote: string;
}

export function selectPersonalRoutePhoto(
  photos: readonly PersonalRoutePhoto[],
  selectedPhotoId: string | null,
): PersonalRoutePhoto | null {
  if (selectedPhotoId === null) return null;
  return photos.find((photo) => photo.id === selectedPhotoId) ?? null;
}

export function getPersonalRoutePhotoViewerDetails(
  photo: PersonalRoutePhoto,
): PersonalRoutePhotoViewerDetails {
  return {
    caption: photo.caption,
    creditLabel: `Crédito · ${photo.credit}`,
    localLabel: 'PERSONAL · LOCAL',
    privacyNote: 'Guardada solo en este dispositivo; no se publica ni se sincroniza.',
  };
}

export interface SavePersonalRoutePhotoInput {
  ownerId: string;
  routeSlug: string;
  sourceUri: string;
  mimeType: string | null;
  caption: string;
  credit: string;
}

/**
 * All persistence stays behind a local-only port: selected images are copied
 * into app-private storage and metadata is stored on-device. Every metadata
 * operation is scoped to the authenticated owner; rows from older unowned
 * installs remain stored but are not exposed or assigned to an account.
 * Deletion first tombstones the scoped row, then removes the file, then purges
 * metadata. Tombstones can be retried safely after a crash.
 */
export interface PersonalRouteGalleryLocalPort {
  list(ownerId: string, routeSlug: string): Promise<PersonalRoutePhoto[]>;
  copyImageToPrivateStorage(sourceUri: string, fileName: string): Promise<string>;
  insert(photo: PersonalRoutePhoto, ownerId: string): Promise<void>;
  markDeletePending(photoId: string, ownerId: string): Promise<PersonalRoutePhoto | null>;
  listPendingDeletes(ownerId: string): Promise<PersonalRoutePhoto[]>;
  finalizePendingDelete(photoId: string, ownerId: string): Promise<void>;
  removePrivateImage(uri: string): Promise<void>;
}

export interface PersonalRouteGalleryStoreOptions {
  createId?: () => string;
  now?: () => Date;
}

export interface PersonalRouteGalleryStore {
  listForRoute(routeSlug: string, ownerId: string): Promise<PersonalRoutePhoto[]>;
  save(input: SavePersonalRoutePhotoInput): Promise<PersonalRoutePhoto>;
  markDeletePending(photoId: string, ownerId: string): Promise<PersonalRoutePhoto | null>;
  finishDelete(photoId: string, ownerId: string): Promise<DeletePersonalRoutePhotoResult>;
  recoverPendingDeletes(ownerId: string): Promise<void>;
}

function createPhotoId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function extensionForMimeType(mimeType: string | null): string {
  switch (mimeType?.split(';', 1)[0]?.trim().toLowerCase()) {
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/heic':
      return 'heic';
    case 'image/heif':
      return 'heif';
    case 'image/avif':
      return 'avif';
    case 'image/jpeg':
    default:
      return 'jpg';
  }
}

function validateOwnerId(ownerId: string): string {
  if (!ownerId.trim()) throw new Error('Inicia sesión para acceder a la galería personal.');
  return ownerId;
}

function validatePhotoInput(input: SavePersonalRoutePhotoInput): {
  ownerId: string;
  routeSlug: string;
  caption: string;
  credit: string;
} {
  const ownerId = validateOwnerId(input.ownerId);
  const routeSlug = input.routeSlug.trim();
  const caption = input.caption.trim();
  const credit = input.credit.trim();

  if (!routeSlug) throw new Error('No se reconoce la ficha de ruta.');
  if (!/^file:\/\//i.test(input.sourceUri)) {
    throw new Error('La selección no es un archivo local del dispositivo.');
  }
  if (!caption) throw new Error('Añade un pie de foto.');
  if (caption.length > PERSONAL_PHOTO_CAPTION_MAX_LENGTH) {
    throw new Error(`El pie de foto no puede superar ${PERSONAL_PHOTO_CAPTION_MAX_LENGTH} caracteres.`);
  }
  if (!credit) throw new Error('Añade el crédito o nombre de autor.');
  if (credit.length > PERSONAL_PHOTO_CREDIT_MAX_LENGTH) {
    throw new Error(`El crédito no puede superar ${PERSONAL_PHOTO_CREDIT_MAX_LENGTH} caracteres.`);
  }

  return { ownerId, routeSlug, caption, credit };
}

function validatePhotoId(photoId: string): void {
  if (!/^[A-Za-z0-9_-]+$/.test(photoId)) {
    throw new Error('No se reconoce el identificador local de la foto.');
  }
}

export function createPersonalRouteGalleryStore(
  port: PersonalRouteGalleryLocalPort,
  options: PersonalRouteGalleryStoreOptions = {},
): PersonalRouteGalleryStore {
  const createId = options.createId ?? createPhotoId;
  const now = options.now ?? (() => new Date());

  return {
    async listForRoute(routeSlug, ownerId) {
      const scopedOwnerId = validateOwnerId(ownerId);
      if (!routeSlug.trim()) return [];
      await this.recoverPendingDeletes(scopedOwnerId);
      const photos = await port.list(scopedOwnerId, routeSlug.trim());
      return [...photos].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
      );
    },

    async save(input) {
      const { ownerId, routeSlug, caption, credit } = validatePhotoInput(input);
      const id = createId();
      if (!/^[A-Za-z0-9_-]+$/.test(id)) {
        throw new Error('No se pudo crear un identificador local seguro para la foto.');
      }

      const fileName = `photo-${id}.${extensionForMimeType(input.mimeType)}`;
      const uri = await port.copyImageToPrivateStorage(input.sourceUri, fileName);
      const photo: PersonalRoutePhoto = {
        id,
        routeSlug,
        uri,
        caption,
        credit,
        createdAt: now().toISOString(),
      };

      try {
        await port.insert(photo, ownerId);
      } catch (error) {
        try {
          await port.removePrivateImage(uri);
        } catch {
          // Preserve the database error; an orphaned private file is not exposed.
        }
        throw error;
      }

      return photo;
    },

    async markDeletePending(photoId, ownerId) {
      validatePhotoId(photoId);
      return port.markDeletePending(photoId, validateOwnerId(ownerId));
    },

    async finishDelete(photoId, ownerId) {
      validatePhotoId(photoId);
      const scopedOwnerId = validateOwnerId(ownerId);
      try {
        const pendingPhoto = (await port.listPendingDeletes(scopedOwnerId))
          .find((photo) => photo.id === photoId);
        if (!pendingPhoto) return 'deleted';
        await port.removePrivateImage(pendingPhoto.uri);
        await port.finalizePendingDelete(photoId, scopedOwnerId);
        return 'deleted';
      } catch {
        // The scoped SQLite tombstone remains hidden; list recovery retries safely.
        return 'pending';
      }
    },

    async recoverPendingDeletes(ownerId) {
      const scopedOwnerId = validateOwnerId(ownerId);
      const pendingPhotos = await port.listPendingDeletes(scopedOwnerId);
      for (const photo of pendingPhotos) {
        await port.removePrivateImage(photo.uri);
        await port.finalizePendingDelete(photo.id, scopedOwnerId);
      }
    },
  };
}
