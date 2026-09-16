import type {
  RouteCommunitySnapshot,
  RouteCommunitySummary,
} from './community-types';

export function summarizeRouteCommunity(
  snapshot: RouteCommunitySnapshot,
): RouteCommunitySummary {
  const reviewCount = snapshot.reviews.length;
  const averageRating =
    reviewCount === 0
      ? null
      : snapshot.reviews.reduce((total, review) => total + review.rating, 0) /
        reviewCount;

  return {
    photoCount: snapshot.photos.length,
    commentCount: snapshot.comments.length,
    reviewCount,
    averageRating,
    activeIncidentCount: snapshot.incidents.filter(
      (incident) => incident.status === 'confirmed',
    ).length,
  };
}
