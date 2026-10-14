-- 0005: make increment_metric the only write path to game_stats
--
-- Before this migration every call to increment_metric from the anon key
-- failed: the function ran as its caller, and its upsert needs an INSERT
-- policy that game_stats does not have. The site then fell back to a read
-- and a write, which loses counts under concurrency. The UPDATE policy that
-- fallback relied on also let any visitor set total_plays to any number.
--
-- After it, increment_metric runs as its owner and adds exactly one to
-- total_plays. anon and authenticated may read the table and may write none.
--
-- Every statement converges, so running this file a second time is a no-op.
-- Runbook: docs/migrations/2026-10-game-stats-increment.md
-- Rehearsal: schema/__tests__/gameStats.test.ts

BEGIN;

-- Dropping the policy and changing the grants wait for a lock on game_stats,
-- and every round's increment queues behind that wait. Give up after five
-- seconds rather than stall the site. LOCAL ends with this
-- transaction, so a pooled connection does not keep it.
SET LOCAL lock_timeout = '5s';

-- SECURITY DEFINER runs the function as its owner, who owns the table, so it
-- can write where its caller cannot. The empty search_path and the
-- schema-qualified names keep a caller from pointing it at another table.
-- The insert only runs if the row is missing, and its ON CONFLICT covers two
-- first calls at the same moment.
CREATE OR REPLACE FUNCTION public.increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  IF p_metric_name IS DISTINCT FROM 'total_plays' THEN
    RAISE EXCEPTION 'invalid metric' USING ERRCODE = '22023';
  END IF;

  IF p_increment IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'invalid increment' USING ERRCODE = '22023';
  END IF;

  UPDATE public.game_stats
  SET metric_value = metric_value + 1,
      last_updated = pg_catalog.now()
  WHERE metric_name = p_metric_name
  RETURNING metric_value INTO v_new_value;

  IF NOT FOUND THEN
    INSERT INTO public.game_stats AS stats (metric_name, metric_value, last_updated)
    VALUES (p_metric_name, 1, pg_catalog.now())
    ON CONFLICT (metric_name) DO UPDATE SET
      metric_value = stats.metric_value + 1,
      last_updated = pg_catalog.now()
    RETURNING stats.metric_value INTO v_new_value;
  END IF;

  RETURN v_new_value;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) TO anon, authenticated;

DROP POLICY IF EXISTS "Allow public increment" ON public.game_stats;

-- Row level security does not gate TRUNCATE. The revoke does.
REVOKE ALL ON public.game_stats FROM anon, authenticated;
GRANT SELECT ON public.game_stats TO anon, authenticated;

-- PostgREST caches function definitions. The notice is sent at COMMIT.
NOTIFY pgrst, 'reload schema';

COMMIT;
