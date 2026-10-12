import type { CountryCode } from '@/lib/leaderboard/countries';

export const LEADERBOARD_DIFFICULTIES = ['easy', 'medium', 'hard', 'grandmaster'] as const;
export type LeaderboardDifficulty = (typeof LEADERBOARD_DIFFICULTIES)[number];

/** The board a daily row is filed under, next to its `daily_day`. */
export const DAILY_BOARD = 'daily';

export const MAX_SKILL_RATING = 5000;

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
  difficulty: LeaderboardDifficulty;
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  total_wrong_pieces?: number; // Total wrong pieces (missed + extra)
  /**
   * Absent where the rating migration is outstanding.
   */
  skill_rating?: number;
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
  /** The rating after this round's own change, an integer from 0 to MAX_SKILL_RATING. */
  skill_rating: number;
};

/** A daily row names the UTC day of its board, as YYYY-MM-DD. No other row carries a day. */
export type LeaderboardBoard =
  | { difficulty: LeaderboardDifficulty }
  | { difficulty: typeof DAILY_BOARD; daily_day: string };

export type LeaderboardSubmission = SubmittedRound & LeaderboardBoard;
