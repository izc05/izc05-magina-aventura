import type { OfflinePackageState } from '@magina-aventura/offline-sync';

export type PrepareOfflineState = OfflinePackageState | 'unavailable' | 'error';
export type ReadinessTone = 'ready' | 'pending' | 'review';

export type ReadinessCheck = Readonly<{
  id: 'location' | 'background' | 'offline' | 'safety';
  label: string;
  state: string;
  tone: ReadinessTone;
}>;

export type PreparationPresentation = Readonly<{
  routePackage: string;
  routePackageTone: ReadinessTone;
  checks: readonly ReadinessCheck[];
}>;

const offlineCopy: Record<PrepareOfflineState, string> = {
  'not-downloaded': 'No descargado',
  ready: 'Listo sin conexión',
  stale: 'Actualización disponible',
  unavailable: 'No disponible',
  error: 'Error de lectura',
};

export function presentPreparation(offlineState: PrepareOfflineState): PreparationPresentation {
  const offlineReady = offlineState === 'ready';
  const offlineStateCopy = offlineReady ? 'Listo' : offlineCopy[offlineState];

  return {
    routePackage: offlineCopy[offlineState],
    routePackageTone: offlineReady ? 'ready' : 'pending',
    checks: [
      { id: 'location', label: 'Ubicación', state: 'Pendiente', tone: 'pending' },
      { id: 'background', label: 'GPS en segundo plano', state: 'Pendiente', tone: 'pending' },
      {
        id: 'offline',
        label: 'Ruta offline',
        state: offlineStateCopy,
        tone: offlineReady ? 'ready' : 'pending',
      },
      { id: 'safety', label: 'Seguridad', state: 'Revisar', tone: 'review' },
    ],
  };
}
