-- 0006 rollback: restore leaderboard_entries' policies and grants as they were before 0006
--
-- This puts back the hole on purpose. The anon key may again insert any row
-- straight into the table, past the API route, and may again truncate it.
-- Nothing is deleted. Every row stored while 0006 held is kept.
--
-- Safe to run twice, and safe to run on a database that never had 0006.
-- Runbook: docs/migrations/2026-10-leaderboard-write-lockdown.md

BEGIN;

SET LOCAL lock_timeout = '5s';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'leaderboard_entries'
      AND policyname = 'Allow public insert'
  ) THEN
    CREATE POLICY "Allow public insert"
      ON public.leaderboard_entries
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END
$$;

-- The seven privileges production granted, named one by one. GRANT ALL would
-- also grant MAINTAIN on PostgreSQL 17 and later.
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.leaderboard_entries TO anon, authenticated;

ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_board_piece_count;

ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_solution_time_per_piece;

ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_memorize_time_longest;

NOTIFY pgrst, 'reload schema';

COMMIT;
