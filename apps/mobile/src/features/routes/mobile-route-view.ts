export type MobileOperationalStatus = 'OPEN' | 'CAUTION' | 'RESTRICTED' | 'CLOSED' | 'UNKNOWN';

export interface MobileRouteView {
  id: string;
  slug: string;
  title: string;
  municipalityNames: string[];
  distanceKm: number | null;
  elevationGainM: number | null;
  durationMinutes: number | null;
  difficulty: number | null;
  operationalStatus: MobileOperationalStatus;
  safetyHeadline: string | null;
  discoveriesCount: number;
  rewardsAvailable: boolean;
  developmentFixture?: boolean;
}