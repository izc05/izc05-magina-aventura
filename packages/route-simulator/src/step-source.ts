export interface QaStepReading {
  totalSteps: number;
  capturedAtMs: number;
}

export interface QaStepSource {
  readonly kind: 'manual' | 'device';
  getCurrentReading(): Promise<QaStepReading | null>;
}

export interface QaStepDelta {
  deltaSteps: number;
  currentTotalSteps: number;
  capturedAtMs: number;
}

export function computeQaStepDelta(
  previous: QaStepReading | null,
  current: QaStepReading,
): QaStepDelta {
  const safeCurrent = Number.isFinite(current.totalSteps)
    ? Math.max(0, Math.floor(current.totalSteps))
    : 0;
  const safePrevious =
    previous && Number.isFinite(previous.totalSteps)
      ? Math.max(0, Math.floor(previous.totalSteps))
      : safeCurrent;

  return {
    deltaSteps: Math.max(0, safeCurrent - safePrevious),
    currentTotalSteps: safeCurrent,
    capturedAtMs: current.capturedAtMs,
  };
}

export class ManualQaStepSource implements QaStepSource {
  readonly kind = 'manual' as const;
  private totalSteps = 0;
  private capturedAtMs = 0;

  addSteps(steps: number, capturedAtMs = Date.now()): QaStepReading {
    const delta = Number.isFinite(steps) ? Math.max(0, Math.floor(steps)) : 0;
    this.totalSteps += delta;
    this.capturedAtMs = capturedAtMs;

    return {
      totalSteps: this.totalSteps,
      capturedAtMs: this.capturedAtMs,
    };
  }

  reset(capturedAtMs = Date.now()): QaStepReading {
    this.totalSteps = 0;
    this.capturedAtMs = capturedAtMs;

    return {
      totalSteps: 0,
      capturedAtMs: this.capturedAtMs,
    };
  }

  async getCurrentReading(): Promise<QaStepReading> {
    return {
      totalSteps: this.totalSteps,
      capturedAtMs: this.capturedAtMs,
    };
  }
}
