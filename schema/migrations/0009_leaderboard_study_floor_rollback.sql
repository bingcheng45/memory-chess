-- 0009 rollback: drop check_memorize_time_floor
--
-- Drops only the check. The API route keeps refusing a sub-floor row, and the
-- board reads keep hiding old ones, until the PR that added them is reverted.
-- Safe to run twice, and safe to run on a database that never had 0009.
-- Runbook: docs/migrations/2026-10-leaderboard-study-floor.md

BEGIN;

SET LOCAL lock_timeout = '5s';

ALTER TABLE public.leaderboard_entries
  DROP CONSTRAINT IF EXISTS check_memorize_time_floor;

COMMIT;
