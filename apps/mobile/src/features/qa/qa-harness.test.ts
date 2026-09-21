import { describe, expect, it } from 'vitest';

import {
  isQaHarnessEnabledForBuild,
  resolveQaHarnessMode,
} from './qa-harness';

describe('Phase 4C QA harness build isolation', () => {
  it('permits TEST DATA in a development build without an explicit QA flag', () => {
    expect(resolveQaHarnessMode(true, undefined)).toBe('development');
    expect(isQaHarnessEnabledForBuild(true, undefined)).toBe(true);
  });

  it('permits TEST DATA only for an explicit QA release flag', () => {
    expect(resolveQaHarnessMode(false, 'true')).toBe('qa');
    expect(isQaHarnessEnabledForBuild(false, 'true')).toBe(true);
  });

  it.each([undefined, '', 'false', 'TRUE', '1', 'qa'])(
    'fails closed in a production build for flag %j',
    (flag) => {
      expect(resolveQaHarnessMode(false, flag)).toBe('production');
      expect(isQaHarnessEnabledForBuild(false, flag)).toBe(false);
    },
  );
});
