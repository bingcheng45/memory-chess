-- Article view and like counts for Memory Chess
--
-- This file describes the end state that schema/migrations/0002_article_stats.sql
-- produces. schema/__tests__/articleStats.test.ts applies both to a fresh
-- database and fails if they differ. To change the live database, write a
-- migration. Use this file to rebuild the table from nothing.
--
-- anon and authenticated may read every row and may write none. The only
-- write path is record_article_event, which moves one count by one.

CREATE TABLE public.article_stats (
  slug TEXT PRIMARY KEY,
  views BIGINT NOT NULL DEFAULT 0,
  likes BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT article_stats_slug_format
    CHECK (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$' AND char_length(slug) <= 80),
  CONSTRAINT article_stats_views_not_negative CHECK (views >= 0),
  CONSTRAINT article_stats_likes_not_negative CHECK (likes >= 0)
);

ALTER TABLE public.article_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY article_stats_public_read
  ON public.article_stats
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Row level security does not gate TRUNCATE. The revoke does.
REVOKE ALL ON public.article_stats FROM anon, authenticated;
GRANT SELECT ON public.article_stats TO anon, authenticated;

CREATE FUNCTION public.record_article_event(p_slug TEXT, p_event TEXT)
RETURNS TABLE (views BIGINT, likes BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
#variable_conflict use_column
BEGIN
  IF p_slug IS NULL
    OR pg_catalog.char_length(p_slug) > 80
    OR p_slug !~ '^[a-z0-9]+(-[a-z0-9]+)*$'
  THEN
    RAISE EXCEPTION 'invalid article slug' USING ERRCODE = '22023';
  END IF;

  IF p_event IS NULL OR p_event NOT IN ('view', 'like', 'unlike') THEN
    RAISE EXCEPTION 'invalid article event' USING ERRCODE = '22023';
  END IF;

  RETURN QUERY
  INSERT INTO public.article_stats AS stats (slug, views, likes)
  VALUES (p_slug, (p_event = 'view')::INT, (p_event = 'like')::INT)
  ON CONFLICT (slug) DO UPDATE SET
    views = stats.views + (p_event = 'view')::INT,
    likes = greatest(
      0,
      stats.likes + CASE p_event WHEN 'like' THEN 1 WHEN 'unlike' THEN -1 ELSE 0 END
    ),
    updated_at = pg_catalog.now()
  RETURNING stats.views, stats.likes;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) TO anon, authenticated;
