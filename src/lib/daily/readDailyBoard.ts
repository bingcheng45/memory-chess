import { playedLikeOf } from "@/lib/daily/boardRating";
import { dailySettingOf } from "@/lib/daily/schedule";
import type { DailyBoardRead } from "@/lib/daily/topTen";
import { getDailyResults, getLeaderboard } from "@/lib/services/leaderboardService";
import { DAILY_BOARD } from "@/types/leaderboard";

export async function readDailyBoard(day: string): Promise<DailyBoardRead | null> {
  const [result, results] = await Promise.all([getLeaderboard({ difficulty: DAILY_BOARD, daily_day: day }), getDailyResults(day)]);
  if (result.error) return null;
  return { day, rows: result.data, playedLike: results === null ? null : playedLikeOf(results, dailySettingOf(day)) };
}
