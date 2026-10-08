import type { PieceSymbol } from "chess.js";
import { BOARD_SQUARES } from "@/lib/game/board";
import { placementFromFen } from "@/lib/game/scoring";
import { PIECE_LETTERS, settingKey, type RoundRecord, type TypeCounts } from "./record";

export interface PersonalBest {
  readonly accuracy: number;
  readonly correct: number;
  readonly solveMs: number;
  readonly at: number;
  readonly rounds: number;
}

/** Pieces other than the kings, by colour: every round places both kings, so they would only add the same count to each. */
export interface ColorCounts {
  readonly w: number;
  readonly b: number;
}

/**
 * Lifetime counters kept beside the capped round log, so streak days, bests
 * and the miss map survive eviction. Every field is derivable from the log.
 */
export interface LabSummary {
  readonly v: 3;
  readonly rounds: number;
  readonly days: readonly string[];
  readonly bests: Readonly<Record<string, PersonalBest>>;
  readonly squareShown: readonly number[];
  readonly squareMissed: readonly number[];
  readonly typeShown: TypeCounts;
  readonly typeMissed: TypeCounts;
  readonly colorShown: ColorCounts;
  readonly colorMissed: ColorCounts;
  readonly evictedThrough: number | null;
}

export const MAX_DAYS = 400;

export const EMPTY_SUMMARY: LabSummary = {
  v: 3,
  rounds: 0,
  days: [],
  bests: {},
  squareShown: Array<number>(64).fill(0),
  squareMissed: Array<number>(64).fill(0),
  typeShown: {},
  typeMissed: {},
  colorShown: { w: 0, b: 0 },
  colorMissed: { w: 0, b: 0 },
  evictedThrough: null,
};

function addCounts(total: TypeCounts, more: TypeCounts): TypeCounts {
  return Object.fromEntries(
    PIECE_LETTERS.flatMap((letter) => {
      const sum = (total[letter] ?? 0) + (more[letter] ?? 0);
      return sum > 0 ? [[letter, sum]] : [];
    }),
  );
}

/** A wrong piece on a target square misses the target piece, as in the type counts; an extra piece misses nothing. */
function addColors(summary: LabSummary, { targetFen, squares }: RoundRecord): Pick<LabSummary, "colorShown" | "colorMissed"> {
  const target = placementFromFen(targetFen);
  const shown = { ...summary.colorShown };
  const missed = { ...summary.colorMissed };
  BOARD_SQUARES.forEach((square, index) => {
    const piece = target[square];
    if (!piece || piece.toLowerCase() === "k") return;
    const color = piece === piece.toUpperCase() ? "w" : "b";
    shown[color] += 1;
    if (squares[index] === "m" || squares[index] === "w") missed[color] += 1;
  });
  return { colorShown: shown, colorMissed: missed };
}

function beats(record: RoundRecord, best: PersonalBest | undefined): boolean {
  if (!best) return true;
  return record.accuracy > best.accuracy || (record.accuracy === best.accuracy && record.solveMs < best.solveMs);
}

export function addToSummary(summary: LabSummary, record: RoundRecord): LabSummary {
  const key = settingKey(record.source, record.config);
  const previous = summary.bests[key];
  const best: PersonalBest = beats(record, previous)
    ? { accuracy: record.accuracy, correct: record.correct, solveMs: record.solveMs, at: record.endedAt, rounds: 0 }
    : (previous as PersonalBest);
  const days = summary.days.includes(record.localDay)
    ? summary.days
    : [...summary.days, record.localDay].sort().slice(-MAX_DAYS);

  return {
    v: 3,
    rounds: summary.rounds + 1,
    days,
    bests: { ...summary.bests, [key]: { ...best, rounds: (previous?.rounds ?? 0) + 1 } },
    squareShown: summary.squareShown.map((count, index) => count + (record.squares[index] === "." || record.squares[index] === "x" ? 0 : 1)),
    squareMissed: summary.squareMissed.map(
      (count, index) => count + (record.squares[index] === "m" || record.squares[index] === "w" ? 1 : 0),
    ),
    typeShown: addCounts(summary.typeShown, record.shownByType),
    typeMissed: addCounts(summary.typeMissed, record.missedByType),
    ...addColors(summary, record),
    evictedThrough: summary.evictedThrough,
  };
}

export function summarize(records: readonly RoundRecord[]): LabSummary {
  return [...records].sort((a, b) => a.endedAt - b.endedAt).reduce(addToSummary, EMPTY_SUMMARY);
}

export const isCount = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;
const isCountArray = (value: unknown): value is number[] =>
  Array.isArray(value) && value.length === 64 && value.every((count) => isCount(count));
const isTypeCounts = (value: unknown): value is TypeCounts =>
  typeof value === "object" &&
  value !== null &&
  Object.entries(value).every(([key, count]) => PIECE_LETTERS.includes(key as PieceSymbol) && isCount(count));
const isColorCounts = (value: unknown): value is ColorCounts =>
  typeof value === "object" &&
  value !== null &&
  Object.keys(value).length === 2 &&
  isCount((value as ColorCounts).w) &&
  isCount((value as ColorCounts).b);

export function parseSummary(raw: unknown): LabSummary | null {
  if (typeof raw !== "object" || raw === null) return null;
  const summary = raw as Record<string, unknown>;
  const valid =
    summary.v === 3 &&
    isCount(summary.rounds) &&
    Array.isArray(summary.days) &&
    summary.days.every((day) => typeof day === "string") &&
    typeof summary.bests === "object" &&
    summary.bests !== null &&
    isCountArray(summary.squareShown) &&
    isCountArray(summary.squareMissed) &&
    isTypeCounts(summary.typeShown) &&
    isTypeCounts(summary.typeMissed) &&
    isColorCounts(summary.colorShown) &&
    isColorCounts(summary.colorMissed) &&
    (summary.evictedThrough === null || isCount(summary.evictedThrough));
  return valid ? (raw as LabSummary) : null;
}
