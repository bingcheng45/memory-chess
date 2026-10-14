-- Game statistics for Memory Chess
--
-- This file describes the end state that schema/migrations/0005_game_stats_increment.sql
-- produces. schema/__tests__/gameStats.test.ts applies both and fails if they
-- differ. To change the live database, write a migration. Use this file to
-- rebuild the table from nothing.
--
-- anon and authenticated may read every row and may write none. The only
-- write path is increment_metric, which adds one to total_plays.

CREATE TABLE public.game_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  metric_name TEXT NOT NULL UNIQUE,
  metric_value BIGINT NOT NULL DEFAULT 0,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_game_stats_metric_name ON public.game_stats (metric_name);

INSERT INTO public.game_stats (metric_name, metric_value) VALUES ('total_plays', 0);

ALTER TABLE public.game_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read"
  ON public.game_stats
  FOR SELECT
  TO public
  USING (true);

-- Row level security does not gate TRUNCATE. The revoke does.
REVOKE ALL ON public.game_stats FROM anon, authenticated;
GRANT SELECT ON public.game_stats TO anon, authenticated;

CREATE FUNCTION public.increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
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
