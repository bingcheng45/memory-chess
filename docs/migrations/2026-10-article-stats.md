# Runbook: add `article_stats` and `record_article_event`

Adds one table and one function to the live database.
`public.article_stats` holds one row per article with its view count and its like count.
`public.record_article_event(p_slug, p_event)` is the only way to change a count, and each call moves one count by one.

The migration touches no existing table and no existing row. It needs no backup.

You will run SQL through a tool that takes one statement and returns its rows, such as the Supabase SQL editor. Work top to bottom.

## How to read a check

Every check in steps 2 and 4 is one statement. Run the checks one at a time, in order.

Under each check is the exact answer to expect. Rows are printed as JSON, one row to a line. An answer that starts with `ERROR:` is the error code and the error message, and a tool may print a `CONTEXT` line under it.

Any other answer is a failure. Stop there. After the migration has run, roll back with step 5.

## What the rehearsal proves, and what it does not

`schema/__tests__/articleStats.test.ts` applies `schema/migrations/0002_article_stats.sql` to an in-process Postgres and checks the table, the function and the grants. `schema/__tests__/articleStatsRunbook.test.ts` reads every check out of this file and runs it on that database. From a worktree under `.claude/`, run:

```bash
npx jest schema --testPathIgnorePatterns=/node_modules/
```

From the main checkout, run `npx jest schema`.

The rehearsal proves these points:

- `anon` and `authenticated` can read the table.
- `anon` and `authenticated` cannot insert, update, delete or truncate. Each attempt fails with `42501`.
- The function writes for both roles, and fails with `42501` for a role that was not granted it.
- The function writes only because it is `SECURITY DEFINER`. As an invoker function, the same call fails.
- A view adds one view. A like adds one like. An unlike removes one like and stops at zero.
- A bad slug or a bad event fails with `22023` and writes nothing.
- A second run of the migration is a no-op and keeps the counts.
- The rollback removes the table and the function. A second run of the rollback is a no-op.
- `schema/article_stats_schema.sql` describes the same database as the migration.
- Every check in steps 2 and 4 is one statement, and on the rehearsal database it gives exactly the answer printed under it.
- The checks in step 4, run top to bottom, leave no row behind and leave the session as the owner.
- The checks in step 4 give a wrong answer on a database with a wrong grant, a function that is not `SECURITY DEFINER`, a function with a search path, or row level security off.

The rehearsal does not prove these points:

- Behaviour on PostgreSQL 15.8, which production runs. The rehearsal runs PGlite 0.5.8, which is PostgreSQL 18.3. Step 4 repeats the role checks on production for that reason.
- Two calls at the same moment. PGlite has one connection. The function is one `INSERT ... ON CONFLICT DO UPDATE` statement, which Postgres runs atomically for each row.
- That the production roles hold what the rehearsal assumes. The rehearsal creates `anon` and `authenticated` and gives them every privilege by default, as the project was seen to do on 2026-10-02. Step 2 checks the real roles.

## 1. Order of operations with the deploy

Migrate first, then deploy.

If the deploy lands first, nothing breaks. The article pages render with no counts, because the read fails and the page ignores the failure. A like shows the line "That did not save. Try again." and returns to its earlier state. The order is a preference, not a hazard.

## 2. Pre-checks

Run these before the migration.

1. The table does not exist yet.

    ```sql
    SELECT to_regclass('public.article_stats') IS NOT NULL AS table_exists;
    ```

    ```text
    {"table_exists":false}
    ```

2. The function does not exist yet.

    ```sql
    SELECT count(*)::int AS functions
    FROM pg_proc
    WHERE pronamespace = 'public'::regnamespace
      AND proname = 'record_article_event';
    ```

    ```text
    {"functions":0}
    ```

3. The two roles exist.

    ```sql
    SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') ORDER BY rolname;
    ```

    ```text
    {"rolname":"anon"}
    {"rolname":"authenticated"}
    ```

