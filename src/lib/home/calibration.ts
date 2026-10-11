import { DIFFICULTY_PRESETS } from "@/types/game";
import { DEFAULT_PRESET } from "@/lib/game/configPrefill";
import type { RankedDifficulty } from "@/lib/reference/facts";
import { labPositionFromFen, type LabPosition, type RoundConfig } from "@/lib/round/round";

export const CALIBRATION_RULES = {
  pieceCount: DEFAULT_PRESET.pieceCount,
  studyMs: DEFAULT_PRESET.memorizeTime * 1000,
} as const;

export const CALIBRATION_CONFIG: RoundConfig = { ...CALIBRATION_RULES, source: "calibration" };

/**
 * A position from the real game's generator. The import is dynamic so chess.js
 * stays out of the homepage bundle until a round starts.
 */
export async function loadCalibrationPosition(random: () => number = Math.random): Promise<LabPosition | null> {
  const { generateMemorizationPosition } = await import("@/lib/utils/memorizationPosition");
  const chess = generateMemorizationPosition(CALIBRATION_RULES.pieceCount, random);
  return chess ? labPositionFromFen(chess.fen()) : null;
}

export type TierAdvice = "stepUp" | "stay" | "start";

interface TierSuggestion {
  readonly advice: TierAdvice;
  readonly difficulty: RankedDifficulty;
  readonly pieceCount: number;
  readonly memorizeTime: number;
}

// Best first. A calibration round is the Medium preset, so a clean reading
// points one preset up and a weak one points one down.
const TIER_LADDER: readonly {
  minAccuracy: number;
  advice: TierAdvice;
  difficulty: RankedDifficulty;
}[] = [
  { minAccuracy: 90, advice: "stepUp", difficulty: "hard" },
  { minAccuracy: 60, advice: "stay", difficulty: "medium" },
  { minAccuracy: 0, advice: "start", difficulty: "easy" },
];

export function suggestTier(accuracy: number): TierSuggestion {
  const rung = TIER_LADDER.find(({ minAccuracy }) => accuracy >= minAccuracy) ?? TIER_LADDER[2];
  const { pieceCount, memorizeTime } = DIFFICULTY_PRESETS[rung.difficulty];
  return { advice: rung.advice, difficulty: rung.difficulty, pieceCount, memorizeTime };
}
