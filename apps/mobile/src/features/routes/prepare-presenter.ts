import type { OfflinePackageState } from '@magina-aventura/offline-sync';

import type { LocationPermissionState } from '../../activity/location-provider';

export type PrepareOfflineState = OfflinePackageState | 'unavailable' | 'error';
export type ReadinessTone = 'ready' | 'pending' | 'review';

export type ReadinessCheck = Readonly<{
  id: 'location' | 'background' | 'offline' | 'route-guide' | 'safety';
  label: string;
  state: string;
  tone: ReadinessTone;
}>;

export type PreparationPresentation = Readonly<{
  routePackage: string;
  routePackageTone: ReadinessTone;
  canStartGps: boolean;
  checks: readonly ReadinessCheck[];
}>;

const offlineCopy: Record<PrepareOfflineState, string> = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
  unavailable: 'No disponible',
  error: 'Error de lectura',
};

function locationCheck(permissionState?: LocationPermissionState): ReadinessCheck {
  if (!permissionState) {
    return { id: 'location', label: 'Ubicación', state: 'Pendiente', tone: 'pending' };
  }

  if (!permissionState.servicesEnabled) {
    return { id: 'location', label: 'Ubicación', state: 'Activa el GPS', tone: 'pending' };
  }

  if (!permissionState.foregroundGranted) {
    return { id: 'location', label: 'Ubicación', state: 'Dar permiso', tone: 'pending' };
  }

  return { id: 'location', label: 'Ubicación', state: 'Lista', tone: 'ready' };
}

function backgroundCheck(permissionState?: LocationPermissionState): ReadinessCheck {
  if (!permissionState) {
    return {
      id: 'background',
      label: 'GPS en segundo plano',
      state: 'Pendiente',
      tone: 'pending',
    };
  }

  if (!permissionState.foregroundGranted) {
    return {
      id: 'background',
      label: 'GPS en segundo plano',
      state: 'Primero ubicación',
      tone: 'pending',
    };
  }

  if (!permissionState.backgroundGranted) {
    return {
      id: 'background',
      label: 'GPS en segundo plano',
      state: 'Dar permiso',
      tone: 'pending',
    };
  }

  return {
    id: 'background',
    label: 'GPS en segundo plano',
    state: 'Listo',
    tone: 'ready',
  };
}

export function presentPreparation(
  offlineState: PrepareOfflineState,
  permissionState?: LocationPermissionState,
): PreparationPresentation {
  const offlineReady = offlineState === 'ready';
  const offlineStateCopy = offlineReady ? 'Listo' : offlineCopy[offlineState];
  const canStartGps = Boolean(
    permissionState?.servicesEnabled &&
      permissionState.foregroundGranted &&
      permissionState.backgroundGranted,
  );

  return {
    routePackage: offlineCopy[offlineState],
    routePackageTone: offlineReady ? 'ready' : 'pending',
    canStartGps,
    checks: [
      locationCheck(permissionState),
      backgroundCheck(permissionState),
      {
        id: 'offline',
        label: 'Ruta offline',
        state: offlineStateCopy,
        tone: offlineReady ? 'ready' : 'pending',
      },
      {
        id: 'route-guide',
        label: 'Guía de ruta',
        state: 'Sin trazado oficial',
        tone: 'review',
      },
      { id: 'safety', label: 'Seguridad', state: 'Revisar', tone: 'review' },
    ],
  };
}
