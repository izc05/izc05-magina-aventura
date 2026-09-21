import type { QaTestPositionKey } from './qa-harness';

type QaSimulationPanelProps = Readonly<{
  onEmit(position: QaTestPositionKey): void;
}>;

export function QaSimulationPanel(_props: QaSimulationPanelProps) {
  return null;
}
