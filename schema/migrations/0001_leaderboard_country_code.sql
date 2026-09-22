-- 0001: add leaderboard_entries.country_code
--
-- Every statement is guarded, so running this file a second time is a no-op
-- rather than an error. The owner applies it by hand in the Supabase SQL
-- editor, where a half-finished paste and a re-run are both likely.
-- Runbook: docs/migrations/2026-09-leaderboard-country-code.md
--
-- 'ZZ' is CLDR's unknown region. Existing rows take it as their default, so
-- the column needs no nullable state and no separate "unset" flag.
--
-- Deliberately no index on country_code. getLeaderboard() filters on
-- difficulty and correct_pieces and orders by the four score columns;
-- country_code is only ever read back as part of a row it already selected.
-- An index here would serve no query and slow every insert.

ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'ZZ';

-- ADD CONSTRAINT has no IF NOT EXISTS, so the guard has to be explicit.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_country_code_format'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT check_country_code_format
      CHECK (country_code ~ '^[A-Z]{2}$');
  END IF;
END
$$;
