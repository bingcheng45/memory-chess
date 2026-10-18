-- 0007 rollback: remove the server error log
--
-- This deletes every logged error with the table. Read or export what you
-- need first. The site keeps working: a report that cannot be stored is
-- logged to the console and dropped.
--
-- Safe to run twice, and safe on a database that never had 0007.
-- Runbook: docs/migrations/2026-10-server-errors.md

BEGIN;

SET LOCAL lock_timeout = '5s';

DROP TABLE IF EXISTS public.server_errors;

NOTIFY pgrst, 'reload schema';

COMMIT;
