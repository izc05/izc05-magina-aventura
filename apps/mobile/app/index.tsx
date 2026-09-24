import type { ComponentType } from 'react';

import { startupDiagnosticVariant } from '../src/features/diagnostics/startup-diagnostic-variant';

export default function RoutesHomeEntry() {
  if (startupDiagnosticVariant === 'D') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Screen = require('../src/features/diagnostics/StartupNativeDiagnosticScreen').StartupNativeDiagnosticScreen as ComponentType;
    return <Screen />;
  }

  if (startupDiagnosticVariant === 'A') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Screen = require('../src/features/diagnostics/StartupDiagnosticScreen').StartupDiagnosticScreen as ComponentType;
    return <Screen />;
  }

  if (startupDiagnosticVariant === 'B') {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const Screen = require('../src/features/diagnostics/StartupCatalogDiagnosticScreen').StartupCatalogDiagnosticScreen as ComponentType;
    return <Screen />;
  }

  // Keep the full Beta 02 Home out of the startup module graph for A/B/D.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RoutesHomeScreen = require('./home-screen').default as ComponentType;
  return <RoutesHomeScreen />;
}
