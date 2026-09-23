import { describe, expect, it, vi } from 'vitest';

vi.mock('expo-constants', () => ({
  default: { expoConfig: { version: '0.1.0', android: { versionCode: 42 } } },
}));
vi.mock('../../activity/expo-location-provider', () => ({
  expoLocationProvider: { getPermissionState: vi.fn(), requestAdventurePermissions: vi.fn() },
}));
vi.mock('../../activity/sqlite-activity-store', () => ({
  sqliteActivityStore: { initialize: vi.fn(), loadActiveSession: vi.fn() },
}));
vi.mock('../../offline/expo-route-package-port', () => ({
  expoRoutePackagePort: { readMetadata: vi.fn() },
}));

import { formatDiagnostics, runDiagnostics, type DiagnosticsDependencies } from './diagnostics';

function dependencies(overrides: Partial<DiagnosticsDependencies> = {}): DiagnosticsDependencies {
  return {
    getAppVersion: () => '0.1.0',
    getBuildVersionCode: () => '42',
    checkDatabase: async () => 'SQLite local operativa',
    checkOffline: async () => '1 paquete de ruta disponible sin conexión',
    checkConnectivity: async () => 'Conexión a Internet disponible',
    getLocationState: async () => ({ foregroundGranted: true, servicesEnabled: true }),
    checkRoutes: async () => '1/1 ruta con datos locales verificables',
    checkActiveAdventure: async () => 'No hay una aventura activa recuperable',
    ...overrides,
  };
}

describe('diagnostics', () => {
  it('reports the app metadata and every requested capability', async () => {
    const report = await runDiagnostics(dependencies());

    expect(report.appVersion).toBe('0.1.0');
    expect(report.buildVersionCode).toBe('42');
    expect(report.items.map((item) => item.id)).toEqual([
      'database',
      'location-permission',
      'gps',
      'offline',
      'connectivity',
      'routes',
      'active-adventure',
    ]);
    expect(report.items.every((item) => item.status === 'ok')).toBe(true);
  });

  it('keeps rendering useful results when one check rejects', async () => {
    const report = await runDiagnostics(dependencies({
      checkDatabase: vi.fn().mockRejectedValue(new Error('SQLite unavailable')),
      checkConnectivity: vi.fn().mockRejectedValue(new Error('Network request failed')),
      getLocationState: vi.fn().mockRejectedValue(new Error('Location unavailable')),
    }));

    expect(report.items.find((item) => item.id === 'database')).toMatchObject({ status: 'error' });
    expect(report.items.find((item) => item.id === 'connectivity')).toMatchObject({ status: 'error' });
    expect(report.items.find((item) => item.id === 'location-permission')).toMatchObject({ status: 'error' });
    expect(report.items.find((item) => item.id === 'routes')).toMatchObject({ status: 'ok' });
    expect(report.items.find((item) => item.id === 'active-adventure')).toMatchObject({ status: 'ok' });
  });

  it('formats a short technical report without leaking implementation details', async () => {
    const report = await runDiagnostics(dependencies());
    const text = formatDiagnostics(report);

    expect(text).toContain('Mágina Aventura · diagnóstico técnico');
    expect(text).toContain('Versión: 0.1.0');
    expect(text).toContain('Build/version code: 42');
    expect(text).toContain('Base de datos local: SQLite local operativa');
  });
});
