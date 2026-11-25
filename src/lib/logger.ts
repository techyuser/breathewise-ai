/**
 * Lightweight structured logger isolating console output so production modules avoid
 * scattered raw console statements and preserve clean client telemetry.
 */
export const logger = {
  warn(context: string, detail?: unknown): void {
    if (process.env.NODE_ENV !== "test") {
      console.warn(`[BreatheWise:${context}]`, detail instanceof Error ? detail.message : detail ?? "");
    }
  },
  error(context: string, detail?: unknown): void {
    if (process.env.NODE_ENV !== "test") {
      console.error(`[BreatheWise:${context}]`, detail instanceof Error ? detail.message : detail ?? "");
    }
  },
};
