-- Leaderboard database schema for Memory Chess
--
-- This describes leaderboard_entries as it stands after
-- schema/migrations/0006_leaderboard_write_lockdown.sql. The column list and its
-- order were taken from the live table, not from an earlier copy of this file:
-- an older version omitted total_wrong_pieces for as long as that column had
-- existed in production.
--
-- total_wrong_pieces, country_code, skill_rating and daily_day are declared
-- last because they arrived by ALTER TABLE, which appends. Reordering them here would make the file
-- disagree with what SELECT * returns.
--
-- Sample INSERT rows used to live at the bottom of this file. They are gone on
-- purpose. The file is pasted into the Supabase SQL editor during recovery,
-- and eight fabricated players landing in a restored leaderboard is a worse
-- outcome than having no fixture here.

CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_name TEXT NOT NULL,
  difficulty TEXT NOT NULL,
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
  skill_rating INTEGER NOT NULL DEFAULT 1000,
  daily_day DATE,

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

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_skill_rating_range
  CHECK (skill_rating BETWEEN 0 AND 5000);

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_difficulty_board
  CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster', 'daily'));

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_daily_day_matches_board
  CHECK ((difficulty = 'daily') = (daily_day IS NOT NULL));

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_daily_day_recent
  CHECK (daily_day IS NULL OR daily_day BETWEEN (created_at AT TIME ZONE 'UTC')::date - 1 AND (created_at AT TIME ZONE 'UTC')::date);

-- Added by 0006. Production holds these three NOT VALID, so rows stored
-- before 0006 may break them. Here they are plain, since a rebuilt table
-- starts empty.
ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_board_piece_count
  CHECK (
    difficulty = 'daily'
    OR (difficulty = 'easy' AND piece_count = 2)
    OR (difficulty = 'medium' AND piece_count = 6)
    OR (difficulty = 'hard' AND piece_count = 12)
    OR (difficulty = 'grandmaster' AND piece_count = 20)
  );

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_solution_time_per_piece
  CHECK (solution_time >= piece_count * 0.25);

ALTER TABLE leaderboard_entries
  ADD CONSTRAINT check_memorize_time_longest
  CHECK (memorize_time <= 60);

-- An insert could send its own created_at, NULL included, which would bypass
-- check_daily_day_recent. A daily row always takes the database's clock.
CREATE FUNCTION leaderboard_daily_created_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END
$$;

CREATE TRIGGER leaderboard_daily_created_at
  BEFORE INSERT ON leaderboard_entries
  FOR EACH ROW
  WHEN (NEW.daily_day IS NOT NULL)
  EXECUTE FUNCTION leaderboard_daily_created_at();

-- Index for quick leaderboard retrieval.
CREATE INDEX idx_leaderboard_ranking ON leaderboard_entries (
  difficulty,
  correct_pieces DESC,
  memorize_time ASC,
  solution_time ASC
);

-- Column order follows RANKING_ORDER in src/lib/leaderboard/ranking.ts after
-- the day, so one day's board reads straight off the index.
CREATE INDEX idx_leaderboard_daily_ranking ON leaderboard_entries (
  daily_day,
  correct_pieces DESC,
  total_wrong_pieces ASC NULLS LAST,
  memorize_time ASC,
  solution_time ASC
) WHERE difficulty = 'daily';

-- Anyone may read the board. Only the server writes it, with the service_role
-- key, which bypasses row level security. Row level security does not gate
-- TRUNCATE, so the grants carry the rule.
ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON leaderboard_entries
  FOR SELECT
  USING (true);

REVOKE ALL ON leaderboard_entries FROM anon, authenticated;
GRANT SELECT ON leaderboard_entries TO anon, authenticated;
