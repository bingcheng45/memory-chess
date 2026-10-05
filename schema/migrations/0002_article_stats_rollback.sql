-- 0002 rollback: remove article_stats and record_article_event
--
-- Destructive. Dropping the table discards every view count and like count.
-- Export the table first if the numbers matter. See
-- docs/migrations/2026-10-article-stats.md before running this.
--
-- Safe to run twice, and safe to run against a partially applied migration.
-- The policy and the grants go with the table.

DROP FUNCTION IF EXISTS public.record_article_event(TEXT, TEXT);

DROP TABLE IF EXISTS public.article_stats;
