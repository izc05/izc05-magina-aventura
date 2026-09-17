import type { WeatherSnapshotV1 } from '@magina-aventura/contracts';

export type WeatherAge = 'current' | 'stale' | 'missing' | 'unavailable';

export interface WeatherPresentation {
  age: WeatherAge;
  ageLabel: string;
  temperature: string | null;
  wind: string | null;
  precipitation: string | null;
  alertCount: number;
  alertSummary: string | null;
  blocksAdventure: false; // Weather never blocks adventure/GPS
}

const STALE_THRESHOLD_MS = 3 * 60 * 60 * 1000; // 3 hours

function computeAge(snapshot: WeatherSnapshotV1, nowMs: number): WeatherAge {
  if (!snapshot.validUntil) {
    const fetchedMs = new Date(snapshot.fetchedAt).getTime();
    return nowMs - fetchedMs > STALE_THRESHOLD_MS ? 'stale' : 'current';
  }
  return new Date(snapshot.validUntil).getTime() > nowMs ? 'current' : 'stale';
}

function ageLabel(age: WeatherAge, snapshot: WeatherSnapshotV1 | null): string {
  if (!snapshot || age === 'missing') return 'Sin datos meteorológicos';
  if (age === 'unavailable') return 'Datos no disponibles';
  if (age === 'stale') {
    const fetched = snapshot.fetchedAt
      ? new Date(snapshot.fetchedAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
      : 'desconocida';
    return `Datos desactualizados (última actualización: ${fetched})`;
  }
  return 'Actualizado';
}

export function presentWeather(
  snapshot: WeatherSnapshotV1 | null,
  nowMs: number = Date.now(),
): WeatherPresentation {
  if (!snapshot) {
    return {
      age: 'missing',
      ageLabel: 'Sin datos meteorológicos',
      temperature: null,
      wind: null,
      precipitation: null,
      alertCount: 0,
      alertSummary: null,
      blocksAdventure: false,
    };
  }

  const age = computeAge(snapshot, nowMs);

  return {
    age,
    ageLabel: ageLabel(age, snapshot),
    temperature: snapshot.temperatureC != null ? `${snapshot.temperatureC.toFixed(1)} °C` : null,
    wind: snapshot.windKph != null ? `${Math.round(snapshot.windKph)} km/h` : null,
    precipitation:
      snapshot.precipitationProbabilityPct != null
        ? `${Math.round(snapshot.precipitationProbabilityPct)}% lluvia`
        : null,
    alertCount: snapshot.alerts.length,
    alertSummary:
      snapshot.alerts.length > 0 ? snapshot.alerts.map((a) => a.title).join(', ') : null,
    blocksAdventure: false,
  };
}
