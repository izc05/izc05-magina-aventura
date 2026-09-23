import Constants from 'expo-constants';
import { evaluateOfflinePackage } from '@magina-aventura/offline-sync';

import { expoLocationProvider } from '../../activity/expo-location-provider';
import { sqliteActivityStore } from '../../activity/sqlite-activity-store';
import { expoRoutePackagePort } from '../../offline/expo-route-package-port';
import { getRuntimeRouteMapRepository } from '../routes/runtime-route-map-repository';
import { getRuntimeRoutes } from '../qa/qa-harness';

type DiagnosticStatus = 'ok' | 'warning' | 'error';

export type DiagnosticItem = Readonly<{
  id: string;
  label: string;
  status: DiagnosticStatus;
  detail: string;
}>;

export type DiagnosticsReport = Readonly<{
  appVersion: string;
  buildVersionCode: string;
  checkedAt: string;
  items: DiagnosticItem[];
}>;

export type DiagnosticsDependencies = Readonly<{
  getAppVersion: () => string;
  getBuildVersionCode: () => string;
  checkDatabase: () => Promise<string>;
  checkOffline: () => Promise<string>;
  checkConnectivity: () => Promise<string>;
  getLocationState: () => Promise<{
    foregroundGranted: boolean;
    servicesEnabled: boolean;
  }>;
  checkRoutes: () => Promise<string>;
  checkActiveAdventure: () => Promise<string>;
}>;

const safeDetail = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message.trim()) return error.message;
  return fallback;
};

async function safely<T>(
  task: () => Promise<T>,
  fallback: string,
): Promise<{ value: T; failed: false } | { value: string; failed: true }> {
  try {
    return { value: await task(), failed: false };
  } catch (error) {
    return { value: safeDetail(error, fallback), failed: true };
  }
}

function resultFromDetail(
  id: string,
  label: string,
  detail: string,
  status: DiagnosticStatus,
): DiagnosticItem {
  return { id, label, status, detail };
}

function statusForSuccessfulCheck(id: string, detail: string): DiagnosticStatus {
  if (id === 'offline' && (detail.startsWith('Sin rutas') || detail.startsWith('No hay paquetes'))) return 'warning';
  if (id === 'routes' && detail.startsWith('No hay rutas')) return 'warning';
  if (id === 'connectivity' && detail.startsWith('Respuesta de red')) return 'warning';
  return 'ok';
}

export function createDefaultDiagnosticsDependencies(): DiagnosticsDependencies {
  return {
    getAppVersion: () => Constants.expoConfig?.version ?? 'desconocida',
    getBuildVersionCode: () => {
      const value = Constants.expoConfig?.android?.versionCode;
      return value === undefined ? 'no disponible' : String(value);
    },
    checkDatabase: async () => {
      await sqliteActivityStore.initialize();
      return 'SQLite local operativa';
    },
    checkOffline: async () => {
      const routes = getRuntimeRoutes();
      if (routes.length === 0) return 'Sin rutas locales configuradas en esta compilación';
      const repository = getRuntimeRouteMapRepository();
      let ready = 0;
      for (const route of routes) {
        const manifest = await repository.getOfflineManifest(route.slug);
        if (!manifest) continue;
        const installed = await expoRoutePackagePort.readMetadata(manifest.routeId);
        if (evaluateOfflinePackage(installed, manifest) === 'ready') ready += 1;
      }
      return ready > 0
        ? `${ready} paquete${ready === 1 ? '' : 's'} de ruta disponible${ready === 1 ? '' : 's'} sin conexión`
        : 'No hay paquetes de rutas descargados';
    },
    checkConnectivity: async () => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);
      try {
        const response = await fetch('https://clients3.google.com/generate_204', {
          method: 'HEAD',
          signal: controller.signal,
        });
        return response.ok ? 'Conexión a Internet disponible' : `Respuesta de red: ${response.status}`;
      } finally {
        clearTimeout(timeout);
      }
    },
    getLocationState: async () => {
      const state = await expoLocationProvider.getPermissionState();
      return {
        foregroundGranted: state.foregroundGranted,
        servicesEnabled: state.servicesEnabled,
      };
    },
    checkRoutes: async () => {
      const routes = getRuntimeRoutes();
      if (routes.length === 0) return 'No hay rutas locales verificadas';
      const repository = getRuntimeRouteMapRepository();
      const available = (await Promise.all(
        routes.map(async (route) => {
          const payload = await repository.getMapPayload(route.slug);
          const definition = await repository.getAdventureDefinition(route.slug);
          return payload !== null && definition !== null;
        }),
      )).filter(Boolean).length;
      return `${available}/${routes.length} ruta${routes.length === 1 ? '' : 's'} con datos locales verificables`;
    },
    checkActiveAdventure: async () => {
      const active = await sqliteActivityStore.loadActiveSession();
      return active
        ? `Aventura activa recuperable: ${active.session.routeSlug}`
        : 'No hay una aventura activa recuperable';
    },
  };
}

