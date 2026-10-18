-- 0006: only the server writes leaderboard_entries
--
-- Before this migration the anon key could insert any row straight into
-- leaderboard_entries through PostgREST. The policy "Allow public insert" let
-- it, and anon and authenticated held every table privilege. The API route's
-- rate limit, name rules, piece counts and time floors could all be skipped.
-- TRUNCATE was open as well.
--
-- After it, anon and authenticated may read the table and may write none of
-- it. The site writes through service_role, which bypasses row level security
-- and keeps its grants. Three checks hold every new row to the board's piece
-- count, a quarter second per piece to rebuild, and at most 60 seconds of
-- study. They are NOT VALID, so rows stored before 0006 stay as they are.
--
-- Every statement converges, so running this file a second time is a no-op.
-- Runbook: docs/migrations/2026-10-leaderboard-write-lockdown.md
-- Rehearsal: schema/__tests__/leaderboardWriteLockdown.test.ts

BEGIN;

-- Each statement below waits for a lock on leaderboard_entries, and every
-- leaderboard read queues behind that wait. Give up after five seconds rather
-- than stall the site. LOCAL ends with this transaction, so a pooled
-- connection does not keep it.
SET LOCAL lock_timeout = '5s';

DROP POLICY IF EXISTS "Allow public insert" ON public.leaderboard_entries;

-- Row level security does not gate TRUNCATE. The revoke does. SELECT stays,
-- and service_role keeps every privilege it holds.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, TRIGGER, REFERENCES
  ON public.leaderboard_entries FROM anon, authenticated;

-- The pieces on each board come from the presets in
-- src/lib/game/configPrefill.ts. A daily board takes its day's piece count,
-- which lives in code, so the table cannot pin it.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_board_piece_count'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT check_board_piece_count
      CHECK (
        difficulty = 'daily'
        OR (difficulty = 'easy' AND piece_count = 2)
        OR (difficulty = 'medium' AND piece_count = 6)
        OR (difficulty = 'hard' AND piece_count = 12)
        OR (difficulty = 'grandmaster' AND piece_count = 20)
      )
      NOT VALID;
  END IF;
END
$$;

-- SECONDS_PER_PIECE in src/app/api/leaderboard/route.ts. Six rows in
-- production break it and are kept, which is why the check is NOT VALID.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_solution_time_per_piece'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT check_solution_time_per_piece
      CHECK (solution_time >= piece_count * 0.25)
      NOT VALID;
  END IF;
END
$$;

-- MEMORIZE_SECONDS_RANGE.max in src/lib/reference/facts.ts. A player may end
-- study early, so the only lower bound is the existing memorize_time > 0.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_memorize_time_longest'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT check_memorize_time_longest
      CHECK (memorize_time <= 60)
      NOT VALID;
  END IF;
END
$$;

-- PostgREST caches what each role may do. The notice is sent at COMMIT.
NOTIFY pgrst, 'reload schema';

COMMIT;
