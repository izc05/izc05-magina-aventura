export interface CommunityPhoto {
  id: string;
  routeId: string;
  userId: string;
  discoveryId: string | null;
  objectProvider: 'r2';
  objectKey: string;
  caption: string | null;
  takenAt: string | null;
  featured: boolean;
  createdAt: string;
}

export interface RouteCommunityComment {
  id: string;
  routeId: string;
  userId: string;
  body: string;
  createdAt: string;
}

export interface RouteCommunityReview {
  id: string;
  routeId: string;
  userId: string;
  rating: number;
  body: string | null;
  createdAt: string;
}

export type RouteCommunityIncidentStatus = 'confirmed' | 'resolved';

export interface RouteCommunityIncident {
  id: string;
  routeId: string;
  userId: string;
  category: string;
  description: string;
  status: RouteCommunityIncidentStatus;
  createdAt: string;
  resolvedAt: string | null;
}

export interface RouteCommunitySnapshot {
  photos: CommunityPhoto[];
  comments: RouteCommunityComment[];
  reviews: RouteCommunityReview[];
  incidents: RouteCommunityIncident[];
}

export interface RouteCommunitySummary {
  photoCount: number;
  commentCount: number;
  reviewCount: number;
  averageRating: number | null;
  activeIncidentCount: number;
}
