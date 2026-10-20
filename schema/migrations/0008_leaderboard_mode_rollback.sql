-- 0008 rollback: drop leaderboard_entries.mode
--
-- Refuses while any blindfold row is stored: dropping the column would file
-- those scores on the board-study boards. Export or delete them first.
-- Turn NEXT_PUBLIC_BLINDFOLD_LEADERBOARD off and redeploy before running this.
-- Safe to run twice, and safe to run on a database that never had 0008.
-- Runbook: docs/migrations/2026-10-leaderboard-blindfold-mode.md

BEGIN;

SET LOCAL lock_timeout = '5s';

LOCK TABLE public.leaderboard_entries IN ACCESS EXCLUSIVE MODE;

-- The row check is dynamic: a static reference to mode would fail to plan on a
-- table that never had the column.
DO $$
DECLARE
  blindfold_rows BOOLEAN := false;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'leaderboard_entries'
      AND column_name = 'mode'
  ) THEN
    EXECUTE 'SELECT EXISTS (SELECT 1 FROM public.leaderboard_entries WHERE mode <> ''board'')' INTO blindfold_rows;
  END IF;
  IF blindfold_rows THEN
    RAISE EXCEPTION 'leaderboard_entries holds blindfold rows; export or delete them before rolling back 0008';
  END IF;
END
$$;

DROP INDEX IF EXISTS public.idx_leaderboard_blindfold_ranking;

ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_daily_board_mode;

ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_mode_known;

ALTER TABLE public.leaderboard_entries
  DROP COLUMN IF EXISTS mode;

NOTIFY pgrst, 'reload schema';

COMMIT;
