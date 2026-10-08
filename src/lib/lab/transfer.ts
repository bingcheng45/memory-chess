import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { ROUND_SOURCES, type RoundSource } from "@/lib/analytics/events";
import { isPieceCode, MAX_PLACEMENT_MS, MAX_PLACEMENTS, MAX_REMOVALS, type PlacementEvent } from "./placements";
import {
  buildRoundRecord,
  LAB_SOURCES,
  localDayOf,
  ROUND_KINDS,
  withoutPlacements,
  type LabSource,
  type RoundCapture,
  type RoundInput,
  type RoundKind,
  type RoundRecord,
  type TypeCounts,
} from "./record";
import { isCount, MAX_DAYS, parseSummary, type ColorCounts, type LabSummary, type PersonalBest } from "./summary";
import { PLACEMENT_KEEP, ROUND_CAP } from "./storage";

const EXPORT_FORMAT = "memory-chess-lab";

/** Version 2 adds the lifetime summary; a version 1 file is the rounds alone. */
export interface LabExportV2 {
  readonly format: typeof EXPORT_FORMAT;
  readonly v: 2;
  readonly exportedAt: number;
  readonly rounds: readonly RoundRecord[];
  readonly summary?: LabSummary;
}

/** Far above a full 5,000-round record, so a file this large is not one. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportFailure = "too-large" | "unreadable" | "not-json" | "not-a-lab-record" | "newer-version";

export type ImportResult =
  | {
      readonly ok: true;
      readonly rounds: readonly RoundRecord[];
      readonly rejected: number;
      /** Valid rounds older than the newest ROUND_CAP, left out because the log would evict them at once. */
      readonly overCap: number;
      /** The file's lifetime summary, or "dropped" when it was present but could not be trusted. */
      readonly summary: LabSummary | "dropped" | null;
    }
  | { readonly ok: false; readonly reason: ImportFailure };

export function buildExport(rounds: readonly RoundRecord[], exportedAt: number, summary?: LabSummary): LabExportV2 {
  return { format: EXPORT_FORMAT, v: 2, exportedAt, rounds, ...(summary && { summary }) };
}

const MAX_ID_LENGTH = 64;
const MAX_FEN_LENGTH = 100;
const MAX_MEMORIZE_SECONDS = 3600;
const LOCAL_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const FEN_BOARD = /^[1-8pnbrqkPNBRQK]+(\/[1-8pnbrqkPNBRQK]+){7}$/;
const BEST_KEY = /^(game|calibration):\d{1,2}x\d{1,4}$/;
const MAX_BESTS = 500;
const MAX_TZ_OFFSET_MIN = 14 * 60;
const MAX_REVIEW_DELAY_DAYS = 3650;

export const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const rankWidth = (rank: string) => [...rank].reduce((width, char) => width + (Number(char) || 1), 0);
const isFen = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= MAX_FEN_LENGTH &&
  FEN_BOARD.test(value) &&
  value.split("/").every((rank) => rankWidth(rank) === 8);
const piecesIn = (fen: string) => fen.replace(/[\d/]/g, "").length;

