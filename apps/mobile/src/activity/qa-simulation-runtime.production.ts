import type { QaTestPositionKey } from '../features/qa/qa-harness';

/** Production stub selected by Metro; TEST DATA has no runtime implementation. */
export async function emitQaTestPosition(_positionKey: QaTestPositionKey): Promise<void> {
  return;
}
