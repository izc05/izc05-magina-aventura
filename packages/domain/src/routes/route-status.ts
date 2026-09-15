export type RoutePublicationStatus = 'draft' | 'review' | 'published' | 'archived';

export function canRouteBeStarted(status: RoutePublicationStatus): boolean {
  return status === 'published';
}
