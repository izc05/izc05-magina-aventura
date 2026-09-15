export type RouteDifficulty = 'easy' | 'moderate' | 'hard';

export interface AdventureRouteCard {
  id: string;
  slug: string;
  title: string;
  municipality: string;
  distanceKm: number;
  elevationGainM: number;
  durationMinutes: number;
  difficulty: RouteDifficulty;
  discoveries: number;
  rewardXp: number;
  rewardOlives: number;
  developmentFixture: true;
}
