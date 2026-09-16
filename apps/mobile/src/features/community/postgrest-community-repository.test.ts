import { describe, expect, it, vi } from 'vitest';

import type { SupabasePublicConfig } from '../../backend/supabase-config';
import { createPostgrestCommunityRepository } from './postgrest-community-repository';

const config: SupabasePublicConfig = {
  url: 'https://project.supabase.co',
  publishableKey: 'sb_publishable_test',
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });
}

describe('createPostgrestCommunityRepository', () => {
  it('returns unavailable without making a network request when Supabase is not configured', async () => {
    const fetchFn = vi.fn();
    const repository = createPostgrestCommunityRepository(null, fetchFn);

    await expect(repository.getRouteCommunity('route-1')).resolves.toEqual({
      state: 'unavailable',
    });
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it('loads the four safe public community resources without requesting exact geometry', async () => {
    const requests: Array<{ url: string; init?: RequestInit }> = [];
    const fetchFn = vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input);
      requests.push({ url, init });

      if (url.includes('/community_photos_public?')) {
        return jsonResponse([
          {
            id: 'photo-1',
            route_id: 'route-1',
            user_id: 'user-1',
            discovery_id: null,
            object_provider: 'r2',
            object_key: 'community/route-1/photo.jpg',
            caption: 'Vista real',
            taken_at: null,
            featured: true,
            created_at: '2026-09-16T01:00:00Z',
          },
        ]);
      }

      if (url.includes('/route_comments?')) {
        return jsonResponse([
          {
            id: 'comment-1',
            route_id: 'route-1',
            user_id: 'user-2',
            body: 'Sendero limpio.',
            created_at: '2026-09-16T01:10:00Z',
          },
        ]);
      }

      if (url.includes('/route_reviews?')) {
        return jsonResponse([
          {
            id: 'review-1',
            route_id: 'route-1',
            user_id: 'user-3',
            rating: 5,
            body: 'Muy buena ruta.',
            created_at: '2026-09-16T01:20:00Z',
          },
        ]);
      }

      if (url.includes('/route_incidents_public?')) {
        return jsonResponse([
          {
            id: 'incident-1',
            route_id: 'route-1',
            user_id: 'user-4',
            category: 'fallen_tree',
            description: 'Árbol caído.',
            status: 'confirmed',
            created_at: '2026-09-16T01:30:00Z',
            resolved_at: null,
          },
        ]);
      }

      return jsonResponse({ message: 'unexpected request' }, 404);
    });

    const repository = createPostgrestCommunityRepository(config, fetchFn);
    const result = await repository.getRouteCommunity('route-1');

    expect(requests).toHaveLength(4);
    for (const request of requests) {
      expect(request.url).toContain('route_id=eq.route-1');
      expect(request.url).not.toMatch(/(?:select=[^&]*)(?:location|position)/);
      expect(request.init?.headers).toMatchObject({
        apikey: 'sb_publishable_test',
        Accept: 'application/json',
      });
    }

    expect(result).toEqual({
      state: 'ready',
      snapshot: {
        photos: [
          {
            id: 'photo-1',
            routeId: 'route-1',
            userId: 'user-1',
            discoveryId: null,
            objectProvider: 'r2',
            objectKey: 'community/route-1/photo.jpg',
            caption: 'Vista real',
            takenAt: null,
            featured: true,
            createdAt: '2026-09-16T01:00:00Z',
          },
        ],
        comments: [
          {
            id: 'comment-1',
            routeId: 'route-1',
            userId: 'user-2',
            body: 'Sendero limpio.',
            createdAt: '2026-09-16T01:10:00Z',
          },
        ],
        reviews: [
          {
            id: 'review-1',
            routeId: 'route-1',
            userId: 'user-3',
            rating: 5,
            body: 'Muy buena ruta.',
            createdAt: '2026-09-16T01:20:00Z',
          },
        ],
        incidents: [
          {
            id: 'incident-1',
            routeId: 'route-1',
            userId: 'user-4',
            category: 'fallen_tree',
            description: 'Árbol caído.',
            status: 'confirmed',
            createdAt: '2026-09-16T01:30:00Z',
            resolvedAt: null,
          },
        ],
      },
    });
  });

  it('surfaces an API failure instead of replacing it with fabricated content', async () => {
    const fetchFn = vi.fn(async () => jsonResponse({ message: 'denied' }, 401));
    const repository = createPostgrestCommunityRepository(config, fetchFn);

    await expect(repository.getRouteCommunity('route-1')).rejects.toThrow(
      'Unable to load route community (401)',
    );
  });
});
