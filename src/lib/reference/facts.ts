/**
 * Gameplay numbers surfaced by the server-rendered reference prose.
 *
 * Every value here is either derived from the gameplay code that owns it or
 * defined once here and imported by the code that enforces it, so the
 * reference pages cannot drift from what the game actually does. Translation
 * files never carry these numbers; localized prose interpolates them.
 */
import { DIFFICULTY_PRESETS, type Difficulty } from "@/types/game";

export type RankedDifficulty = Exclude<Difficulty, "custom">;

export const RANKED_DIFFICULTIES = Object.keys(
  DIFFICULTY_PRESETS,
) as readonly RankedDifficulty[];

export const PRESET_FACTS = RANKED_DIFFICULTIES.map((difficulty) => ({
  difficulty,
  pieceCount: DIFFICULTY_PRESETS[difficulty].pieceCount,
  memorizeSeconds: DIFFICULTY_PRESETS[difficulty].memorizeTime,
}));

/** Bounds of the custom sliders, enforced by the position generator's clamp. */
export const PIECE_COUNT_RANGE = { min: 2, max: 32 } as const;
export const MEMORIZE_SECONDS_RANGE = { min: 2, max: 32 } as const;

/** Rows the leaderboard query fetches per difficulty. */
export const LEADERBOARD_ROW_LIMIT = 200;

export type AccuracyBandKey =
  | "perfect"
  | "excellent"
  | "great"
  | "wellDone"
  | "goodEffort"
  | "keepPracticing";

/**
 * Result-screen message bands, ordered best first. The key doubles as the
 * `game.result.messages.*` translation key.
 */
export const ACCURACY_BANDS: readonly {
  key: AccuracyBandKey;
  minAccuracy: number;
}[] = [
  { key: "perfect", minAccuracy: 100 },
  { key: "excellent", minAccuracy: 90 },
  { key: "great", minAccuracy: 80 },
  { key: "wellDone", minAccuracy: 70 },
  { key: "goodEffort", minAccuracy: 50 },
  { key: "keepPracticing", minAccuracy: 0 },
];

export function accuracyBandKey(accuracy: number): AccuracyBandKey {
  const band = ACCURACY_BANDS.find(({ minAccuracy }) => accuracy >= minAccuracy);
  return band?.key ?? "keepPracticing";
}
