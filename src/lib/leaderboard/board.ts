import { parseUtcDay, utcDayOf } from '@/lib/lab/daily';
import { DAY_MS } from '@/lib/lab/readiness';
import { DAILY_BOARD, isLeaderboardDifficulty, type LeaderboardBoard } from '@/types/leaderboard';

/**
 * The board a submission names. A daily row is accepted for today's board and
 * yesterday's, in UTC at `now`, so a round finished just after midnight still
 * lands on the board it was played on.
 */
export function readBoard(difficulty: unknown, dailyDay: unknown, now: number): LeaderboardBoard | null {
  if (difficulty === DAILY_BOARD) {
    const day = parseUtcDay(dailyDay);
    return day === utcDayOf(now) || day === utcDayOf(now - DAY_MS) ? { difficulty, daily_day: day } : null;
  }
  return isLeaderboardDifficulty(difficulty) && dailyDay == null ? { difficulty } : null;
}
