import { describe, expect, it } from 'vitest';

import { shouldShowExplorationOverlay } from './exploration-overlay';

describe('exploration overlay visibility', () => {
  it('does not show on initial hydration or recovery', () => {
    expect(shouldShowExplorationOverlay(null, 'checkpoint:one:1')).toBe(false);
    expect(shouldShowExplorationOverlay('checkpoint:one:1', 'checkpoint:one:1')).toBe(false);
  });

  it('shows only when a new observation arrives', () => {
    expect(shouldShowExplorationOverlay('checkpoint:one:1', 'checkpoint:one:2')).toBe(true);
    expect(shouldShowExplorationOverlay('checkpoint:one:2', 'discovery:two:3')).toBe(true);
    expect(shouldShowExplorationOverlay('checkpoint:one:1', null)).toBe(false);
  });
});