## 3. Apply

Paste the whole of `schema/migrations/0002_article_stats.sql` into the SQL editor and run it once, as one batch. The SQL editor and the Supabase migration API both send the file as one batch, which Postgres runs in one transaction. Between `CREATE TABLE` and `REVOKE` the table has the default grants, so do not run the statements one at a time. With `psql`, pass `--single-transaction`.

If the editor stops halfway, run the whole file again. Every statement is guarded.

## 4. Verify

Run these after the migration. The root runs them on production.

1. The columns.

    ```sql
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'article_stats'
    ORDER BY ordinal_position;
    ```

    ```text
    {"column_name":"slug","data_type":"text","is_nullable":"NO","column_default":null}
    {"column_name":"views","data_type":"bigint","is_nullable":"NO","column_default":"0"}
    {"column_name":"likes","data_type":"bigint","is_nullable":"NO","column_default":"0"}
    {"column_name":"updated_at","data_type":"timestamp with time zone","is_nullable":"NO","column_default":"now()"}
    ```

2. The constraints. `c` is a check and `p` is the primary key.

    ```sql
    SELECT conname, contype
    FROM pg_constraint
    WHERE conrelid = 'public.article_stats'::regclass
      AND contype IN ('c', 'p')
    ORDER BY conname;
    ```

    ```text
    {"conname":"article_stats_likes_not_negative","contype":"c"}
    {"conname":"article_stats_pkey","contype":"p"}
    {"conname":"article_stats_slug_format","contype":"c"}
    {"conname":"article_stats_views_not_negative","contype":"c"}
    ```

3. Row level security is on.

    ```sql
    SELECT relrowsecurity FROM pg_class WHERE oid = 'public.article_stats'::regclass;
    ```

    ```text
    {"relrowsecurity":true}
    ```

4. The policy. There is exactly one, and it only lets the two roles read.

    ```sql
    SELECT policyname, cmd, roles::text AS roles, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'article_stats';
    ```

    ```text
    {"policyname":"article_stats_public_read","cmd":"SELECT","roles":"{anon,authenticated}","qual":"true"}
    ```

5. The table grants, as a list. Exactly two rows. Any other row is a wrong grant.

    ```sql
    SELECT grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'article_stats'
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
    ORDER BY grantee, privilege_type;
    ```

    ```text
    {"grantee":"anon","privilege_type":"SELECT"}
    {"grantee":"authenticated","privilege_type":"SELECT"}
    ```

6. Neither role may change the table. Each column is `true` if the role holds any one of the six privileges, by a direct grant, through `PUBLIC` or through another role.

    ```sql
    SELECT
      has_table_privilege('anon', 'public.article_stats', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS anon_may_change,
      has_table_privilege('authenticated', 'public.article_stats', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_may_change;
    ```

    ```text
    {"anon_may_change":false,"authenticated_may_change":false}
    ```

7. Both roles may read the table.

    ```sql
    SELECT
      has_table_privilege('anon', 'public.article_stats', 'SELECT') AS anon_may_read,
      has_table_privilege('authenticated', 'public.article_stats', 'SELECT') AS authenticated_may_read;
    ```

    ```text
    {"anon_may_read":true,"authenticated_may_read":true}
    ```

8. The function runs as its owner, with an empty search path, and its owner owns the table. The second column compares `proconfig` with the one setting `search_path=""`. Printed on its own, `proconfig` reads `{"search_path=\"\""}`.

    ```sql
    SELECT
      p.prosecdef AS is_security_definer,
      p.proconfig = ARRAY['search_path=""'] AS search_path_is_empty,
      p.proowner = c.relowner AS owned_by_table_owner
    FROM pg_proc p, pg_class c
    WHERE p.oid = 'public.record_article_event(text, text)'::regprocedure
      AND c.oid = 'public.article_stats'::regclass;
    ```

    ```text
    {"is_security_definer":true,"search_path_is_empty":true,"owned_by_table_owner":true}
    ```

