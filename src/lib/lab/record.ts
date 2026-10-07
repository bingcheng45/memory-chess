import type { PieceSymbol } from "chess.js";
import { BOARD_SQUARES } from "@/lib/game/board";
import { placementFromFen, scorePlacement } from "@/lib/game/scoring";
import { GAME_CONFIG_RULES, presetIdFor, type PresetId } from "@/lib/game/configPrefill";
import type { RoundSource } from "@/lib/analytics/events";
import type { PlacementLog } from "./placements";

export const PIECE_LETTERS: readonly PieceSymbol[] = ["k", "q", "r", "b", "n", "p"];

/**
 * Calibration rounds never touch the game store's rating, history or streak, or
 * the leaderboard. The lab streak counts both sources, since it measures the
 * practice habit; personal bests are kept per source.
 */
export const LAB_SOURCES = ["game", "calibration"] as const;
export type LabSource = (typeof LAB_SOURCES)[number];

/** Stored and exported per square: empty, correct, missed, wrong piece on a target square, extra piece. */
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
  readonly targetFen: string;
  readonly placedFen: string;
  /** 64 SquareOutcome characters, a8 first. */
  readonly squares: string;
  readonly shownByType: TypeCounts;
  readonly missedByType: TypeCounts;
  readonly memorizeMs: number;
  readonly solveMs: number;
  readonly correct: number;
  readonly wrong: number;
  readonly extra: number;
  readonly accuracy: number;
}

/** Daily and review rounds stay out of the plain trend and the personal bests. */
export const ROUND_KINDS = ["normal", "daily", "review"] as const;
export type RoundKind = (typeof ROUND_KINDS)[number];

/** Facts only a version 2 round carries. Each is optional, so a file written before a fact existed still reads. */
export interface RoundCapture {
  readonly startSource?: RoundSource;
  readonly kind?: RoundKind;
  /** Review rounds only: the round reviewed and the days since it. */
  readonly reviewOf?: string;
  readonly reviewDelayDays?: number;
  /** `Date.getTimezoneOffset()` at write time, so the hour of day reads true after a move. */
  readonly tzOffsetMin?: number;
  /** Kept on the newest PLACEMENT_KEEP rounds only; older rounds lose both fields together. */
  readonly placements?: PlacementLog["placements"];
  readonly removals?: number;
}

export interface RoundRecordV2 extends Omit<RoundRecordV1, "v">, RoundCapture {
  readonly v: 2;
  /** positionId(targetFen), so the same position can be found again. */
  readonly positionId: string;
  readonly kind: RoundKind;
}

export type RoundRecord = RoundRecordV1 | RoundRecordV2;

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

/** Practice and games at the same config are different tests, so bests and the trend keep them apart. */
export function settingKey(source: LabSource, config: Pick<RoundConfig, "pieceCount" | "memorizeSeconds">): string {
  return `${source}:${configKey(config)}`;
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

/** cyrb53: a 53-bit string hash, as 14 hex digits. Stable across versions, so never change it. */
export function positionId(boardFen: string): string {
  let h1 = 0xdeadbeef;
  let h2 = 0x41c6ce57;
  for (let index = 0; index < boardFen.length; index += 1) {
    const char = boardFen.charCodeAt(index);
    h1 = Math.imul(h1 ^ char, 2654435761);
    h2 = Math.imul(h2 ^ char, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
  h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
  h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(16).padStart(14, "0");
}

const definedOnly = <T extends object>(value: T): T =>
  Object.fromEntries(Object.entries(value).filter(([, field]) => field !== undefined)) as T;

/** Without a capture the round is version 1, the shape every file before version 2 holds. */
export function buildRoundRecord(input: RoundInput): RoundRecordV1;
export function buildRoundRecord(input: RoundInput, capture: RoundCapture): RoundRecordV2;
export function buildRoundRecord(input: RoundInput, capture?: RoundCapture): RoundRecord {
  const core = scoreRound(input);
  if (!capture) return { v: 1, ...core };
  return { v: 2, ...core, positionId: positionId(core.targetFen), ...definedOnly({ kind: "normal", ...capture }) } as RoundRecordV2;
}

function scoreRound(input: RoundInput): Omit<RoundRecordV1, "v"> {
  const targetFen = input.targetFen.split(" ")[0];
  const placedFen = input.placedFen.split(" ")[0];
  const target = placementFromFen(targetFen);
  const placed = placementFromFen(placedFen);
  const score = scorePlacement(target, placed);
  const squares = BOARD_SQUARES.map((square) => outcome(target[square], placed[square]));
  const targetSquares = Object.keys(target);

  return {
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
