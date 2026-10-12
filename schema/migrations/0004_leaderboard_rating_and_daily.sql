-- Runbook: docs/migrations/2026-10-leaderboard-rating-and-daily.md

-- An ALTER waiting for its lock holds up every read and write queued behind
-- it, so give up after five seconds rather than stall the leaderboard. LOCAL
-- ends with this transaction, so a pooled connection does not keep it.
SET LOCAL lock_timeout = '5s';

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS skill_rating INTEGER NOT NULL DEFAULT 1000;

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
-- name was chosen by Postgres and is not written down anywhere.
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

-- The anon key can insert past the API route and send its own created_at,
-- NULL included, which would bypass check_daily_day_recent. A daily row always
-- takes the database's clock.
CREATE OR REPLACE FUNCTION leaderboard_daily_created_at() RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.created_at := now();
  RETURN NEW;
END
$$;

DROP TRIGGER IF EXISTS leaderboard_daily_created_at ON leaderboard_entries;
CREATE TRIGGER leaderboard_daily_created_at
  BEFORE INSERT ON leaderboard_entries
  FOR EACH ROW
  WHEN (NEW.daily_day IS NOT NULL)
  EXECUTE FUNCTION leaderboard_daily_created_at();

-- The anon key can insert past the API route, so the table itself holds a
-- daily row to the UTC day it was stored or the day before.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_daily_day_recent'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT check_daily_day_recent
      CHECK (daily_day IS NULL OR daily_day BETWEEN (created_at AT TIME ZONE 'UTC')::date - 1 AND (created_at AT TIME ZONE 'UTC')::date);
  END IF;
END
$$;

-- Column order follows RANKING_ORDER in src/lib/leaderboard/ranking.ts after
-- the day, so one day's board reads straight off the index.
CREATE INDEX IF NOT EXISTS idx_leaderboard_daily_ranking
  ON leaderboard_entries (
    daily_day,
    correct_pieces DESC,
    total_wrong_pieces ASC NULLS LAST,
    memorize_time ASC,
    solution_time ASC
  )
  WHERE difficulty = 'daily';
