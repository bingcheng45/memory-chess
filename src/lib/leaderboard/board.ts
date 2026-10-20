import { parseUtcDay, utcDayOf } from '@/lib/lab/daily';
import { DAY_MS } from '@/lib/lab/readiness';
import { BLINDFOLD_MODE } from '@/lib/game/roundLink';
import { DAILY_BOARD, isLeaderboardDifficulty, type LeaderboardBoard } from '@/types/leaderboard';
import { blindfoldBoardOpen } from './mode';

/** A viewer whose clock runs a little ahead asks for tomorrow's board just before midnight UTC. */
const READ_CLOCK_SKEW_MS = 5 * 60_000;

/** `mode` is absent or 'board' for a board-study row; 'blindfold' names a blindfold board, which exists only once it is open. */
export function parseBoard(difficulty: unknown, dailyDay: unknown, mode?: unknown): LeaderboardBoard | null {
  const blindfold = mode === BLINDFOLD_MODE;
  if (!blindfold && mode != null && mode !== 'board') return null;
  if (difficulty === DAILY_BOARD) {
    const day = parseUtcDay(dailyDay);
    return day === null || blindfold ? null : { difficulty, daily_day: day };
  }
  if (!isLeaderboardDifficulty(difficulty) || dailyDay != null) return null;
  if (!blindfold) return { difficulty };
  return blindfoldBoardOpen() ? { difficulty, mode: BLINDFOLD_MODE } : null;
}

export function joinableDays(now: number): readonly string[] {
  return [utcDayOf(now), utcDayOf(now - DAY_MS)];
}

export function readableDays(now: number): readonly string[] {
  return [utcDayOf(now + READ_CLOCK_SKEW_MS), ...joinableDays(now)];
}

export function readBoard(difficulty: unknown, dailyDay: unknown, openDays: readonly string[], mode?: unknown): LeaderboardBoard | null {
  const board = parseBoard(difficulty, dailyDay, mode);
  if (board?.difficulty !== DAILY_BOARD) return board;
  return openDays.includes(board.daily_day) ? board : null;
}
