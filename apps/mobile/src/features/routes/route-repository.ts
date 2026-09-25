import { createCatalogReader, getCatalogSnapshot } from '@magina-aventura/domain';

export const routeCatalogReader = createCatalogReader(getCatalogSnapshot());