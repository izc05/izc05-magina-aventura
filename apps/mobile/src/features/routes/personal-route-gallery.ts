export const PERSONAL_PHOTO_CAPTION_MAX_LENGTH = 160;
export const PERSONAL_PHOTO_CREDIT_MAX_LENGTH = 100;

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
  routeSlug: string;
  sourceUri: string;
  mimeType: string | null;
  caption: string;
  credit: string;
}

/**
 * All persistence stays behind a local-only port: selected images are copied
 * into app-private storage and metadata is stored in the on-device SQLite DB.
 */
export interface PersonalRouteGalleryLocalPort {
  list(routeSlug: string): Promise<PersonalRoutePhoto[]>;
  copyImageToPrivateStorage(sourceUri: string, fileName: string): Promise<string>;
  insert(photo: PersonalRoutePhoto): Promise<void>;
  removePrivateImage(uri: string): Promise<void>;
}

export interface PersonalRouteGalleryStoreOptions {
  createId?: () => string;
  now?: () => Date;
}

export interface PersonalRouteGalleryStore {
  listForRoute(routeSlug: string): Promise<PersonalRoutePhoto[]>;
  save(input: SavePersonalRoutePhotoInput): Promise<PersonalRoutePhoto>;
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

function validatePhotoInput(input: SavePersonalRoutePhotoInput): {
  routeSlug: string;
  caption: string;
  credit: string;
} {
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

  return { routeSlug, caption, credit };
}

export function createPersonalRouteGalleryStore(
  port: PersonalRouteGalleryLocalPort,
  options: PersonalRouteGalleryStoreOptions = {},
): PersonalRouteGalleryStore {
  const createId = options.createId ?? createPhotoId;
  const now = options.now ?? (() => new Date());

  return {
    async listForRoute(routeSlug) {
      if (!routeSlug.trim()) return [];
      const photos = await port.list(routeSlug.trim());
      return [...photos].sort((left, right) =>
        right.createdAt.localeCompare(left.createdAt) || right.id.localeCompare(left.id),
      );
    },

    async save(input) {
      const { routeSlug, caption, credit } = validatePhotoInput(input);
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
        await port.insert(photo);
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
  };
}
