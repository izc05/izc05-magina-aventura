import { describe, expect, it } from 'vitest';

import type { RouteCommunitySnapshot } from './community-types';
import { summarizeRouteCommunity } from './community-summary';

const emptySnapshot: RouteCommunitySnapshot = {
  photos: [],
  comments: [],
  reviews: [],
  incidents: [],
};

describe('summarizeRouteCommunity', () => {
  it('keeps an empty community honestly empty', () => {
    expect(summarizeRouteCommunity(emptySnapshot)).toEqual({
      photoCount: 0,
      commentCount: 0,
      reviewCount: 0,
      averageRating: null,
      activeIncidentCount: 0,
    });
  });

  it('derives counts and average rating only from real rows', () => {
    const snapshot: RouteCommunitySnapshot = {
      photos: [
        {
          id: 'photo-1',
          routeId: 'route-1',
          userId: 'user-1',
          discoveryId: null,
          objectProvider: 'r2',
          objectKey: 'community/route-1/photo-1.jpg',
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
          userId: 'user-1',
          rating: 5,
          body: 'Muy buena ruta.',
          createdAt: '2026-09-16T01:20:00Z',
        },
        {
          id: 'review-2',
          routeId: 'route-1',
          userId: 'user-3',
          rating: 3,
          body: null,
          createdAt: '2026-09-16T01:30:00Z',
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
          createdAt: '2026-09-16T01:40:00Z',
          resolvedAt: null,
        },
        {
          id: 'incident-2',
          routeId: 'route-1',
          userId: 'user-5',
          category: 'mud',
          description: 'Barro en la subida.',
          status: 'resolved',
          createdAt: '2026-09-16T01:50:00Z',
          resolvedAt: '2026-09-16T02:00:00Z',
        },
      ],
    };

    expect(summarizeRouteCommunity(snapshot)).toEqual({
      photoCount: 1,
      commentCount: 1,
      reviewCount: 2,
      averageRating: 4,
      activeIncidentCount: 1,
    });
  });
});
