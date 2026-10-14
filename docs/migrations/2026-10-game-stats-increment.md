# Runbook: make `increment_metric` the only write path to `game_stats`

Migration 0005 fixes the play counter and closes a hole in `public.game_stats`.

Today every call to `public.increment_metric` from the anon key fails with `42501`. The function runs as its caller, and its upsert needs an INSERT policy that the table does not have. The site then falls back to a read and a write. That fallback loses counts when two rounds end at once, and it logs an error on every round. The UPDATE policy it relies on also lets anyone with the anon key set `total_plays` to any number.

After 0005:

- `increment_metric(p_metric_name, p_increment)` keeps its signature and return type. It runs as its owner with an empty search path. It accepts only `'total_plays'` and an increment of exactly 1, and refuses anything else with `22023`. It adds one in a single `UPDATE`, and creates the row at 1 if the row is missing.
- Only `anon` and `authenticated` may run the function. `PUBLIC` may not.
- The policy "Allow public increment" is gone. "Allow public read" stays.
- `anon` and `authenticated` hold `SELECT` on the table and nothing else.

The migration deletes no row and keeps the count. It needs no backup.

You will run SQL through a tool that takes one statement and returns its rows, such as the Supabase SQL editor. Work top to bottom.

## How to read a check

Every check in steps 2 and 4 is one statement. Run the checks one at a time, in order.

Under each check is the exact answer to expect. Rows are printed as JSON, one row to a line. An answer that starts with `ERROR:` is the error code and the error message, and a tool may print a `CONTEXT` line under it.

Compare the whole answer, not only the error code. `42501` is the passing answer of pre-check 5, and it is a failure of check 6 in step 4.

An answer other than the printed one is a failure, with the two exceptions below. On a failure, stop. After the migration has run, roll back with step 5.

**An open transaction.** An answer of `25P02` means the tool kept one transaction open, and the error that an earlier check raises on purpose aborted it. Run `ROLLBACK`, then repeat the check.

**A visitor's round.** Check 6 in step 4 reads the count, adds one, and reads the difference. If a visitor's round lands between the read and the add, it prints `anon added 2 to total_plays`. Run it again. Two answers of 2 in a row are a failure.

## What the rehearsal proves, and what it does not

`schema/__tests__/gameStats.test.ts` builds the production state of 2026-10-14 in an in-process Postgres, applies `schema/migrations/0005_game_stats_increment.sql`, and checks the function, the policies and the grants. `schema/__tests__/gameStatsRunbook.test.ts` reads every check out of this file and runs it on that database. From a worktree under `.claude/`, run:

```bash
npx jest schema --testPathIgnorePatterns=/node_modules/
```

From the main checkout, run `npx jest schema`.

The rehearsal proves these points:

- Before the migration, `anon` cannot increment through the function and can set `total_plays` directly to any number.
- After it, `anon` and `authenticated` each add exactly one per call, and the function answers the new total.
- Another metric name, a null, or an increment other than 1 fails with `22023` and writes nothing.
- `anon` and `authenticated` can read the table. Each direct insert, update, delete and truncate fails with `42501`.
- The function writes only because it is `SECURITY DEFINER`. As an invoker function, the same call fails.
- A second run of the migration is a no-op and keeps the count.
- The rollback restores the policies, the grants and the function of the prior state, and keeps the count. A second run of the rollback is a no-op.
- `schema/game_stats_schema.sql` describes the same database as the migration.
- Every check in steps 2 and 4 is one statement, and on the rehearsal database it gives exactly the answer printed under it. After a rollback, the checks in step 2 give their printed answers again.
- The checks in step 4, run top to bottom, leave the count where it was and leave the session as the owner.

The rehearsal does not prove these points:

- Behaviour on PostgreSQL 15, which production runs. The rehearsal runs PGlite, which is PostgreSQL 18. Step 4 repeats the role checks on production for that reason.
- Two calls at the same moment. PGlite has one connection. The function adds one in a single `UPDATE`, which Postgres runs atomically for the row.
- That production holds what the rehearsal assumes. The rehearsal copies the state read from the live database on 2026-10-14. Step 2 checks it.

## 1. Order of operations with the deploy

