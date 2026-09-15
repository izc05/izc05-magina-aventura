export type RouteDifficulty = 'easy' | 'moderate' | 'hard';

export interface RewardPreview {
  xp: number;
  olives: number;
  discoveries: number;
}

export interface RouteSummary {
  id: string;
  slug: string;
  title: string;
  municipalityId: string;
  municipalityName: string;
  distanceKm: number;
  elevationGainM: number;
  durationMinutes: number;
  difficulty: RouteDifficulty;
  rewardPreview: RewardPreview;
  contentVersion: number;
}

export interface RouteDetail extends RouteSummary {
  description: string;
  safetyNotes: string[];
  startLatitude: number;
  startLongitude: number;
  geometryVersion: number;
  offlineAvailable: boolean;
  developmentFixture: boolean;
}
