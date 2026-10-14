import type { TrendSetting } from "./engine";
import type { LabResults } from "./metrics";

/** The figures a player can copy about themselves: each one only once its panel can read it, with the rounds behind it. */
export interface ReadingCard {
  readonly span: { readonly pieceCount: number; readonly rounds: number };
  readonly held: { readonly average: number; readonly rounds: number } | null;
  readonly speed: { readonly secondsPerPiece: number; readonly setting: TrendSetting; readonly rounds: number } | null;
}

const tenths = (value: number) => Math.round(value * 10) / 10;

/** Ready only: a stale figure is still true, but a card copied today would pass it off as current. */
export function readingCardOf({ span, piecesHeld, speed }: Pick<LabResults, "span" | "piecesHeld" | "speed">): ReadingCard | null {
  if (span.readiness.state !== "ready" || span.value?.pieceCount == null) return null;
  return {
    span: { pieceCount: span.value.pieceCount, rounds: span.value.qualifyingRounds },
    held:
      piecesHeld.readiness.state === "ready" && piecesHeld.value
        ? { average: tenths(piecesHeld.value.recent.average), rounds: piecesHeld.readiness.sampleSize }
        : null,
    speed:
      speed.readiness.state === "ready" && speed.value
        ? { secondsPerPiece: tenths(speed.value.recent.average), setting: speed.value.setting, rounds: speed.readiness.sampleSize }
        : null,
  };
}
