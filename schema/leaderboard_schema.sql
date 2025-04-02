-- Leaderboard database schema for Memory Chess

-- Create the leaderboard_entries table
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster')),
  piece_count INTEGER NOT NULL,
  correct_pieces INTEGER NOT NULL,
  memorize_time DECIMAL(10, 3) NOT NULL,
  solution_time DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Additional constraints
  CHECK (correct_pieces <= piece_count),
  CHECK (memorize_time > 0),
  CHECK (solution_time > 0)
);

-- Index for quick leaderboard retrieval
CREATE INDEX idx_leaderboard_ranking ON leaderboard_entries (
  difficulty,
  correct_pieces DESC,
  memorize_time ASC,
  solution_time ASC
);

-- Sample data for testing (optional - can be commented out for production)
INSERT INTO leaderboard_entries (
  player_name, 
  difficulty, 
  piece_count, 
  correct_pieces, 
  memorize_time, 
  solution_time
) VALUES
  ('ChessMstr', 'medium', 32, 32, 15.2, 42.8),
  ('Visionary', 'medium', 32, 30, 20.1, 37.5),
  ('MemoryPro', 'medium', 32, 30, 22.3, 45.9),
  ('ChessLvr', 'medium', 32, 29, 18.7, 39.2),
  ('BoardMstr', 'medium', 32, 28, 17.9, 41.3),
  ('GrandChamp', 'hard', 32, 30, 25.7, 50.2),
  ('MemoryKing', 'easy', 16, 16, 10.5, 20.3),
  ('ChessFan', 'grandmaster', 64, 58, 60.0, 120.5);