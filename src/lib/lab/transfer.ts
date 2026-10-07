import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { buildRoundRecord, LAB_SOURCES, localDayOf, type LabSource, type RoundRecordV1 } from "./record";
import { isCount } from "./summary";
import { ROUND_CAP } from "./storage";

export const EXPORT_FORMAT = "memory-chess-lab";

export interface LabExportV1 {
  readonly format: typeof EXPORT_FORMAT;
  readonly v: 1;
  readonly exportedAt: number;
  readonly rounds: readonly RoundRecordV1[];
}

/** Far above a full 5,000-round record, so a file this large is not one. */
export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;

export type ImportFailure = "too-large" | "unreadable" | "not-json" | "not-a-lab-record" | "newer-version";

export type ImportResult =
  | {
      readonly ok: true;
      readonly rounds: readonly RoundRecordV1[];
      /** Rounds that failed validation. */
      readonly rejected: number;
      /** Valid rounds older than the newest ROUND_CAP, left out because the log would evict them at once. */
      readonly overCap: number;
    }
  | { readonly ok: false; readonly reason: ImportFailure };

export function buildExport(rounds: readonly RoundRecordV1[], exportedAt: number): LabExportV1 {
  return { format: EXPORT_FORMAT, v: 1, exportedAt, rounds };
}

const MAX_ID_LENGTH = 64;
const MAX_FEN_LENGTH = 100;
const MAX_MEMORIZE_SECONDS = 3600;
const LOCAL_DAY = /^\d{4}-\d{2}-\d{2}$/;
const DAY_MS = 24 * 60 * 60 * 1000;
const FEN_BOARD = /^[1-8pnbrqkPNBRQK]+(\/[1-8pnbrqkPNBRQK]+){7}$/;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const rankWidth = (rank: string) => [...rank].reduce((width, char) => width + (Number(char) || 1), 0);
const isFen = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= MAX_FEN_LENGTH &&
  FEN_BOARD.test(value) &&
  value.split("/").every((rank) => rankWidth(rank) === 8);
const piecesIn = (fen: string) => fen.replace(/[\d/]/g, "").length;

/** A real calendar day, so "2026-02-30" fails because Date rolls it into March. */
function isCalendarDay(value: unknown): value is string {
  if (typeof value !== "string" || !LOCAL_DAY.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return localDayOf(date) === value;
}

/**
 * One round from an untrusted file, or null if a source field is missing or
 * out of shape. Derived fields (outcomes, counts, accuracy) are recomputed
 * from the two positions rather than trusted.
 */
export function parseRoundRecord(raw: unknown, now: number): RoundRecordV1 | null {
  if (!isObject(raw) || !isObject(raw.config)) return null;
  const { config } = raw;
  const latest = now + DAY_MS;
  const valid =
    raw.v === 1 &&
    typeof raw.id === "string" &&
    raw.id.length > 0 &&
    raw.id.length <= MAX_ID_LENGTH &&
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

  return buildRoundRecord({
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
  });
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
  if (data.v !== 1) return { ok: false, reason: "newer-version" };

  const parsed = data.rounds.map((raw) => parseRoundRecord(raw, now));
  const valid = parsed.filter((round): round is RoundRecordV1 => round !== null);
  const rounds = [...valid].sort((a, b) => a.endedAt - b.endedAt).slice(-ROUND_CAP);
  return { ok: true, rounds, rejected: parsed.length - valid.length, overCap: valid.length - rounds.length };
}

export async function readImportFile(file: File, now: number = Date.now()): Promise<ImportResult> {
  if (file.size > MAX_IMPORT_BYTES) return { ok: false, reason: "too-large" };
  try {
    return parseImport(await file.text(), now);
  } catch {
    return { ok: false, reason: "unreadable" };
  }
}
