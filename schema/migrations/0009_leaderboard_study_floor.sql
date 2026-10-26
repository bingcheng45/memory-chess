-- 0009: a study-time floor on leaderboard_entries
--
-- The ranking breaks ties on study time, so a row that studied for a fraction
-- of a second outranks every honest row with the same score. The API route now
-- refuses a ranked row that studied less than max(0.3, 0.1 per piece) seconds
-- and the board reads hide such rows. This check holds the table to the same
-- floor for every new row and every update.
--
-- It is NOT VALID, so rows stored before 0009 stay as they are. The board
-- reads filter them out; nothing is deleted. The migration does not validate
-- the check.
--
-- Apply it after 0006, which this file sits beside: both are NOT VALID checks
-- on the same table, and the runbook counts the old rows against both.
-- Every statement converges, so running this file a second time is a no-op.
-- Runbook: docs/migrations/2026-10-leaderboard-study-floor.md
-- Rehearsal: schema/__tests__/leaderboardStudyFloor.test.ts

BEGIN;

-- Each statement below waits for a lock on leaderboard_entries, and every
-- leaderboard read queues behind that wait. Give up after five seconds rather
-- than stall the site. LOCAL ends with this transaction.
SET LOCAL lock_timeout = '5s';

-- studyFloorSeconds in src/lib/leaderboard/studyFloor.ts. piece_count is an
-- integer, so piece_count * 0.1 is exact numeric.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_memorize_time_floor'
      AND conrelid = 'public.leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE public.leaderboard_entries
      ADD CONSTRAINT check_memorize_time_floor
      CHECK (memorize_time >= GREATEST(0.3, piece_count * 0.1))
      NOT VALID;
  END IF;
END
$$;

COMMIT;
