import { useMemo } from 'react';
import { routeCatalogReader } from './route-repository';
import { adaptCatalogRoute } from './catalog-route-adapter';
import type { MobileRouteView } from './mobile-route-view';

export function useRouteCatalog() {
  const routes = useMemo(() => {
    return routeCatalogReader.list().map((item) => {
      const detail = routeCatalogReader.bySlug(item.adventure.slug);
      return detail ? adaptCatalogRoute(detail) : null;
    }).filter(Boolean) as MobileRouteView[];
  }, []);

  return { routes, isLoading: false, error: null };
}

export function useRouteBySlug(slug?: string) {
  const route = useMemo(() => {
    if (!slug) return null;
    const detail = routeCatalogReader.bySlug(slug);
    return detail ? adaptCatalogRoute(detail) : null;
  }, [slug]);

  return route;
}