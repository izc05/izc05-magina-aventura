export interface WeatherSnapshotV1 {
  schemaVersion: 'weather-snapshot.v1';
  provider: string;
  routeId: string;
  observedAt: string | null;
  fetchedAt: string;
  validUntil: string | null;
  temperatureC: number | null;
  windKph: number | null;
  precipitationProbabilityPct: number | null;
  alerts: readonly { id: string; severity: string; title: string }[];
}
