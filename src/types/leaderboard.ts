export interface LeaderboardEntry {
  id: string;
  /**
   * Player's display name (4-16 characters)
   */
  player_name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster';
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
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster';
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  total_wrong_pieces?: number; // Total wrong pieces (missed + extra)
} 