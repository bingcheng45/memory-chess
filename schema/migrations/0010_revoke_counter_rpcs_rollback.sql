-- 0010 rollback: let anon and authenticated execute the two counter functions again
--
-- This puts back the hole on purpose. Anyone with the anon key may again call
-- increment_metric and record_article_event past the site's routes. Nothing is
-- deleted. Every count is kept.
--
-- Safe to run twice, and safe to run on a database that never had 0010.
-- Runbook: docs/migrations/2026-10-revoke-counter-rpcs.md

BEGIN;

SET LOCAL lock_timeout = '5s';

REVOKE EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.increment_metric(TEXT, BIGINT) TO anon, authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) TO anon, authenticated, service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
