-- 0002: add article_stats and record_article_event
--
-- One row per article holds its view count and its like count. Anyone may
-- read the counts. Nobody may write the table directly: the site talks to
-- Supabase with the anon key only, so a writable table would let any visitor
-- set any number. record_article_event is the one write path, and each call
-- moves one count by one.
--
-- Every statement is guarded, so running this file a second time is a no-op
-- rather than an error, and it keeps the counts written in between.
-- Runbook: docs/migrations/2026-10-article-stats.md
-- Rehearsal: schema/__tests__/articleStats.test.ts

CREATE TABLE IF NOT EXISTS public.article_stats (
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

-- CREATE POLICY has no IF NOT EXISTS, so the guard has to be explicit.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'article_stats'
      AND policyname = 'article_stats_public_read'
  ) THEN
    CREATE POLICY article_stats_public_read
      ON public.article_stats
      FOR SELECT
      TO anon, authenticated
      USING (true);
  END IF;
END
$$;

-- Supabase grants anon and authenticated every privilege on a new table in
-- public. Row level security gates INSERT, UPDATE and DELETE, but it does not
-- gate TRUNCATE, so this revoke is the only thing that stops anon from
-- emptying the table.
REVOKE ALL ON public.article_stats FROM anon, authenticated;
GRANT SELECT ON public.article_stats TO anon, authenticated;

-- SECURITY DEFINER runs the function as its owner, who owns the table, so it
-- can write where its caller cannot. The empty search_path and the
-- schema-qualified names keep a caller from pointing it at another table.
-- greatest() is grammar, not a function, so it has no schema to name.
CREATE OR REPLACE FUNCTION public.record_article_event(p_slug TEXT, p_event TEXT)
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

-- A new function is executable by PUBLIC, which includes every role.
REVOKE EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) TO anon, authenticated;
