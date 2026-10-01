import { Directory, File, Paths } from 'expo-file-system';
import * as SQLite from 'expo-sqlite';

import {
  createPersonalRouteGalleryStore,
  type PersonalRouteGalleryLocalPort,
  type PersonalRoutePhoto,
} from './personal-route-gallery';

const DATABASE_NAME = 'magina-aventura-personal-gallery.db';
const photoDirectory = new Directory(Paths.document, 'magina-aventura', 'personal-route-gallery');

interface PhotoRow {
  id: string;
  route_slug: string;
  uri: string;
  caption: string;
  credit: string;
  created_at: string;
  deletion_status: 'active' | 'pending_delete';
}

interface TableInfoRow {
  name: string;
}

let databasePromise: Promise<SQLite.SQLiteDatabase> | null = null;

function database(): Promise<SQLite.SQLiteDatabase> {
  if (databasePromise) return databasePromise;

  const opening = SQLite.openDatabaseAsync(DATABASE_NAME).then(async (db) => {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;
      CREATE TABLE IF NOT EXISTS personal_route_gallery_photos (
        id TEXT PRIMARY KEY NOT NULL,
        route_slug TEXT NOT NULL,
        uri TEXT NOT NULL,
        caption TEXT NOT NULL,
        credit TEXT NOT NULL,
        created_at TEXT NOT NULL,
        deletion_status TEXT NOT NULL DEFAULT 'active'
          CHECK (deletion_status IN ('active', 'pending_delete'))
      );
      CREATE INDEX IF NOT EXISTS personal_route_gallery_route_created
      ON personal_route_gallery_photos (route_slug, created_at DESC);
    `);

    const columns = await db.getAllAsync<TableInfoRow>(
      'PRAGMA table_info(personal_route_gallery_photos)',
    );
    if (!columns.some((column) => column.name === 'deletion_status')) {
      await db.execAsync(`
        ALTER TABLE personal_route_gallery_photos
          ADD COLUMN deletion_status TEXT NOT NULL DEFAULT 'active'
            CHECK (deletion_status IN ('active', 'pending_delete'));
      `);
    }
    return db;
  });

  databasePromise = opening.catch((error: unknown) => {
    databasePromise = null;
    throw error;
  });
  return databasePromise;
}

function ensurePhotoDirectory(): void {
  if (!photoDirectory.exists) {
    photoDirectory.create({ intermediates: true, idempotent: true });
  }
}

function mapPhotoRow(row: PhotoRow): PersonalRoutePhoto {
  return {
    id: row.id,
    routeSlug: row.route_slug,
    uri: row.uri,
    caption: row.caption,
    credit: row.credit,
    createdAt: row.created_at,
  };
}

function isManagedPhotoUri(uri: string): boolean {
  const directoryUri = photoDirectory.uri.endsWith('/')
    ? photoDirectory.uri
    : `${photoDirectory.uri}/`;
  const fileName = uri.startsWith(directoryUri) ? uri.slice(directoryUri.length) : '';
  return /^photo-[A-Za-z0-9_-]+\.(?:jpg|png|webp|heic|heif|avif)$/.test(fileName);
}

const localPort: PersonalRouteGalleryLocalPort = {
  async list(routeSlug) {
    const db = await database();
    const rows = await db.getAllAsync<PhotoRow>(
      `SELECT id, route_slug, uri, caption, credit, created_at
       FROM personal_route_gallery_photos
       WHERE route_slug = ? AND deletion_status = 'active'
       ORDER BY created_at DESC, id DESC`,
      routeSlug,
    );

    return rows.map(mapPhotoRow);
  },

  async copyImageToPrivateStorage(sourceUri, fileName) {
    ensurePhotoDirectory();
    const source = new File(sourceUri);
    if (!source.exists) {
      throw new Error('No se pudo leer la foto seleccionada en este dispositivo.');
    }

    const destination = new File(photoDirectory, fileName);
    await source.copy(destination);
    return destination.uri;
  },

  async insert(photo) {
    const db = await database();
    await db.runAsync(
      `INSERT INTO personal_route_gallery_photos (
        id, route_slug, uri, caption, credit, created_at
      ) VALUES (?, ?, ?, ?, ?, ?)`,
      photo.id,
      photo.routeSlug,
      photo.uri,
      photo.caption,
      photo.credit,
      photo.createdAt,
    );
  },

  async markDeletePending(photoId) {
    const db = await database();
    await db.runAsync(
      `UPDATE personal_route_gallery_photos
       SET deletion_status = 'pending_delete'
       WHERE id = ? AND deletion_status IN ('active', 'pending_delete')`,
      photoId,
    );
    const row = await db.getFirstAsync<PhotoRow>(
      `SELECT id, route_slug, uri, caption, credit, created_at, deletion_status
       FROM personal_route_gallery_photos
       WHERE id = ? AND deletion_status = 'pending_delete'`,
      photoId,
    );
    return row ? mapPhotoRow(row) : null;
  },

  async listPendingDeletes() {
    const db = await database();
    const rows = await db.getAllAsync<PhotoRow>(
      `SELECT id, route_slug, uri, caption, credit, created_at, deletion_status
       FROM personal_route_gallery_photos
       WHERE deletion_status = 'pending_delete'
       ORDER BY created_at DESC, id DESC`,
    );
    return rows.map(mapPhotoRow);
  },

  async finalizePendingDelete(photoId) {
    const db = await database();
    await db.runAsync(
      `DELETE FROM personal_route_gallery_photos
       WHERE id = ? AND deletion_status = 'pending_delete'`,
      photoId,
    );
  },

  async removePrivateImage(uri) {
    if (!isManagedPhotoUri(uri)) {
      throw new Error('La referencia de la foto no pertenece al almacenamiento privado de la galería.');
    }
    const file = new File(uri);
    if (file.exists) file.delete();
  },
};

export const personalRouteGalleryStore = createPersonalRouteGalleryStore(localPort);