/** A real calendar day, so "2026-02-30" fails because Date rolls it into March. */
export function isCalendarDay(value: unknown): value is string {
  if (typeof value !== "string" || !LOCAL_DAY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return localDayOf(date) === value;
}

const isPlacement = (value: unknown): value is PlacementEvent =>
  Array.isArray(value) &&
  value.length === 3 &&
  isCount(value[0], MAX_PLACEMENT_MS) &&
  isCount(value[1], 63) &&
  isPieceCode(value[2]);

const isPlacementList = (value: unknown): value is PlacementEvent[] =>
  Array.isArray(value) &&
  value.length <= MAX_PLACEMENTS &&
  value.every((event, index) => isPlacement(event) && (index === 0 || value[index - 1][0] <= event[0]));

const isId = (value: unknown): value is string => typeof value === "string" && value.length > 0 && value.length <= MAX_ID_LENGTH;

/** The version 2 facts of an untrusted round, or null if any present one is out of shape. */
function parseCapture(raw: Record<string, unknown>): RoundCapture | null {
  const kind = raw.kind === undefined ? "normal" : raw.kind;
  const reviewed = raw.reviewOf !== undefined;
  const valid =
    ROUND_KINDS.includes(kind as RoundKind) &&
    (raw.startSource === undefined || ROUND_SOURCES.includes(raw.startSource as RoundSource)) &&
    (raw.tzOffsetMin === undefined || (Number.isInteger(raw.tzOffsetMin) && Math.abs(raw.tzOffsetMin as number) <= MAX_TZ_OFFSET_MIN)) &&
    reviewed === (raw.reviewDelayDays !== undefined) &&
    (!reviewed || (kind === "review" && isId(raw.reviewOf) && isCount(raw.reviewDelayDays, MAX_REVIEW_DELAY_DAYS))) &&
    (kind === "daily" ? isCalendarDay(raw.dailyDay) : raw.dailyDay === undefined) &&
    (raw.placements === undefined) === (raw.removals === undefined) &&
    (raw.placements === undefined || (isPlacementList(raw.placements) && isCount(raw.removals, MAX_REMOVALS)));
  if (!valid) return null;
  return {
    kind: kind as RoundKind,
    startSource: raw.startSource as RoundSource | undefined,
    reviewOf: raw.reviewOf as string | undefined,
    reviewDelayDays: raw.reviewDelayDays as number | undefined,
    dailyDay: raw.dailyDay as string | undefined,
    tzOffsetMin: raw.tzOffsetMin as number | undefined,
    placements: raw.placements as PlacementEvent[] | undefined,
    removals: raw.removals as number | undefined,
  };
}

/**
 * One round from an untrusted file, or null if a source field is missing or
 * out of shape. Derived fields (outcomes, counts, accuracy, position id) are
 * recomputed from the two positions rather than trusted.
 */
function parseRoundRecord(raw: unknown, now: number): RoundRecord | null {
  if (!isObject(raw) || !isObject(raw.config)) return null;
  const { config } = raw;
  const latest = now + DAY_MS;
  const valid =
    (raw.v === 1 || raw.v === 2) &&
    isId(raw.id) &&
    LAB_SOURCES.includes(raw.source as LabSource) &&
    isCount(raw.endedAt, latest) &&
    isCalendarDay(raw.localDay) &&
    raw.localDay <= localDayOf(new Date(latest)) &&
    isCount(config.pieceCount, PIECE_COUNT_RANGE.max) &&
    config.pieceCount >= PIECE_COUNT_RANGE.min &&
    isCount(config.memorizeSeconds, MAX_MEMORIZE_SECONDS) &&
    isFen(raw.targetFen) &&
    piecesIn(raw.targetFen) === config.pieceCount &&
    isFen(raw.placedFen) &&
    isCount(raw.memorizeMs) &&
    isCount(raw.solveMs);
  if (!valid) return null;

  const input: RoundInput = {
    id: raw.id as string,
    source: raw.source as LabSource,
    endedAt: raw.endedAt as number,
    localDay: raw.localDay as string,
    pieceCount: config.pieceCount as number,
    memorizeSeconds: config.memorizeSeconds as number,
    targetFen: raw.targetFen as string,
    placedFen: raw.placedFen as string,
    memorizeMs: raw.memorizeMs as number,
    solveMs: raw.solveMs as number,
  };
  if (raw.v === 1) return buildRoundRecord(input);
  const capture = parseCapture(raw);
  return capture && buildRoundRecord(input, capture);
}

const isBest = (value: unknown): value is PersonalBest =>
  isObject(value) &&
  typeof value.accuracy === "number" &&
  value.accuracy >= 0 &&
  value.accuracy <= 100 &&
  isCount(value.correct) &&
  isCount(value.solveMs) &&
  isCount(value.at) &&
  isCount(value.rounds);

const nonKings = (counts: TypeCounts) => Object.entries(counts).reduce((sum, [type, count]) => (type === "k" ? sum : sum + (count ?? 0)), 0);
const colorTotal = ({ w, b }: ColorCounts) => w + b;

/**
 * The file's lifetime summary, rebuilt field by field, or null if any part is
 * out of shape, it counts fewer rounds than the file holds, or it contradicts
 * itself: every counted round adds a day and a best, so rounds, days and
 * bests are empty together or not at all, and the colour counts split the
 * same pieces other than kings that the type counts hold.
 */
function parseFileSummary(raw: unknown, rounds: readonly RoundRecord[], now: number): LabSummary | null {
  const summary = parseSummary(raw);
  if (!summary) return null;
  const bests = Object.entries(summary.bests);
  const played = summary.rounds > 0;
  const valid =
    summary.rounds >= rounds.length &&
    (summary.days.length > 0) === played &&
    (bests.length > 0) === played &&
    summary.days.length <= MAX_DAYS &&
    summary.days.every((day, index) => isCalendarDay(day) && day <= localDayOf(new Date(now + DAY_MS)) && (index === 0 || summary.days[index - 1] < day)) &&
    bests.length <= MAX_BESTS &&
    bests.every(([key, best]) => BEST_KEY.test(key) && isBest(best)) &&
    colorTotal(summary.colorShown) === nonKings(summary.typeShown) &&
    colorTotal(summary.colorMissed) === nonKings(summary.typeMissed) &&
    (summary.evictedThrough === null || summary.evictedThrough <= now + DAY_MS);
  if (!valid) return null;
  return {
    v: 3,
    rounds: summary.rounds,
    days: [...summary.days],
    bests: Object.fromEntries(
      bests.map(([key, { accuracy, correct, solveMs, at, rounds: count }]) => [key, { accuracy, correct, solveMs, at, rounds: count }]),
    ),
    squareShown: [...summary.squareShown],
    squareMissed: [...summary.squareMissed],
    typeShown: { ...summary.typeShown },
    typeMissed: { ...summary.typeMissed },
    colorShown: { w: summary.colorShown.w, b: summary.colorShown.b },
    colorMissed: { w: summary.colorMissed.w, b: summary.colorMissed.b },
    evictedThrough: summary.evictedThrough,
  };
}

export function parseImport(text: string, now: number = Date.now()): ImportResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }
  if (!isObject(data) || data.format !== EXPORT_FORMAT || !Array.isArray(data.rounds)) {
    return { ok: false, reason: "not-a-lab-record" };
  }
  if (data.v !== 1 && data.v !== 2) return { ok: false, reason: "newer-version" };

  const parsed = data.rounds.map((raw) => parseRoundRecord(raw, now));
  const valid = parsed.filter((round): round is RoundRecord => round !== null);
  const kept = [...valid].sort((a, b) => a.endedAt - b.endedAt).slice(-ROUND_CAP);
  const rounds = kept.map((round, index) => (index < kept.length - PLACEMENT_KEEP ? withoutPlacements(round) : round));
  const rejected = parsed.length - valid.length;
  const overCap = valid.length - rounds.length;
  // A summary counts every round of the file; one whose rounds did not all arrive could count a round twice later.
  const summary =
    data.v === 1 || data.summary === undefined
      ? null
      : (rejected === 0 && overCap === 0 && parseFileSummary(data.summary, rounds, now)) || "dropped";
  return { ok: true, rounds, rejected, overCap, summary };
}

export async function readImportFile(file: File, now: number = Date.now()): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, reason: "too-large" };
  try {
    return parseImport(await file.text(), now);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}
