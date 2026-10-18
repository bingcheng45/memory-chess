-- 0007: a durable log of the API routes' server errors
--
-- Vercel Hobby keeps runtime logs for about an hour, so an API failure from
-- yesterday leaves no trace. The routes now also write one row here for
-- each error they log.
--
-- service_role may insert and read, and nothing else, so the server cannot
-- rewrite or erase the log. anon and authenticated hold no privilege on the
-- table or its id sequence, and row level security is on with no policy, so
-- a grant added by mistake still shows them nothing.
--
-- The table is not pruned automatically. The runbook gives the delete that
-- keeps 30 days.
--
-- Every statement converges, so running this file a second time is a no-op.
-- Runbook: docs/migrations/2026-10-server-errors.md
-- Rehearsal: schema/__tests__/serverErrors.test.ts

BEGIN;

-- Running this again revokes and grants on a live table, and every error
-- report queues behind that wait for its lock. Give up after five seconds
-- rather than stall the routes. LOCAL ends with this transaction, so a pooled
-- connection does not keep it.
SET LOCAL lock_timeout = '5s';

CREATE TABLE IF NOT EXISTS public.server_errors (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  route TEXT NOT NULL CONSTRAINT server_errors_route_length CHECK (char_length(route) <= 100),
  kind TEXT NOT NULL CONSTRAINT server_errors_kind_length CHECK (char_length(kind) <= 40),
  message TEXT NOT NULL CONSTRAINT server_errors_message_length CHECK (char_length(message) <= 500),
  detail JSONB CONSTRAINT server_errors_detail_size CHECK (pg_column_size(detail) <= 2048),
  deploy TEXT CONSTRAINT server_errors_deploy_length CHECK (char_length(deploy) <= 64)
);

CREATE INDEX IF NOT EXISTS server_errors_created_at_idx ON public.server_errors (created_at);

ALTER TABLE public.server_errors ENABLE ROW LEVEL SECURITY;

-- Supabase's default privileges grant every new table and sequence in public
-- to anon, authenticated and service_role. Revoke the table from all three
-- and the sequence from anon and authenticated, then grant service_role the
-- two it needs.
REVOKE ALL ON public.server_errors FROM anon, authenticated, service_role, PUBLIC;
REVOKE ALL ON SEQUENCE public.server_errors_id_seq FROM anon, authenticated, PUBLIC;

GRANT SELECT, INSERT ON public.server_errors TO service_role;

NOTIFY pgrst, 'reload schema';

COMMIT;
