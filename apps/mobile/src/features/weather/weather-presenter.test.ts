import { describe, expect, it } from 'vitest';
import type { WeatherSnapshotV1 } from '@magina-aventura/contracts';
import { presentWeather } from './weather-presenter';

const NOW = new Date('2026-09-17T12:00:00Z').getTime();

function makeSnapshot(overrides?: Partial<WeatherSnapshotV1>): WeatherSnapshotV1 {
  return {
    schemaVersion: 'weather-snapshot.v1',
    provider: 'aemet',
    routeId: '00000000-0000-0000-0000-000000000001',
    observedAt: '2026-09-17T11:00:00Z',
    fetchedAt: '2026-09-17T11:30:00Z',
    validUntil: '2026-09-17T14:00:00Z',
    temperatureC: 22.5,
    windKph: 15,
    precipitationProbabilityPct: 10,
    alerts: [],
    ...overrides,
  };
}

describe('weather-presenter', () => {
  it('presents current snapshot with formatted metrics', () => {
    const result = presentWeather(makeSnapshot(), NOW);

    expect(result.age).toBe('current');
    expect(result.temperature).toBe('22.5 °C');
    expect(result.wind).toBe('15 km/h');
    expect(result.precipitation).toBe('10% lluvia');
    expect(result.blocksAdventure).toBe(false);
    expect(result.alertCount).toBe(0);
    expect(result.alertSummary).toBeNull();
  });

  it('presents stale snapshot with explicit age label', () => {
    const staleSnapshot = makeSnapshot({
      validUntil: '2026-09-17T10:00:00Z', // before NOW
    });
    const result = presentWeather(staleSnapshot, NOW);

    expect(result.age).toBe('stale');
    expect(result.ageLabel).toContain('desactualizados');
    // Still shows data, but with stale warning - never blocks
    expect(result.blocksAdventure).toBe(false);
    expect(result.temperature).toBe('22.5 °C');
  });

  it('presents missing snapshot without fabricating data', () => {
    const result = presentWeather(null, NOW);

    expect(result.age).toBe('missing');
    expect(result.temperature).toBeNull();
    expect(result.wind).toBeNull();
    expect(result.precipitation).toBeNull();
    expect(result.blocksAdventure).toBe(false);
  });

  it('handles provider failure gracefully without blocking', () => {
    // Provider failure → null snapshot received
    const result = presentWeather(null, NOW);
    expect(result.age).toBe('missing');
    expect(result.blocksAdventure).toBe(false);
  });

  it('presents alerts count and summary', () => {
    const snap = makeSnapshot({
      alerts: [
        { id: 'a1', severity: 'warning', title: 'Tormenta prevista' },
        { id: 'a2', severity: 'watch', title: 'Viento fuerte' },
      ],
    });
    const result = presentWeather(snap, NOW);

    expect(result.alertCount).toBe(2);
    expect(result.alertSummary).toContain('Tormenta prevista');
    expect(result.blocksAdventure).toBe(false);
  });

  it('handles null metrics gracefully', () => {
    const snap = makeSnapshot({ temperatureC: null, windKph: null, precipitationProbabilityPct: null });
    const result = presentWeather(snap, NOW);

    expect(result.temperature).toBeNull();
    expect(result.wind).toBeNull();
    expect(result.precipitation).toBeNull();
  });
});
