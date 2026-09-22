-- 0001 rollback: remove leaderboard_entries.country_code
--
-- Destructive. Dropping the column discards every value in it, including real
-- country codes written by app code that ran between apply and rollback. See
-- docs/migrations/2026-09-leaderboard-country-code.md before running this.
--
-- Safe to run twice, and safe to run against a partially applied migration.

-- DROP COLUMN would take the constraint with it. Dropping it first also covers
-- the case where the column was already dropped but the constraint survived a
-- hand-edited apply.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_country_code_format'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      DROP CONSTRAINT check_country_code_format;
  END IF;
END
$$;

ALTER TABLE leaderboard_entries
  DROP COLUMN IF EXISTS country_code;
