import type { ComponentType } from "react";
import type { RecordBefore, ResultDeltasProps } from "./ResultDeltas";

export interface WarmDeltas {
  readonly Deltas: ComponentType<ResultDeltasProps>;
  readonly before: RecordBefore;
}

let warmed: WarmDeltas | null = null;
let asked = 0;

/**
 * Loads the dashboard figures' code and reads the record while a round is played, so the result screen draws the
 * figures in its first frame. A round that ends before both arrive shows no figures rather than drawing them late.
 */
export function warmResultDeltas(): void {
  warmed = null;
  const ask = ++asked;
  import("./ResultDeltas")
    .then(async ({ default: Deltas, readRecordBefore }) => {
      const before = await readRecordBefore();
      if (ask === asked && before) warmed = { Deltas, before };
    })
    .catch((error) => console.error("Could not warm the dashboard figures", error));
}

export const warmedResultDeltas = (): WarmDeltas | null => warmed;