export async function runDiagnostics(
  dependencies: DiagnosticsDependencies = createDefaultDiagnosticsDependencies(),
): Promise<DiagnosticsReport> {
  const items: DiagnosticItem[] = [];
  const database = await safely(dependencies.checkDatabase, 'No se pudo abrir la base de datos local');
  items.push(resultFromDetail('database', 'Base de datos local', database.value, database.failed ? 'error' : 'ok'));

  const location = await safely(dependencies.getLocationState, 'No se pudo consultar ubicación');
  if (location.failed) {
    items.push(resultFromDetail('location-permission', 'Permiso de ubicación', location.value, 'error'));
    items.push(resultFromDetail('gps', 'GPS / localización', 'No se pudo consultar el estado del GPS', 'error'));
  } else {
    items.push(resultFromDetail(
      'location-permission',
      'Permiso de ubicación',
      location.value.foregroundGranted ? 'Permiso concedido' : 'Permiso pendiente o denegado',
      location.value.foregroundGranted ? 'ok' : 'warning',
    ));
    items.push(resultFromDetail(
      'gps',
      'GPS / localización',
      location.value.servicesEnabled ? 'Servicios de localización activados' : 'Activa la localización del dispositivo',
      location.value.servicesEnabled ? 'ok' : 'warning',
    ));
  }

  const checks: Array<[string, string, () => Promise<string>]> = [
    ['offline', 'Estado offline / local', dependencies.checkOffline],
    ['connectivity', 'Conectividad', dependencies.checkConnectivity],
    ['routes', 'Datos y rutas locales', dependencies.checkRoutes],
    ['active-adventure', 'Aventura activa recuperable', dependencies.checkActiveAdventure],
  ];
  for (const [id, label, check] of checks) {
    const result = await safely(check, `No se pudo comprobar: ${label.toLowerCase()}`);
    items.push(resultFromDetail(id, label, result.value, result.failed ? 'error' : statusForSuccessfulCheck(id, result.value)));
  }

  return {
    appVersion: dependencies.getAppVersion(),
    buildVersionCode: dependencies.getBuildVersionCode(),
    checkedAt: new Date().toISOString(),
    items,
  };
}

export function formatDiagnostics(report: DiagnosticsReport): string {
  return [
    'Mágina Aventura · diagnóstico técnico',
    `Versión: ${report.appVersion}`,
    `Build/version code: ${report.buildVersionCode}`,
    ...report.items.map((item) => `${item.label}: ${item.detail}`),
    `Comprobado: ${report.checkedAt}`,
  ].join('\n');
}

export async function requestLocationPermission(): Promise<boolean> {
  try {
    const state = await expoLocationProvider.requestAdventurePermissions();
    return state.foregroundGranted;
  } catch {
    return false;
  }
}
