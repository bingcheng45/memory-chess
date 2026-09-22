-- Leaderboard database schema for Memory Chess
--
-- This describes leaderboard_entries as it stands after
-- schema/migrations/0001_leaderboard_country_code.sql. The column list and its
-- order were taken from the live table, not from an earlier copy of this file:
-- an older version omitted total_wrong_pieces for as long as that column had
-- existed in production.
--
-- total_wrong_pieces and country_code are declared last because both arrived
-- by ALTER TABLE, which appends. Reordering them here would make the file
-- disagree with what SELECT * returns.
--
-- Sample INSERT rows used to live at the bottom of this file. They are gone on
-- purpose. The file is pasted into the Supabase SQL editor during recovery,
-- and eight fabricated players landing in a restored leaderboard is a worse
-- outcome than having no fixture here.

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster')),
  piece_count INTEGER NOT NULL,
  correct_pieces INTEGER NOT NULL,
  memorize_time DECIMAL(10, 3) NOT NULL,
  solution_time DECIMAL(10, 3) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- Missed plus extra pieces. Nullable: rows predate the column, and
  -- getLeaderboard() sorts it with nullsFirst: false because of them.
  total_wrong_pieces INTEGER,
  -- 'ZZ' is CLDR's unknown region, used as the "world" option.
  country_code TEXT NOT NULL DEFAULT 'ZZ',

  CHECK (correct_pieces <= piece_count),
  CHECK (memorize_time > 0),
  CHECK (solution_time > 0)
);

-- Added later by db-constraints.sql, restated here so this file alone
-- describes the live table.
ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_player_name_length
  CHECK (LENGTH(player_name) >= 4 AND LENGTH(player_name) <= 16);

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_country_code_format
  CHECK (country_code ~ '^[A-Z]{2}$');

-- Index for quick leaderboard retrieval.
CREATE INDEX idx_leaderboard_ranking ON leaderboard_entries (
  difficulty,
  correct_pieces DESC,
  memorize_time ASC,
  solution_time ASC
);
