import type { CountryCode } from '@/lib/leaderboard/countries';

export const LEADERBOARD_DIFFICULTIES = ['easy', 'medium', 'hard', 'grandmaster'] as const;
export type LeaderboardDifficulty = (typeof LEADERBOARD_DIFFICULTIES)[number];

export const DAILY_BOARD = 'daily';

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

export type LeaderboardBoard =
  | { difficulty: LeaderboardDifficulty }
  | { difficulty: typeof DAILY_BOARD; daily_day: string };

export type LeaderboardSubmission = SubmittedRound & LeaderboardBoard;
