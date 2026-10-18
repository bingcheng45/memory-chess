import { utcDayOf } from "@/lib/lab/daily";
import { DAY_MS } from "@/lib/lab/readiness";
import type { LeaderboardEntry } from "@/types/leaderboard";

export interface DailyBoardRead {
  readonly day: string;
  readonly rows: readonly LeaderboardEntry[];
  readonly playedLike: number | null;
}

export interface DailyTopRender {
  readonly today: string;
  readonly board: DailyBoardRead | null;
  readonly readAt: number;
}

export async function readTodayOrYesterday(today: string, read: (day: string) => Promise<DailyBoardRead | null>): Promise<DailyBoardRead | null> {
  const board = await read(today);
  if (board === null || board.rows.length > 0) return board;
  const yesterday = await read(utcDayOf(Date.parse(`${today}T00:00:00Z`) - DAY_MS));
  return yesterday !== null && yesterday.rows.length > 0 ? yesterday : board;
}
