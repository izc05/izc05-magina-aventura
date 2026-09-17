import type { LocationSample } from '@magina-aventura/contracts';

export interface EmergencyCoordinates {
  latitudeDMS: string;
  longitudeDMS: string;
  decimalDisplay: string;
  accuracyM: number;
  altitudeM: number | null;
  timestamp: string;
}

export type EmergencyPositionState = 'available' | 'unavailable';

export interface EmergencyPresentation {
  positionState: EmergencyPositionState;
  coordinates: EmergencyCoordinates | null;
  /** Activity ID or route slug for emergency reference */
  activityReference: string | null;
  /** Never fabricated — only set when positionState === 'available' */
  copyableCoordinates: string | null;
}

function toDMS(decimal: number, positiveLabel: string, negativeLabel: string): string {
  const abs = Math.abs(decimal);
  const degrees = Math.floor(abs);
  const minutesTotal = (abs - degrees) * 60;
  const minutes = Math.floor(minutesTotal);
  const seconds = ((minutesTotal - minutes) * 60).toFixed(1);
  const direction = decimal >= 0 ? positiveLabel : negativeLabel;
  return `${degrees}° ${minutes}' ${seconds}" ${direction}`;
}

export function presentEmergency(
  lastSample: LocationSample | null,
  activityReference: string | null,
): EmergencyPresentation {
  if (!lastSample) {
    return {
      positionState: 'unavailable',
      coordinates: null,
      activityReference,
      copyableCoordinates: null,
    };
  }

  const lat = lastSample.latitude;
  const lon = lastSample.longitude;
  const copyable = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;

  return {
    positionState: 'available',
    coordinates: {
      latitudeDMS: toDMS(lat, 'N', 'S'),
      longitudeDMS: toDMS(lon, 'E', 'O'),
      decimalDisplay: copyable,
      accuracyM: Math.round(lastSample.accuracyMeters),
      altitudeM: lastSample.altitudeMeters,
      timestamp: lastSample.timestamp,
    },
    activityReference,
    copyableCoordinates: copyable,
  };
}
