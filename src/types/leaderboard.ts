import type { CountryCode } from '@/lib/leaderboard/countries';

export const LEADERBOARD_DIFFICULTIES = ['easy', 'medium', 'hard', 'grandmaster'] as const;
export type LeaderboardDifficulty = (typeof LEADERBOARD_DIFFICULTIES)[number];

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
  created_at: string;
}

export interface LeaderboardSubmission {
  /**
   * Player's display name (4-16 characters)
   */
  player_name: string;
  /**
   * Required, because the API route fills in the world code before the
   * submission reaches the service.
   */
  country_code: CountryCode;
  difficulty: LeaderboardDifficulty;
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  total_wrong_pieces?: number; // Total wrong pieces (missed + extra)
} 