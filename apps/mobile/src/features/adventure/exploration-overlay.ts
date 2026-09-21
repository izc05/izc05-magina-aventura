export function shouldShowExplorationOverlay(
  previousObservationKey: string | null,
  currentObservationKey: string | null,
): boolean {
  return currentObservationKey !== null &&
    previousObservationKey !== null &&
    previousObservationKey !== currentObservationKey;
}
