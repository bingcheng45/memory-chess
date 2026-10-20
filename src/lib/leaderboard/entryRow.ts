import { parseCountryCode, WORLD_CODE } from "@/lib/leaderboard/countries";
import { parseScore } from "@/lib/leaderboard/ranking";
import { parseBoard } from "@/lib/leaderboard/board";
import { isEntryId } from "@/lib/leaderboard/standing";
import type { DailyEntry, StoredEntry } from "@/lib/lab/entries";
import { isObject } from "@/lib/lab/guards";
import { DAILY_BOARD } from "@/types/leaderboard";

export function entryFromRow(row: unknown, submittedAt: number): StoredEntry | DailyEntry | null {
  if (!isObject(row) || !isEntryId(row.id)) return null;
  const board = parseBoard(row.difficulty, row.daily_day, row.mode);
  if (board === null) return null;
  const score = parseScore({
    correctPieces: row.correct_pieces,
    totalWrongPieces: row.total_wrong_pieces ?? null,
    memorizeTime: row.memorize_time,
    solutionTime: row.solution_time,
  });
  if (score === null) return null;
  const country = row.country_code === undefined ? WORLD_CODE : parseCountryCode(row.country_code);
  if (country === null) return null;
  const facts = { id: row.id, country, score, submittedAt };
  return board.difficulty === DAILY_BOARD ? { ...facts, difficulty: DAILY_BOARD, dailyDay: board.daily_day } : { ...facts, difficulty: board.difficulty, ...(board.mode && { mode: board.mode }) };
}
