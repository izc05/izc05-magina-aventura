export type StartupDiagnosticVariant = 'OFF' | 'A' | 'B' | 'C' | 'D' | 'E';

const rawVariant = process.env.EXPO_PUBLIC_STARTUP_DIAGNOSTIC_VARIANT ?? 'OFF';

export const startupDiagnosticVariant: StartupDiagnosticVariant =
  rawVariant === 'A' || rawVariant === 'B' || rawVariant === 'C' || rawVariant === 'D' || rawVariant === 'E'
    ? rawVariant
    : 'OFF';

export const isStartupDiagnosticBuild = startupDiagnosticVariant !== 'OFF';
