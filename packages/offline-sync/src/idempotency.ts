export interface SyncOperation {
  idempotencyKey: string;
  kind: string;
}

export function deduplicateSyncOperations<T extends SyncOperation>(operations: T[]): T[] {
  const seen = new Set<string>();

  return operations.filter((operation) => {
    if (seen.has(operation.idempotencyKey)) return false;
    seen.add(operation.idempotencyKey);
    return true;
  });
}
