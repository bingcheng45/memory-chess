import { PIECE_COUNT_RANGE } from "@/lib/reference/facts";
import { buildRoundRecord, type RoundRecordV1, type RoundSource } from "./record";

export const EXPORT_FORMAT = "memory-chess-lab";

export interface LabExportV1 {
  readonly format: typeof EXPORT_FORMAT;
  readonly v: 1;
  readonly exportedAt: number;
  readonly rounds: readonly RoundRecordV1[];
}

export type ImportResult =
  | { readonly ok: true; readonly rounds: readonly RoundRecordV1[]; readonly rejected: number }
  | { readonly ok: false; readonly reason: "not-json" | "not-a-lab-record" | "newer-version" };

export function buildExport(rounds: readonly RoundRecordV1[], exportedAt: number): LabExportV1 {
  return { format: EXPORT_FORMAT, v: 1, exportedAt, rounds };
}

const MAX_ID_LENGTH = 64;
const MAX_FEN_LENGTH = 100;
const MAX_MEMORIZE_SECONDS = 3600;
const LOCAL_DAY = /^\d{4}-\d{2}-\d{2}$/;
const FEN_BOARD = /^[1-8pnbrqkPNBRQK]+(\/[1-8pnbrqkPNBRQK]+){7}$/;

const isObject = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;
const isCount = (value: unknown, max = Number.MAX_SAFE_INTEGER): value is number =>
  Number.isInteger(value) && (value as number) >= 0 && (value as number) <= max;
const rankWidth = (rank: string) => [...rank].reduce((width, char) => width + (Number(char) || 1), 0);
const isFen = (value: unknown): value is string =>
  typeof value === "string" &&
  value.length <= MAX_FEN_LENGTH &&
  FEN_BOARD.test(value) &&
  value.split("/").every((rank) => rankWidth(rank) === 8);

/**
 * One round from an untrusted file, or null if a source field is missing or
 * out of shape. Derived fields (outcomes, counts, accuracy) are recomputed
 * from the two positions rather than trusted.
 */
export function parseRoundRecord(raw: unknown): RoundRecordV1 | null {
  if (!isObject(raw) || !isObject(raw.config)) return null;
  const { config } = raw;
  const valid =
    raw.v === 1 &&
    typeof raw.id === "string" &&
    raw.id.length > 0 &&
    raw.id.length <= MAX_ID_LENGTH &&
    (raw.source === "game" || raw.source === "calibration") &&
    isCount(raw.endedAt) &&
    typeof raw.localDay === "string" &&
    LOCAL_DAY.test(raw.localDay) &&
    isCount(config.pieceCount, PIECE_COUNT_RANGE.max) &&
    isCount(config.memorizeSeconds, MAX_MEMORIZE_SECONDS) &&
    isFen(raw.targetFen) &&
    isFen(raw.placedFen) &&
    isCount(raw.memorizeMs) &&
    isCount(raw.solveMs);
  if (!valid) return null;

  return buildRoundRecord({
    id: raw.id as string,
    source: raw.source as RoundSource,
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

export function parseImport(text: string): ImportResult {
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

  const parsed = data.rounds.map(parseRoundRecord);
  const rounds = parsed.filter((round): round is RoundRecordV1 => round !== null);
  return { ok: true, rounds, rejected: parsed.length - rounds.length };
}
