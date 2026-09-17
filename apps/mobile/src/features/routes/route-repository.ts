import { createCatalogReader } from '@magina-aventura/domain';
import type { CatalogSnapshot } from '@magina-aventura/contracts';

// The canonical catalog bundle is assumed to be embedded or fetched.
// For RC1, we use the local sierra-magina-official-v1.json as the bundle.
import catalogData from '../../../../../data/catalog/sierra-magina-official-v1.json';

const snapshot = catalogData as unknown as CatalogSnapshot;
export const routeCatalogReader = createCatalogReader(snapshot);