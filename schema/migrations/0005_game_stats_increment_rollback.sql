-- 0005 rollback: restore increment_metric and game_stats as they were before 0005
--
-- This puts back the broken state on purpose. From the anon key every call to
-- increment_metric fails again, the site falls back to a read and a write,
-- and any visitor may again set total_plays to any number. Nothing is
-- deleted. The play count is kept.
--
-- Safe to run twice, and safe to run on a database that never had 0005.
-- Runbook: docs/migrations/2026-10-game-stats-increment.md

BEGIN;

SET LOCAL lock_timeout = '5s';

-- The body schema/game_stats_schema.sql carried before 0005. Pre-check 3 in the
-- runbook confirms production holds the same text. CREATE OR REPLACE also
-- resets the function to SECURITY INVOKER with no search_path, as it was.
CREATE OR REPLACE FUNCTION increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  -- Insert the metric if it doesn't exist, otherwise update it
  INSERT INTO game_stats (metric_name, metric_value, last_updated)
  VALUES (p_metric_name, p_increment, NOW())
  ON CONFLICT (metric_name)
  DO UPDATE SET
    metric_value = game_stats.metric_value + p_increment,
    last_updated = NOW()
  RETURNING metric_value INTO v_new_value;

  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql;

GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) TO PUBLIC, anon, authenticated;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'game_stats'
      AND policyname = 'Allow public increment'
  ) THEN
    CREATE POLICY "Allow public increment"
      ON public.game_stats
      FOR UPDATE
      TO public
      USING (true);
  END IF;
END
$$;

-- The seven privileges production granted, named one by one. GRANT ALL would
-- also grant MAINTAIN on PostgreSQL 17 and later.
GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
  ON public.game_stats TO anon, authenticated;

NOTIFY pgrst, 'reload schema';

COMMIT;