Migrate first, then merge the app change.

The code on production today keeps working after the migration. Its call to `increment_metric` now succeeds, so it never reaches its fallback.

If the app change deploys first, nothing breaks for a visitor, but the counter stops. The new code has no fallback, so every round answers `500` from `/api/game-stats` until the migration runs.

## 2. Pre-checks

Run these before the migration. They confirm that production still holds the state the rollback restores.

1. The two policies.

    ```sql
    SELECT policyname, cmd, roles::text AS roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'game_stats'
    ORDER BY policyname;
    ```

    ```text
    {"policyname":"Allow public increment","cmd":"UPDATE","roles":"{public}","qual":"true","with_check":null}
    {"policyname":"Allow public read","cmd":"SELECT","roles":"{public}","qual":"true","with_check":null}
    ```

2. The table grants of the two roles.

    ```sql
    SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'game_stats'
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
    GROUP BY grantee
    ORDER BY grantee;
    ```

    ```text
    {"grantee":"anon","privileges":"DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE"}
    {"grantee":"authenticated","privileges":"DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE"}
    ```

3. The function runs as its caller, has no settings, and has the body the rollback restores. The third column compares the body with its whitespace collapsed, so a trailing space does not count.

    ```sql
    SELECT
      p.prosecdef AS is_security_definer,
      p.proconfig IS NULL AS has_no_settings,
      md5(regexp_replace(p.prosrc, '\s+', ' ', 'g')) = '29c0a61dc8e8de3739a7bfdda65b6ed7' AS body_matches_rollback
    FROM pg_proc p
    WHERE p.oid = 'public.increment_metric(text, bigint)'::regprocedure;
    ```

    ```text
    {"is_security_definer":false,"has_no_settings":true,"body_matches_rollback":true}
    ```

    If only `body_matches_rollback` is `false`, the migration is still safe, but the rollback would not restore the live body. Save the output of `SELECT pg_get_functiondef('public.increment_metric(text, bigint)'::regprocedure);` and use it in place of the function in the rollback file.

4. Every role may run the function.

    ```sql
    SELECT
      has_function_privilege('anon', 'public.increment_metric(text, bigint)', 'EXECUTE') AS anon_may_execute,
      has_function_privilege('authenticated', 'public.increment_metric(text, bigint)', 'EXECUTE') AS authenticated_may_execute,
      has_function_privilege('public', 'public.increment_metric(text, bigint)', 'EXECUTE') AS public_may_execute;
    ```

    ```text
    {"anon_may_execute":true,"authenticated_may_execute":true,"public_may_execute":true}
    ```

