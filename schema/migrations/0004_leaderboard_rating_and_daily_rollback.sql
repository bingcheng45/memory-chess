-- 0004 rollback: remove leaderboard_entries.skill_rating and daily_day
--
-- Destructive. Dropping the columns discards every rating and daily day in
-- them, including values written by app code that ran between apply and
-- rollback. See docs/migrations/2026-10-leaderboard-rating-and-daily.md before
-- running this.
--
-- Safe to run twice, and safe to run against a partially applied migration.
-- It stops before changing anything while daily rows exist, because the old
-- difficulty check cannot hold them. The runbook says how to deal with them.

-- An ALTER waiting for its lock holds up every read and write queued behind
-- it, so give up after five seconds rather than stall the leaderboard. LOCAL
-- ends with this transaction, so a pooled connection does not keep it.
SET LOCAL lock_timeout = '5s';

-- Taken before the daily-row check so no daily row can land between the check
-- and the drop of the board that allows it.
LOCK TABLE leaderboard_entries IN ACCESS EXCLUSIVE MODE;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM leaderboard_entries WHERE difficulty = 'daily') THEN
    RAISE EXCEPTION 'leaderboard_entries holds daily rows; export or delete them before rolling back 0004';
  END IF;
END
$$;

DROP INDEX IF EXISTS idx_leaderboard_daily_ranking;

DROP TRIGGER IF EXISTS leaderboard_daily_created_at ON leaderboard_entries;

DROP FUNCTION IF EXISTS leaderboard_daily_created_at();

ALTER TABLE leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_daily_day_matches_board;

ALTER TABLE leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_daily_day_recent;

ALTER TABLE leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_difficulty_board;

-- The name Postgres gives the inline check in CREATE TABLE, which is what the
-- table carried before 0004.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint c
    JOIN pg_attribute a
      ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'leaderboard_entries'::regclass
      AND c.contype = 'c'
      AND a.attname = 'difficulty'
      AND cardinality(c.conkey) = 1
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT leaderboard_entries_difficulty_check
      CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster'));
  END IF;
END
$$;

ALTER TABLE leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_skill_rating_range;

ALTER TABLE leaderboard_entries
  DROP COLUMN IF EXISTS daily_day;

ALTER TABLE leaderboard_entries
  DROP COLUMN IF EXISTS skill_rating;
