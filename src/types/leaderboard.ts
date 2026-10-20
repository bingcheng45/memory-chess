import type { CountryCode } from '@/lib/leaderboard/countries';
import type { BLINDFOLD_MODE } from '@/lib/game/roundLink';

export const LEADERBOARD_DIFFICULTIES = ['easy', 'medium', 'hard', 'grandmaster'] as const;
export type LeaderboardDifficulty = (typeof LEADERBOARD_DIFFICULTIES)[number];

export const DAILY_BOARD = 'daily';

/** What a reader is told when a board cannot be read; the cause is logged on the server, never sent. */
export const LEADERBOARD_UNAVAILABLE = 'The leaderboard is unavailable. Please try again shortly.';

export const isLeaderboardDifficulty = (value: unknown): value is LeaderboardDifficulty =>
  LEADERBOARD_DIFFICULTIES.includes(value as LeaderboardDifficulty);

export interface LeaderboardEntry {
  id: string;
  /**
   * Player's display name (4-16 characters)
   */
  player_name: string;
  /**
   * Absent on rows written before the database migration added the column.
   */
  country_code?: CountryCode;
  difficulty: LeaderboardDifficulty | typeof DAILY_BOARD;
  daily_day?: string | null;
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  total_wrong_pieces?: number; // Total wrong pieces (missed + extra)
  skill_rating?: number;
  /** Absent on rows read before migration 0008 added the column. */
  mode?: 'board' | typeof BLINDFOLD_MODE;
  created_at: string;
}

type SubmittedRound = {
  /**
   * Player's display name (4-16 characters)
   */
  player_name: string;
  /**
   * Required, because the API route fills in the world code before the
   * submission reaches the service.
   */
  country_code: CountryCode;
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  total_wrong_pieces?: number; // Total wrong pieces (missed + extra)
  skill_rating: number;
};

/** A ranked board, studied on the board or, with `mode`, blindfold. The daily board is always studied on the board. */
export type LeaderboardBoard =
  | { difficulty: LeaderboardDifficulty; mode?: typeof BLINDFOLD_MODE }
  | { difficulty: typeof DAILY_BOARD; daily_day: string };

export type LeaderboardSubmission = SubmittedRound & LeaderboardBoard;
