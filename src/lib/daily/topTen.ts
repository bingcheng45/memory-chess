import { utcDayOf } from "@/lib/lab/daily";
import { DAY_MS } from "@/lib/lab/readiness";
import type { LeaderboardEntry } from "@/types/leaderboard";

/** One day's daily board: its rows, best first, and the rating it played at, or null before enough players joined. */
export interface DailyBoardRead {
  readonly day: string;
  readonly rows: readonly LeaderboardEntry[];
  readonly playedLike: number | null;
}

/** What the server read when it rendered the page. `board` is null when that read failed. */
export interface DailyTopRender {
  readonly today: string;
  readonly board: DailyBoardRead | null;
  readonly readAt: number;
}

/**
 * Today's board, or yesterday's while nobody has joined today's yet, so a new UTC day does not open on an empty table.
 * Null when today's board cannot be read.
 */
export async function readDailyTop(today: string, read: (day: string) => Promise<DailyBoardRead | null>): Promise<DailyBoardRead | null> {
  const board = await read(today);
  if (board === null || board.rows.length > 0) return board;
  const yesterday = await read(utcDayOf(Date.parse(`${today}T00:00:00Z`) - DAY_MS));
  return yesterday !== null && yesterday.rows.length > 0 ? yesterday : board;
}
