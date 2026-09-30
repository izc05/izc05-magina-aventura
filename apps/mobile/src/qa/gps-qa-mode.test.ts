import { describe, expect, it } from 'vitest';
import { isGpsQaAuthBypassEnabled } from './gps-qa-mode';

describe('GPS QA auth bypass', () => {
  it('is disabled by default and for arbitrary values', () => {
    expect(isGpsQaAuthBypassEnabled(undefined)).toBe(false);
    expect(isGpsQaAuthBypassEnabled('true')).toBe(false);
    expect(isGpsQaAuthBypassEnabled('0')).toBe(false);
  });

  it('is enabled only by the explicit QA value', () => {
    expect(isGpsQaAuthBypassEnabled('1')).toBe(true);
  });
});
