import { parseUtcDay, utcDayOf } from '@/lib/lab/daily';
import { DAY_MS } from '@/lib/lab/readiness';
import { DAILY_BOARD, isLeaderboardDifficulty, type LeaderboardBoard } from '@/types/leaderboard';

export function parseBoard(difficulty: unknown, dailyDay: unknown): LeaderboardBoard | null {
  if (difficulty === DAILY_BOARD) {
    const day = parseUtcDay(dailyDay);
    return day === null ? null : { difficulty, daily_day: day };
  }
  return isLeaderboardDifficulty(difficulty) && dailyDay == null ? { difficulty } : null;
}

export function readBoard(difficulty: unknown, dailyDay: unknown, now: number): LeaderboardBoard | null {
  const board = parseBoard(difficulty, dailyDay);
  if (board?.difficulty !== DAILY_BOARD) return board;
  return board.daily_day === utcDayOf(now) || board.daily_day === utcDayOf(now - DAY_MS) ? board : null;
}

export const todaysDailyBoard = (now: number): LeaderboardBoard => ({ difficulty: DAILY_BOARD, daily_day: utcDayOf(now) });
