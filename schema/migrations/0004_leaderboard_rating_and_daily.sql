-- 0004: add leaderboard_entries.skill_rating and daily_day, and the 'daily' board
--
-- Every statement is guarded, so running this file a second time is a no-op
-- rather than an error. The owner applies it by hand in the Supabase SQL
-- editor, where a re-run is likely.
-- Runbook: docs/migrations/2026-10-leaderboard-rating-and-daily.md
--
-- Rows stored before this migration take 1000, the rating every player starts
-- from, so the column needs no nullable state.

-- An ALTER waiting for its lock holds up every read and write queued behind
-- it, so give up after five seconds rather than stall the leaderboard.
SET lock_timeout = '5s';

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS skill_rating INTEGER NOT NULL DEFAULT 1000;

-- A daily row is filed under the UTC day its board belongs to, not the day it
-- was submitted, so a round started at 23:59 lands on the right board.
ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS daily_day DATE;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_skill_rating_range'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT check_skill_rating_range
      CHECK (skill_rating BETWEEN 0 AND 5000);
  END IF;
END
$$;

-- The original difficulty check was declared inline in CREATE TABLE, so its
-- name was chosen by Postgres and is not written down anywhere. Every check
-- that reads difficulty alone is replaced by the named one below, whatever it
-- is called.
DO $$
DECLARE
  stale RECORD;
BEGIN
  FOR stale IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'leaderboard_entries'::regclass
      AND c.contype = 'c'
      AND a.attname = 'difficulty'
      AND cardinality(c.conkey) = 1
      AND c.conname <> 'check_difficulty_board'
  LOOP
    EXECUTE format('ALTER TABLE leaderboard_entries DROP CONSTRAINT %I', stale.conname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_difficulty_board'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT check_difficulty_board
      CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster', 'daily'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_daily_day_matches_board'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT check_daily_day_matches_board
      CHECK ((difficulty = 'daily') = (daily_day IS NOT NULL));
  END IF;
END
$$;

-- Follows RANKING_ORDER in src/lib/leaderboard/ranking.ts after the day, so
-- one day's board reads straight off the index.
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily_ranking
  ON leaderboard_entries (
    daily_day,
    correct_pieces DESC,
    total_wrong_pieces ASC NULLS LAST,
    memorize_time ASC,
    solution_time ASC
  )
  WHERE difficulty = 'daily';
