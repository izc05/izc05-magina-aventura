import type { ComponentType } from 'react';

import { StartupCatalogDiagnosticScreen } from '../src/features/diagnostics/StartupCatalogDiagnosticScreen';
import { StartupDiagnosticScreen } from '../src/features/diagnostics/StartupDiagnosticScreen';
import { startupDiagnosticVariant } from '../src/features/diagnostics/startup-diagnostic-variant';

export default function RoutesHomeEntry() {
  if (startupDiagnosticVariant === 'A') return <StartupDiagnosticScreen />;
  if (startupDiagnosticVariant === 'B') return <StartupCatalogDiagnosticScreen />;

  // Keep the full Beta 02 Home out of the startup module graph for A/B.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const RoutesHomeScreen = require('./home-screen').default as ComponentType;
  return <RoutesHomeScreen />;
}
