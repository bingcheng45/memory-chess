-- 0010: only the server runs the two counter functions
--
-- increment_metric and record_article_event are SECURITY DEFINER, and 0005 and
-- 0002 let anon and authenticated execute them. Anyone with the public anon key
-- can therefore call them straight through PostgREST, past the site's routes
-- and their limits, and move total_plays and the article counts to any size.
--
-- After it, only service_role may execute them. The site calls them from its
-- API routes with SUPABASE_SERVICE_ROLE_KEY. anon and authenticated may still
-- read game_stats and article_stats.
--
-- Apply it only after the key is set in Vercel Production, production is
-- redeployed, and a round has been seen to move total_plays. Until then the
-- site calls the functions with the anon key, and this file stops every count.
--
-- Every statement converges, so running this file a second time is a no-op.
-- Runbook: docs/migrations/2026-10-revoke-counter-rpcs.md
-- Rehearsal: schema/__tests__/revokeCounterRpcs.test.ts

BEGIN;

SET LOCAL lock_timeout = '5s';

-- Supabase hands anon and authenticated EXECUTE on every new function through
-- default privileges, so they hold direct grants that a revoke from PUBLIC
-- does not remove.
REVOKE EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) TO service_role;

REVOKE EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) TO service_role;

-- PostgREST caches function definitions. The notice is sent at COMMIT.
NOTIFY pgrst, 'reload schema';

COMMIT;
