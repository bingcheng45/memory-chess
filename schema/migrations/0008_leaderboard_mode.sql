-- 0008: a mode column, so blindfold rounds rank on boards of their own
--
-- A blindfold round studies the position as notation over an empty board. Its
-- scores are not comparable with board-study rounds, so each ranked board is
-- read per mode. Every row already in the table is a board-study round and
-- reads 'board'. The daily board is always played on the board.
--
-- The site reads and writes the column only once NEXT_PUBLIC_BLINDFOLD_LEADERBOARD
-- is set to 1, after this has run. Every statement converges, so running this
-- file a second time is a no-op.
-- Runbook: docs/migrations/2026-10-leaderboard-blindfold-mode.md
-- Rehearsal: schema/__tests__/leaderboardMode.test.ts

BEGIN;

-- Each statement below waits for a lock on leaderboard_entries, and every
-- leaderboard read queues behind that wait. Give up after five seconds rather
-- than stall the site. LOCAL ends with this transaction.
SET LOCAL lock_timeout = '5s';

-- A constant default is stored in the catalog, so this does not rewrite the table.
ALTER TABLE public.leaderboard_entries
  ADD COLUMN IF NOT EXISTS mode TEXT NOT NULL DEFAULT 'board';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_mode_known'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT check_mode_known
      CHECK (mode IN ('board', 'blindfold'));
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_daily_board_mode'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT check_daily_board_mode
      CHECK (difficulty <> 'daily' OR mode = 'board');
  END IF;
END
$$;

-- Column order follows RANKING_ORDER in src/lib/leaderboard/ranking.ts after
-- the difficulty, so one blindfold board reads straight off the index.
CREATE INDEX IF NOT EXISTS idx_leaderboard_blindfold_ranking
  ON public.leaderboard_entries (
    difficulty,
    correct_pieces DESC,
    total_wrong_pieces ASC NULLS LAST,
    memorize_time ASC,
    solution_time ASC
  )
  WHERE mode = 'blindfold';

-- PostgREST caches the table's columns. The notice is sent at COMMIT.
NOTIFY pgrst, 'reload schema';

COMMIT;