9. Who may run the function. The two roles may, and `PUBLIC` holds no grant.

    ```sql
    SELECT
      has_function_privilege('anon', 'public.record_article_event(text, text)', 'EXECUTE') AS anon_may_execute,
      has_function_privilege('authenticated', 'public.record_article_event(text, text)', 'EXECUTE') AS authenticated_may_execute,
      EXISTS (
        SELECT 1
        FROM pg_proc p, aclexplode(p.proacl) acl
        WHERE p.oid = 'public.record_article_event(text, text)'::regprocedure
          AND acl.grantee = 0
      ) AS public_may_execute;
    ```

    ```text
    {"anon_may_execute":true,"authenticated_may_execute":true,"public_may_execute":false}
    ```

10. As `anon`, the function writes. This statement ends in an error on purpose. The error carries the counts the function returned, and it undoes the write. `42501` here means `anon` may not run the function. No error at all means the statement did not run.

    ```sql
    DO $$
    DECLARE got record;
    BEGIN
      SET LOCAL ROLE anon;
      SELECT * INTO got FROM public.record_article_event('runbook-check', 'view');
      RAISE EXCEPTION 'anon wrote through the function: views %, likes %', got.views, got.likes;
    END
    $$;
    ```

    ```text
    ERROR: P0001: anon wrote through the function: views 1, likes 0
    ```

11. As `anon`, a direct insert is refused. An answer of `P0001` means the insert went through, which is a failure. The error still undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      INSERT INTO public.article_stats (slug, views) VALUES ('runbook-check', 999);
      RAISE EXCEPTION 'anon inserted a row directly';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table article_stats
    ```

12. As `anon`, a truncate is refused. An answer of `P0001` means the truncate went through, which is a failure. The error still undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      TRUNCATE public.article_stats;
      RAISE EXCEPTION 'anon truncated the table directly';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table article_stats
    ```

13. A bad event is refused.

    ```sql
    SELECT * FROM public.record_article_event('runbook-check', 'purge');
    ```

    ```text
    ERROR: 22023: invalid article event
    ```

14. The checks left no row behind. The count looks only at the slug the checks used, so it holds even if the site wrote a real row in the meantime.

    ```sql
    SELECT count(*)::int AS runbook_rows FROM public.article_stats WHERE slug = 'runbook-check';
    ```

    ```text
    {"runbook_rows":0}
    ```

## 5. Rollback

Use the rollback if step 4 finds a wrong answer, or if the feature is withdrawn.

The rollback destroys every view count and like count. To keep the numbers, run this first and save the rows it returns.

```sql
SELECT slug, views, likes, updated_at FROM public.article_stats ORDER BY slug;
```

Then paste `schema/migrations/0002_article_stats_rollback.sql` and run it. It is safe to run twice.

The site keeps working after a rollback. The pages render with no counts and a like shows its failure line.

## 6. Known limits

- The site has no rate limit. A script that holds the anon key can call the function directly. It can inflate a count one step for each call, and it can create a row for any slug that matches the pattern. The site reads only the slugs in its registry, so a made-up row is never shown.
- An unlike needs no proof of an earlier like, because the database stores no visitor. A script can also lower a like count one step for each call, down to zero.
- The site gives each call 3 seconds. A call that times out after the database committed counts once in the database while the visitor sees a failure. A second press then counts again.
- The route handler refuses unknown slugs, and refuses a view from a crawler user agent. It writes a like or an unlike from every agent, because the crawler pattern also matches real browsers. The function can refuse neither, because it does not see the request.

## 7. Reload the schema cache

Run this last, after the migration and again after a rollback. It returns no rows.

```sql
NOTIFY pgrst, 'reload schema';
```

PostgREST keeps a cache of the schema. Until the cache reloads, PostgREST answers `PGRST205` for the new table and `PGRST202` for the new function.
