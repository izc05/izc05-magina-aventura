import { describe, expect, it } from 'vitest';

import { transitionActivityState } from './state-machine';

describe('transitionActivityState', () => {
  it('supports the local activity lifecycle', () => {
    expect(transitionActivityState('DRAFT', 'START')).toBe('ACTIVE');
    expect(transitionActivityState('ACTIVE', 'PAUSE')).toBe('PAUSED');
    expect(transitionActivityState('PAUSED', 'RESUME')).toBe('ACTIVE');
    expect(transitionActivityState('ACTIVE', 'FINISH')).toBe('FINISHED');
  });

  it('rejects invalid local transitions', () => {
    expect(() => transitionActivityState('FINISHED', 'RESUME')).toThrow(
      'Invalid activity transition',
    );
    expect(() => transitionActivityState('VALIDATING', 'PAUSE')).toThrow(
      'Invalid activity transition',
    );
  });
});
