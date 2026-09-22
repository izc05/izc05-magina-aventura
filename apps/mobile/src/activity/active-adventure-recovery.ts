import type { ActivityEngineState } from '@magina-aventura/activity-engine';
import type { RouteDetail } from '@magina-aventura/contracts';

/**
 * A process-level controller can outlive a route screen. Never reuse its
 * in-memory state unless it belongs to the route currently being displayed.
 */
export function belongsToRoute(
  state: ActivityEngineState | null,
  route: RouteDetail,
): state is ActivityEngineState {
  return state?.session.routeId === route.id && state.session.routeSlug === route.slug;
}
