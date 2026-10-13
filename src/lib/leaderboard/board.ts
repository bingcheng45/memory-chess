import { parseUtcDay, utcDayOf } from '@/lib/lab/daily';
import { DAY_MS } from '@/lib/lab/readiness';
import { DAILY_BOARD, isLeaderboardDifficulty, type LeaderboardBoard } from '@/types/leaderboard';

/** A viewer whose clock runs a little ahead asks for tomorrow's board just before midnight UTC. */
const READ_CLOCK_SKEW_MS = 5 * 60_000;

export function parseBoard(difficulty: unknown, dailyDay: unknown): LeaderboardBoard | null {
  if (difficulty === DAILY_BOARD) {
    const day = parseUtcDay(dailyDay);
    return day === null ? null : { difficulty, daily_day: day };
  }
  return isLeaderboardDifficulty(difficulty) && dailyDay == null ? { difficulty } : null;
}

export function joinableDays(now: number): readonly string[] {
  return [utcDayOf(now), utcDayOf(now - DAY_MS)];
}

export function readableDays(now: number): readonly string[] {
  return [utcDayOf(now + READ_CLOCK_SKEW_MS), ...joinableDays(now)];
}

export function readBoard(difficulty: unknown, dailyDay: unknown, openDays: readonly string[]): LeaderboardBoard | null {
  const board = parseBoard(difficulty, dailyDay);
  if (board?.difficulty !== DAILY_BOARD) return board;
  return openDays.includes(board.daily_day) ? board : null;
}
