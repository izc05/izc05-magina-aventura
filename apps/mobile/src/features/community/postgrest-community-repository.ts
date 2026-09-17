import type { SupabasePublicConfig } from '../../backend/supabase-config';
import type {
  CommunityPhoto,
  RouteCommunityComment,
  RouteCommunityIncident,
  RouteCommunityReview,
  RouteCommunitySnapshot,
} from './community-types';
import type {
  CommunityRepository,
  RouteCommunityLoadResult,
} from './community-repository';

type FetchLike = (
  input: string | URL | Request,
  init?: RequestInit,
) => Promise<Response>;

type PhotoRow = {
  id: string;
  route_id: string;
  user_id: string;
  discovery_id: string | null;
  object_provider: 'r2';
  object_key: string;
  caption: string | null;
  taken_at: string | null;
  featured: boolean;
  created_at: string;
};

type CommentRow = {
  id: string;
  route_id: string;
  user_id: string;
  body: string;
  created_at: string;
};

type ReviewRow = {
  id: string;
  route_id: string;
  user_id: string;
  rating: number;
  body: string | null;
  created_at: string;
};

type IncidentRow = {
  id: string;
  route_id: string;
  user_id: string;
  category: string;
  description: string;
  status: 'confirmed' | 'resolved';
  created_at: string;
  resolved_at: string | null;
};

const PHOTO_SELECT = [
  'id',
  'route_id',
  'user_id',
  'discovery_id',
  'object_provider',
  'object_key',
  'caption',
  'taken_at',
  'featured',
  'created_at',
].join(',');

const COMMENT_SELECT = ['id', 'route_id', 'user_id', 'body', 'created_at'].join(
  ',',
);

const REVIEW_SELECT = [
  'id',
  'route_id',
  'user_id',
  'rating',
  'body',
  'created_at',
].join(',');

const INCIDENT_SELECT = [
  'id',
  'route_id',
  'user_id',
  'category',
  'description',
  'status',
  'created_at',
  'resolved_at',
].join(',');

function buildUrl(
  config: SupabasePublicConfig,
  resource: string,
  routeId: string,
  select: string,
  order: string,
): string {
  const url = new URL(`/rest/v1/${resource}`, config.url);
  url.searchParams.set('route_id', `eq.${routeId}`);
  url.searchParams.set('select', select);
  url.searchParams.set('order', order);
  return url.toString();
}

async function fetchRows<T>(
  fetchFn: FetchLike,
  config: SupabasePublicConfig,
  url: string,
): Promise<T[]> {
  const response = await fetchFn(url, {
    method: 'GET',
    headers: {
      apikey: config.publishableKey,
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load route community (${response.status})`);
  }

  return (await response.json()) as T[];
}

function mapPhoto(row: PhotoRow): CommunityPhoto {
  return {
    id: row.id,
    routeId: row.route_id,
    userId: row.user_id,
    discoveryId: row.discovery_id,
    objectProvider: row.object_provider,
    objectKey: row.object_key,
    caption: row.caption,
    takenAt: row.taken_at,
    featured: row.featured,
    createdAt: row.created_at,
  };
}

function mapComment(row: CommentRow): RouteCommunityComment {
  return {
    id: row.id,
    routeId: row.route_id,
    userId: row.user_id,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapReview(row: ReviewRow): RouteCommunityReview {
  return {
    id: row.id,
    routeId: row.route_id,
    userId: row.user_id,
    rating: row.rating,
    body: row.body,
    createdAt: row.created_at,
  };
}

function mapIncident(row: IncidentRow): RouteCommunityIncident {
  return {
    id: row.id,
    routeId: row.route_id,
    userId: row.user_id,
    category: row.category,
    description: row.description,
    status: row.status,
    createdAt: row.created_at,
    resolvedAt: row.resolved_at,
  };
}

export function createPostgrestCommunityRepository(
  config: SupabasePublicConfig | null,
  fetchFn: FetchLike = fetch,
): CommunityRepository {
  return {
    async getRouteCommunity(routeId: string): Promise<RouteCommunityLoadResult> {
      if (config === null) {
        return { state: 'unavailable' };
      }

      const [photos, comments, reviews, incidents] = await Promise.all([
        fetchRows<PhotoRow>(
          fetchFn,
          config,
          buildUrl(
            config,
            'community_photos_public',
            routeId,
            PHOTO_SELECT,
            'featured.desc,created_at.desc',
          ),
        ),
        fetchRows<CommentRow>(
          fetchFn,
          config,
          buildUrl(
            config,
            'route_comments',
            routeId,
            COMMENT_SELECT,
            'created_at.desc',
          ),
        ),
        fetchRows<ReviewRow>(
          fetchFn,
          config,
          buildUrl(
            config,
            'route_reviews',
            routeId,
            REVIEW_SELECT,
            'created_at.desc',
          ),
        ),
        fetchRows<IncidentRow>(
          fetchFn,
          config,
          buildUrl(
            config,
            'route_incidents_public',
            routeId,
            INCIDENT_SELECT,
            'created_at.desc',
          ),
        ),
      ]);

      const snapshot: RouteCommunitySnapshot = {
        photos: photos.map(mapPhoto),
        comments: comments.map(mapComment),
        reviews: reviews.map(mapReview),
        incidents: incidents.map(mapIncident),
      };

      return { state: 'ready', snapshot };
    },
  };
}
