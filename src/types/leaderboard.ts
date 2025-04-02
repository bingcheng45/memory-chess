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
} 