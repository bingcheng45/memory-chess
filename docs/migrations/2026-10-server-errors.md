# Runbook: add `server_errors`, a durable log of API failures

Migration 0007 adds one table, `public.server_errors`.

Vercel Hobby keeps runtime logs for about an hour. When an API route fails, its `console.error` line is gone by the next morning, and the failure cannot be investigated. From this change on, each route that logs a server error also stores one short row in `server_errors`:

- `created_at`, when the error happened.
- `route`, where it happened. The values are listed in step 5.
- `kind`, one of `unavailable` (the database or the sheet could not be reached or is not configured), `failed` (it answered with an error) and `unexpected` (the route threw).
- `message`, the error's own message, at most 500 characters. Keys, JWTs, bearer tokens, emails, IP addresses and URL query strings are replaced with `[key]`, `[jwt]`, `[token]`, `[email]`, `[ip]` and `[query]` before it is stored.
- `detail`, a small JSON object. It holds the error's `code` and `name` when it has them, and for some routes the board (`board`) or the article (`slug`).
- `deploy`, the commit of the deploy that logged it, from `VERCEL_GIT_COMMIT_SHA`.

A client's own mistake, such as a body that is not JSON or a field that fails validation, is answered with a 400 and stores no row. Only a failure on the server's side is stored.

No row holds a request body, a player name, an email, an IP address or a key. A Supabase error's `details` and `hint` are never stored, because Postgres puts the failing row, with the player's name, in `details`.

Only `service_role` may touch the table, and it may only insert and read. It cannot update, delete or truncate, so the server cannot rewrite its own log. `anon` and `authenticated` hold no privilege on the table or on its id sequence. Row level security is on with no policy, so a grant added later by mistake still shows them no row.

The migration touches no existing table and no existing row. It needs no backup.

You will run SQL through a tool that takes one statement and returns its rows, such as the Supabase SQL editor. Work top to bottom.

## How to read a check

Every check in steps 2 and 4 is one statement. Run the checks one at a time, in order.

Under each check is the exact answer to expect. Rows are printed as JSON, one row to a line. An answer that starts with `ERROR:` is the error code and the error message, and a tool may print a `CONTEXT` line under it.

Compare the whole answer, not only the error code. `P0001` is the passing answer of check 7 in step 4, and `42501` is the passing answer of checks 5, 6 and 8.

An answer other than the printed one is a failure. On a failure, stop. Before the migration, a failure means production no longer matches this runbook, so do not run it. After the migration has run, roll back with step 7.

**An open transaction.** An answer of `25P02` means the tool kept one transaction open, and the error that an earlier check raises on purpose aborted it. Run `ROLLBACK`, then repeat the check.

**No row is left behind.** Every check that writes ends in an error, and the error undoes the write.

**When the tool cannot switch roles.** Checks 5 to 8 in step 4 switch to `anon` or `service_role` with `SET LOCAL ROLE`. The Supabase SQL editor runs as `postgres`, which may switch to both. A tool that connects as another user answers `ERROR: 42501: permission denied to set role "anon"`. That answer says nothing about the table. Run those checks with `psql` and the `postgres` connection string from Supabase project settings, under Database.

## What the rehearsal proves, and what it does not

`schema/__tests__/serverErrors.test.ts` builds a Supabase-like database in an in-process Postgres, with Supabase's default privileges, applies `schema/migrations/0007_server_errors.sql`, and checks the table. `schema/__tests__/serverErrorsRunbook.test.ts` reads every check out of this file and runs it on that database. From the main checkout, run:

```bash
npx jest schema/__tests__/serverErrors
```

From a worktree under `.claude/`, add `--testPathIgnorePatterns=/node_modules/`.

The rehearsal proves these points:

- `anon` and `authenticated` each get `42501` for a select, an insert, an update, a delete, a truncate and a `nextval` on the id sequence.
- With a select and insert grant added to `anon` by mistake, `anon` reads no row and still cannot insert.
- `service_role` can insert a row and read it back, and gets `42501` for an update, a delete and a truncate.
- A message of 501 characters and a detail over 2 kB are refused. A message of 500 characters is stored.
- A read of the newest rows uses the index on `created_at`.
- A second run of the migration is a no-op. The rollback removes the table and its sequence, is safe to run twice and on a database that never had 0007, and the migration then lands in the same state again.
- Every check in steps 2 and 4 is one statement and gives exactly the answer printed under it. The queries in steps 5 and 6 run.

