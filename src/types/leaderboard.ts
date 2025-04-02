export interface LeaderboardEntry {
  id: string;
  player_name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster';
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
  created_at: string;
}

export interface LeaderboardSubmission {
  player_name: string;
  difficulty: 'easy' | 'medium' | 'hard' | 'grandmaster';
  piece_count: number;
  correct_pieces: number;
  memorize_time: number;
  solution_time: number;
} 