import type { PieceSymbol } from "chess.js";
import { BOARD_SQUARES } from "@/lib/game/board";
import { placementFromFen, scorePlacement } from "@/lib/game/scoring";
import { GAME_CONFIG_RULES, presetIdFor, type PresetId } from "@/lib/game/configPrefill";

export const PIECE_LETTERS: readonly PieceSymbol[] = ["k", "q", "r", "b", "n", "p"];

/**
 * Calibration rounds never touch the game store's rating, history or streak, or
 * the leaderboard. The lab streak counts both sources, since it measures the
 * practice habit; personal bests are kept per source.
 */
export const LAB_SOURCES = ["game", "calibration"] as const;
export type LabSource = (typeof LAB_SOURCES)[number];

/** One square's outcome: empty, correct, missed, wrong piece on a target square, extra piece. */
export type SquareOutcome = "." | "c" | "m" | "w" | "x";

export interface RoundConfig {
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
  readonly difficulty: PresetId | null;
}

export type TypeCounts = Readonly<Partial<Record<PieceSymbol, number>>>;

export interface RoundRecordV1 {
  readonly v: 1;
  readonly id: string;
  readonly source: LabSource;
  readonly endedAt: number;
  /** Local calendar day at write time, so a later timezone change does not move it. */
  readonly localDay: string;
  readonly config: RoundConfig;
  /** Board part of the FEN only. */
  readonly targetFen: string;
  readonly placedFen: string;
  /** 64 SquareOutcome characters, a8 first. */
  readonly squares: string;
  readonly shownByType: TypeCounts;
  readonly missedByType: TypeCounts;
  readonly memorizeMs: number;
  readonly solveMs: number;
  readonly correct: number;
  /** Missed plus extra pieces, as the result screen counts it. */
  readonly wrong: number;
  readonly extra: number;
  readonly accuracy: number;
}

export interface RoundInput {
  readonly id: string;
  readonly source: LabSource;
  readonly endedAt: number;
  readonly localDay: string;
  readonly pieceCount: number;
  readonly memorizeSeconds: number;
  readonly targetFen: string;
  readonly placedFen: string;
  readonly memorizeMs: number;
  readonly solveMs: number;
}

export function localDayOf(date: Date): string {
  const pad = (value: number) => String(value).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

export function configKey({ pieceCount, memorizeSeconds }: Pick<RoundConfig, "pieceCount" | "memorizeSeconds">): string {
  return `${pieceCount}x${memorizeSeconds}`;
}

function outcome(target: string | undefined, placed: string | undefined): SquareOutcome {
  if (target === undefined) return placed === undefined ? "." : "x";
  if (placed === undefined) return "m";
  return placed === target ? "c" : "w";
}

function bump(counts: TypeCounts, letter: string): TypeCounts {
  const key = letter.toLowerCase() as PieceSymbol;
  return { ...counts, [key]: (counts[key] ?? 0) + 1 };
}

export function buildRoundRecord(input: RoundInput): RoundRecordV1 {
  const targetFen = input.targetFen.split(" ")[0];
  const placedFen = input.placedFen.split(" ")[0];
  const target = placementFromFen(targetFen);
  const placed = placementFromFen(placedFen);
  const score = scorePlacement(target, placed);
  const squares = BOARD_SQUARES.map((square) => outcome(target[square], placed[square]));
  const targetSquares = Object.keys(target);

  return {
    v: 1,
    id: input.id,
    source: input.source,
    endedAt: input.endedAt,
    localDay: input.localDay,
    config: {
      pieceCount: input.pieceCount,
      memorizeSeconds: input.memorizeSeconds,
      difficulty: presetIdFor(
        { pieceCount: input.pieceCount, memorizeTime: input.memorizeSeconds },
        GAME_CONFIG_RULES.presets,
      ),
    },
    targetFen,
    placedFen,
    squares: squares.join(""),
    shownByType: targetSquares.reduce<TypeCounts>((counts, square) => bump(counts, target[square]), {}),
    missedByType: targetSquares
      .filter((square) => placed[square] !== target[square])
      .reduce<TypeCounts>((counts, square) => bump(counts, target[square]), {}),
    memorizeMs: input.memorizeMs,
    solveMs: input.solveMs,
    correct: score.correct,
    wrong: score.totalWrong,
    extra: score.extra,
    accuracy: score.accuracy,
  };
}
