import { describe, expect, it } from 'vitest';

import {
  ManualQaStepSource,
  computeQaStepDelta,
  type QaStepReading,
} from './step-source';

describe('QA step source', () => {
  it('computes only forward step deltas', () => {
    const previous: QaStepReading = { totalSteps: 120, capturedAtMs: 1_000 };
    const current: QaStepReading = { totalSteps: 145, capturedAtMs: 2_000 };

    expect(computeQaStepDelta(previous, current)).toEqual({
      deltaSteps: 25,
      currentTotalSteps: 145,
      capturedAtMs: 2_000,
    });
  });

  it('never emits a negative delta when a device counter resets', () => {
    const previous: QaStepReading = { totalSteps: 900, capturedAtMs: 1_000 };
    const current: QaStepReading = { totalSteps: 4, capturedAtMs: 2_000 };

    expect(computeQaStepDelta(previous, current).deltaSteps).toBe(0);
  });

  it('does not treat the first reading as movement', () => {
    const current: QaStepReading = { totalSteps: 400, capturedAtMs: 2_000 };

    expect(computeQaStepDelta(null, current).deltaSteps).toBe(0);
  });

  it('provides a deterministic manual source for QA', async () => {
    const source = new ManualQaStepSource();

    source.addSteps(100, 1_000);
    source.addSteps(25, 2_000);

    await expect(source.getCurrentReading()).resolves.toEqual({
      totalSteps: 125,
      capturedAtMs: 2_000,
    });

    expect(source.reset(3_000)).toEqual({
      totalSteps: 0,
      capturedAtMs: 3_000,
    });
  });
});