`src/lib/server/__tests__/serverErrors.test.ts` and `src/app/api/__tests__/serverErrorReports.test.ts` prove the app side: one redacted row for each failure, through the `service_role` key only, nothing when the key is missing, is the anon key or is not a JWT, no throw when the database is down, at most 20 rows a minute for each route from one server instance, and no row for a client's own mistake.

The rehearsal does not prove these points:

- Behaviour on PostgreSQL 15, which production runs. The rehearsal runs PGlite, which is PostgreSQL 18. Step 4 repeats the role checks on production for that reason.
- That the deployed site holds the `service_role` key. Step 1 checks that.

## 1. Before you start: the `service_role` key

The site writes `server_errors` with `SUPABASE_SERVICE_ROLE_KEY` and nothing else. When that variable is missing, holds the anon key, or holds a value that is not the legacy `service_role` JWT, the site stores no row and says nothing about it. It never falls back to the anon key for this table.

The leaderboard needs the same variable. Follow step 1 of `docs/migrations/2026-10-leaderboard-write-lockdown.md`, items 2 to 5, if you have not already. That step sets the variable, redeploys, and confirms in the Vercel runtime logs that no `SUPABASE_SERVICE_ROLE_KEY ...` line appears.

The migration and the deploy can come in either order. Until both are done, nothing is stored. A deploy that runs before the migration logs one extra line for each error it tries to store, starting `Server error report not stored:` and naming the missing table, and otherwise behaves as before.

## 2. Pre-checks

1. The table does not exist yet.

    ```sql
    SELECT to_regclass('public.server_errors') IS NULL AS table_absent;
    ```

    ```text
    {"table_absent":true}
    ```

2. `service_role` exists and bypasses row level security. The site writes with this role.

    ```sql
    SELECT rolname, rolbypassrls FROM pg_roles WHERE rolname = 'service_role';
    ```

    ```text
    {"rolname":"service_role","rolbypassrls":true}
    ```

## 3. Apply

Paste the whole of `schema/migrations/0007_server_errors.sql` into the SQL editor and run it once. The file opens with `BEGIN` and ends with `COMMIT`, so it applies all or nothing. With `psql`, run it with `-f`.

The first run creates a new table, so it waits on no lock that site traffic holds. A later run waits at most five seconds for a lock on the table, then stops with `canceling statement due to lock timeout` and changes nothing. Run it again. It ends by asking PostgREST to reload its schema cache, so the site can store rows at once.

## 4. Verify

1. Row level security is on, and no policy exists.

    ```sql
    SELECT
      relrowsecurity AS row_security,
      (SELECT count(*)::int FROM pg_policies WHERE schemaname = 'public' AND tablename = 'server_errors') AS policies
    FROM pg_class
    WHERE oid = 'public.server_errors'::regclass;
    ```

    ```text
    {"row_security":true,"policies":0}
    ```

2. Only `service_role` holds a table privilege, and only these two. Any other row is a wrong grant.

    ```sql
    SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'server_errors'
      AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
    GROUP BY grantee
    ORDER BY grantee;
    ```

    ```text
    {"grantee":"service_role","privileges":"INSERT,SELECT"}
    ```

3. Neither web role may touch the table or its id sequence, by a direct grant, through `PUBLIC` or through another role.

    ```sql
    SELECT
      has_table_privilege('anon', 'public.server_errors', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS anon_table,
      has_table_privilege('authenticated', 'public.server_errors', 'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_table,
      has_sequence_privilege('anon', 'public.server_errors_id_seq', 'USAGE,SELECT,UPDATE') AS anon_sequence,
      has_sequence_privilege('authenticated', 'public.server_errors_id_seq', 'USAGE,SELECT,UPDATE') AS authenticated_sequence;
    ```

    ```text
    {"anon_table":false,"authenticated_table":false,"anon_sequence":false,"authenticated_sequence":false}
    ```

4. The index on `created_at` exists.

    ```sql
    SELECT indexdef FROM pg_indexes WHERE schemaname = 'public' AND indexname = 'server_errors_created_at_idx';
    ```

    ```text
    {"indexdef":"CREATE INDEX server_errors_created_at_idx ON public.server_errors USING btree (created_at)"}
    ```