5. As `anon`, the function fails. This is the bug. An answer of `P0001` means the function wrote, which means production no longer matches this runbook. The error still undoes the write.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.increment_metric('total_plays', 1);
      RAISE EXCEPTION 'anon incremented total_plays';
    END
    $$;
    ```

    ```text
    ERROR: 42501: new row violates row-level security policy for table "game_stats"
    ```

6. The table holds one row.

    ```sql
    SELECT metric_name FROM public.game_stats ORDER BY metric_name;
    ```

    ```text
    {"metric_name":"total_plays"}
    ```

## 3. Apply

Paste the whole of `schema/migrations/0005_game_stats_increment.sql` into the SQL editor and run it once. The file opens with `BEGIN` and ends with `COMMIT`, so it applies all or nothing. With `psql`, run it with `-f`.

The file gives up after 5 seconds if it cannot take its lock, and then changes nothing. Run it again.

The file ends by asking PostgREST to reload its schema cache, so step 4 can start at once.

## 4. Verify

Run these after the migration.

1. One policy is left, and it only reads.

    ```sql
    SELECT policyname, cmd, roles::text AS roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'game_stats'
    ORDER BY policyname;
    ```

    ```text
    {"policyname":"Allow public read","cmd":"SELECT","roles":"{public}","qual":"true","with_check":null}
    ```

2. The table grants of the two roles. Any other privilege is a wrong grant.

    ```sql
    SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'game_stats'
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
    GROUP BY grantee
    ORDER BY grantee;
    ```

    ```text
    {"grantee":"anon","privileges":"SELECT"}
    {"grantee":"authenticated","privileges":"SELECT"}
    ```

3. Neither role may change the table, by a direct grant, through `PUBLIC` or through another role.

    ```sql
    SELECT
      has_table_privilege('anon', 'public.game_stats', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS anon_may_change,
      has_table_privilege('authenticated', 'public.game_stats', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_may_change;
    ```

    ```text
    {"anon_may_change":false,"authenticated_may_change":false}
    ```

4. The function runs as its owner, with an empty search path, and its owner owns the table. Printed on its own, `proconfig` reads `{"search_path=\"\""}`.

    ```sql
    SELECT
      p.prosecdef AS is_security_definer,
      p.proconfig = ARRAY['search_path=""'] AS search_path_is_empty,
      p.proowner = c.relowner AS owned_by_table_owner
    FROM pg_proc p, pg_class c
    WHERE p.oid = 'public.increment_metric(text, bigint)'::regprocedure
      AND c.oid = 'public.game_stats'::regclass;
    ```

    ```text
    {"is_security_definer":true,"search_path_is_empty":true,"owned_by_table_owner":true}
    ```

5. The two roles may run the function, and `PUBLIC` may not.

    ```sql
    SELECT
      has_function_privilege('anon', 'public.increment_metric(text, bigint)', 'EXECUTE') AS anon_may_execute,
      has_function_privilege('authenticated', 'public.increment_metric(text, bigint)', 'EXECUTE') AS authenticated_may_execute,
      has_function_privilege('public', 'public.increment_metric(text, bigint)', 'EXECUTE') AS public_may_execute;
    ```

    ```text
    {"anon_may_execute":true,"authenticated_may_execute":true,"public_may_execute":false}
    ```

6. As `anon`, the function adds exactly one. This statement ends in an error on purpose. The error carries the difference, and it undoes the write. `42501` here means the fix did not take. For an answer of 2, see "A visitor's round" under "How to read a check".

    ```sql
    DO $$
    DECLARE
      before_value bigint;
      after_value bigint;
    BEGIN
      SET LOCAL ROLE anon;
      SELECT metric_value INTO before_value FROM public.game_stats WHERE metric_name = 'total_plays';
      after_value := public.increment_metric('total_plays', 1);
      RAISE EXCEPTION 'anon added % to total_plays', after_value - before_value;
    END
    $$;
    ```

    ```text
    ERROR: P0001: anon added 1 to total_plays
    ```

7. As `anon`, a direct update is refused. An answer of `P0001` means the update went through, which is a failure. The error still undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      UPDATE public.game_stats SET metric_value = 0 WHERE metric_name = 'total_plays';
      RAISE EXCEPTION 'anon updated the count directly';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table game_stats
    ```

8. As `anon`, an increment other than 1 is refused.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.increment_metric('total_plays', 1000);
      RAISE EXCEPTION 'an increment of 1000 was accepted';
    END
    $$;
    ```

    ```text
    ERROR: 22023: invalid increment
    ```

9. As `anon`, another metric is refused.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      PERFORM public.increment_metric('total_completed_games', 1);
      RAISE EXCEPTION 'another metric was accepted';
    END
    $$;
    ```

    ```text
    ERROR: 22023: invalid metric
    ```

10. The table still holds one row.

    ```sql
    SELECT metric_name FROM public.game_stats ORDER BY metric_name;
    ```

    ```text
    {"metric_name":"total_plays"}
    ```

## 5. Rollback

Use the rollback if step 4 finds a failure. It deletes nothing and keeps the count.

If the app change has already deployed, revert it first. The new code has no fallback, so after a rollback every round would answer `500` and the counter would stop.

Paste `schema/migrations/0005_game_stats_increment_rollback.sql` and run it. It is safe to run twice. Then run the checks in step 2 again. Each gives its printed answer.

The rollback brings the bug back on purpose. Every call from the anon key fails again, and anyone with the anon key may again set `total_plays`.

## 6. Known limits

- The site has no rate limit. A script that holds the anon key can call the function directly and add one per call. It can no longer set the count, lower it, or touch another metric.
- The route handler passes the `metric` and `increment` it receives. The function now refuses anything but `total_plays` and 1, and the route answers `500` for those requests.
