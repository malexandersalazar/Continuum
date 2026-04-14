/**
 * DrowsinessAnalyzer — rolling-window accumulator for EAR-based drowsiness detection.
 *
 * Core logic: accumulate the total milliseconds the EAR was below a threshold inside a
 * rolling time window. A single blink (~150–400 ms) contributes very little; slow blinks
 * and micro-sleeps (≥ 500 ms) accumulate quickly.
 *
 * Designed for incremental expansion:
 * - Add more signals via addXxxSample() + include in analyze().
 * - Tune constructor params based on real-user EAR calibration.
 */

interface EARSample {
  ear: number;
  ts: number; // absolute ms (Date.now())
}

export interface DrowsinessResult {
  isDrowsy: boolean;
  /** Total ms with EAR < threshold inside the current window. */
  lowEarAccumulatedMs: number;
  /** Rolling window size (ms) used for this result. */
  windowMs: number;
  /** Mean EAR across all samples in the window. */
  avgEAR: number;
}

export class DrowsinessAnalyzer {
  private samples: EARSample[] = [];

  /**
   * @param earThreshold   EAR below this value counts as "eye closing" (default 0.22)
   * @param drowsyMs       Accumulated low-EAR ms to trigger drowsy flag (default 3 000)
   * @param windowMs       Rolling window size in ms (default 30 000)
   *
   * User guidance: "20 s of low EAR in a 60 s window" → new DrowsinessAnalyzer(0.22, 20_000, 60_000)
   * Initial values are intentionally conservative for fast feedback during development.
   */
  constructor(
    private readonly earThreshold = 0.22,
    private readonly drowsyMs = 3_000,
    private readonly windowMs = 30_000,
  ) {}

  addSample(ear: number, ts: number): void {
    if (Number.isNaN(ear)) return; // skip degenerate frames
    this.samples.push({ ear, ts });
    const cutoff = ts - this.windowMs;
    this.samples = this.samples.filter((s) => s.ts >= cutoff);
  }

  analyze(): DrowsinessResult {
    const n = this.samples.length;
    if (n === 0) {
      return { isDrowsy: false, lowEarAccumulatedMs: 0, windowMs: this.windowMs, avgEAR: 1 };
    }

    const sorted = this.samples.slice().sort((a, b) => a.ts - b.ts);
    let lowEarAccumulatedMs = 0;
    let earSum = 0;

    for (let i = 0; i < sorted.length; i++) {
      earSum += sorted[i].ear;
      if (
        i > 0 &&
        sorted[i].ear < this.earThreshold &&
        sorted[i - 1].ear < this.earThreshold
      ) {
        lowEarAccumulatedMs += sorted[i].ts - sorted[i - 1].ts;
      }
    }

    return {
      isDrowsy: lowEarAccumulatedMs >= this.drowsyMs,
      lowEarAccumulatedMs,
      windowMs: this.windowMs,
      avgEAR: earSum / n,
    };
  }

  reset(): void {
    this.samples = [];
  }
}