5. As `anon`, an insert is refused. An answer of `P0001` means the insert went through, which is a failure. The error still undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      INSERT INTO public.server_errors (route, kind, message) VALUES ('runbook', 'failed', 'runbook check');
      RAISE EXCEPTION 'anon stored the row';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table server_errors
    ```

6. As `anon`, a read is refused.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM 1 FROM public.server_errors;
      RAISE EXCEPTION 'anon read the log';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table server_errors
    ```

7. As `service_role`, an insert is stored. The error at the end undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE service_role;
      INSERT INTO public.server_errors (route, kind, message, detail, deploy)
      VALUES ('runbook', 'failed', 'runbook check', '{"code":"RUNBOOK"}', 'runbook');
      RAISE EXCEPTION 'service_role stored the row';
    END
    $$;
    ```

    ```text
    ERROR: P0001: service_role stored the row
    ```

8. As `service_role`, a delete is refused. `WHERE false` keeps it from touching a row even if it were allowed.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE service_role;
      DELETE FROM public.server_errors WHERE false;
      RAISE EXCEPTION 'service_role was allowed to delete';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table server_errors
    ```

The table stays empty until a route fails. An empty table on a quiet day is the expected state.

## 5. Read the log

Run these in the SQL editor whenever you investigate a failure. They only read.

The last day's errors, newest first:

```sql
SELECT created_at, route, kind, message, detail, deploy
FROM public.server_errors
WHERE created_at > now() - interval '1 day'
ORDER BY created_at DESC
LIMIT 100;
```

A week's errors, counted by route and kind:

```sql
SELECT route, kind, count(*)::int AS errors, min(created_at) AS first_seen, max(created_at) AS last_seen
FROM public.server_errors
WHERE created_at > now() - interval '7 days'
GROUP BY route, kind
ORDER BY errors DESC;
```

The values of `route`:

- `leaderboard read`, a board read for `GET /api/leaderboard` or for the `/leaderboard` page.
- `GET /api/leaderboard`, the board route threw.
- `POST /api/leaderboard`, a score submission.
- `GET /api/leaderboard/rank`, a standing check after a score.
- `POST /api/feedback`, the feedback sheet write.
- `POST /api/contact`, the contact sheet write.
- `GET /api/game-stats` and `POST /api/game-stats`, the play counter.
- `POST /api/articles/stats`, an article view or like.

Each server instance stores at most 20 rows a minute for each route, so a flood of failures on one route never hides a failure on another. In an outage every request fails, so the table shows the outage's start, its end and its message, not every failed request. The Vercel runtime log, while it lasts, still has every line.

## 6. Retention: keep 30 days

The table is not pruned automatically. Run this once a month, or whenever the table grows. It runs as `postgres` in the SQL editor. `service_role` cannot delete.

```sql
DELETE FROM public.server_errors WHERE created_at < now() - interval '30 days';
```

To run it every night instead, enable the `pg_cron` extension in the Supabase dashboard (Database, then Extensions) and schedule the same statement once:

```sql
SELECT cron.schedule('server-errors-retention', '17 3 * * *', $$DELETE FROM public.server_errors WHERE created_at < now() - interval '30 days'$$);
```

Enabling `pg_cron` changes the project's settings. It is optional.

## 7. Rollback

Paste `schema/migrations/0007_server_errors_rollback.sql` and run it. It is safe to run twice, and safe on a database that never had 0007. Then run the checks in step 2 again. Each gives its printed answer.

The rollback drops the table and every logged error with it. Read or export what you need first.

The site keeps working without the table. Each error it tries to store then logs one extra line, `Server error report not stored: ...`, and nothing else changes.

## 8. Known limits

- A sustained outage stores at most 20 rows a minute for each failing route on each server instance, which is 28,800 rows a day for each route on one instance. The retention delete in step 6 keeps that in check.
- The limit counts per server instance, and each new instance starts its own count.
- An error that happens while its route is out of its 20 rows for the minute is in the Vercel runtime log only.
- A row is written after the response is sent. If the database is down, the write gives up after 2 seconds and logs `Server error report not stored: ...`.
- Redaction matches patterns. A secret in a shape it does not know, such as a short password inside an error message, would be stored as written. No route passes one today.
