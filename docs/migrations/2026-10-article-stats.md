# Runbook: add `article_stats` and `record_article_event`

Adds one table and one function to the live database.
`public.article_stats` holds one row per article with its view count and its like count.
`public.record_article_event(p_slug, p_event)` is the only way to change a count, and each call moves one count by one.

The migration touches no existing table and no existing row. It needs no backup.

You will be in the Supabase SQL editor, pasting SQL by hand. Work top to bottom.

## What the rehearsal proves, and what it does not

`schema/__tests__/articleStats.test.ts` applies `schema/migrations/0002_article_stats.sql` to an in-process Postgres and checks 48 things. From a worktree under `.claude/`, run:

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

The rehearsal does not prove these points:

- Behaviour on PostgreSQL 15.8, which production runs. The rehearsal runs PGlite 0.5.8, which is PostgreSQL 18.3. Step 4 repeats the role checks on production for that reason.
- Two calls at the same moment. PGlite has one connection. The function is one `INSERT ... ON CONFLICT DO UPDATE` statement, which Postgres runs atomically for each row.
- That the production roles hold what the rehearsal assumes. The rehearsal creates `anon` and `authenticated` and gives them every privilege by default, as the project was seen to do on 2026-10-02. Step 2 checks the real roles.

## 1. Order of operations with the deploy

Migrate first, then deploy.

If the deploy lands first, nothing breaks. The article pages render with no counts, because the read fails and the page ignores the failure. A like shows the line "That did not save. Try again." and returns to its earlier state. The order is a preference, not a hazard.

## 2. Pre-checks

Run each query. Compare the answer with the expected answer.

The table and the function do not exist yet. Expect `false` and `0`.

```sql
SELECT to_regclass('public.article_stats') IS NOT NULL AS table_exists;

SELECT count(*) AS functions
FROM pg_proc
WHERE pronamespace = 'public'::regnamespace
  AND proname = 'record_article_event';
```

The roles exist. Expect two rows, `anon` and `authenticated`.

```sql
SELECT rolname FROM pg_roles WHERE rolname IN ('anon', 'authenticated') ORDER BY rolname;
```

## 3. Apply

Paste the whole of `schema/migrations/0002_article_stats.sql` into the SQL editor and run it once, as one batch. The SQL editor and the Supabase migration API both send the file as one batch, which Postgres runs in one transaction. Between `CREATE TABLE` and `REVOKE` the table has the default grants, so do not run the statements one at a time. With `psql`, pass `--single-transaction`.

If the editor stops halfway, run the whole file again. Every statement is guarded.

## 4. Verify

Run each query after the migration. The root runs these on production. Each one names its expected answer.

1. The columns. Expect four rows in this order: `slug text NO`, `views bigint NO 0`, `likes bigint NO 0`, `updated_at timestamp with time zone NO now()`.

    ```sql
    SELECT column_name, data_type, is_nullable, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'article_stats'
    ORDER BY ordinal_position;
    ```

2. The constraints. Expect four rows: `article_stats_likes_not_negative`, `article_stats_pkey`, `article_stats_slug_format`, `article_stats_views_not_negative`.

    ```sql
    SELECT conname, pg_get_constraintdef(oid)
    FROM pg_constraint
    WHERE conrelid = 'public.article_stats'::regclass
      AND contype IN ('c', 'p')
    ORDER BY conname;
    ```

3. Row level security. Expect `true`.

    ```sql
    SELECT relrowsecurity FROM pg_class WHERE oid = 'public.article_stats'::regclass;
    ```

4. The policy. Expect exactly one row: `article_stats_public_read`, `SELECT`, `{anon,authenticated}`, `true`.

    ```sql
    SELECT policyname, cmd, roles, qual
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'article_stats';
    ```

5. The table grants. Expect exactly two rows: `anon SELECT` and `authenticated SELECT`. Any other privilege for either role is a failure. Stop and roll back.

    ```sql
    SELECT grantee, privilege_type
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'article_stats'
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
    ORDER BY grantee, privilege_type;
    ```

6. The function. Expect `prosecdef` to be `true`, `proconfig` to be `{search_path=""}`, and `owned_by_table_owner` to be `true`.

    ```sql
    SELECT p.prosecdef, p.proconfig, p.proowner = c.relowner AS owned_by_table_owner
    FROM pg_proc p, pg_class c
    WHERE p.oid = 'public.record_article_event(text, text)'::regprocedure
      AND c.oid = 'public.article_stats'::regclass;
    ```

7. Who may execute the function. Expect `anon` and `authenticated` to be `true` and `public_can_execute` to be `false`.

    ```sql
    SELECT
      has_function_privilege('anon', 'public.record_article_event(text, text)', 'EXECUTE') AS anon,
      has_function_privilege('authenticated', 'public.record_article_event(text, text)', 'EXECUTE') AS authenticated,
      EXISTS (
        SELECT 1
        FROM pg_proc p, aclexplode(p.proacl) acl
        WHERE p.oid = 'public.record_article_event(text, text)'::regprocedure
          AND acl.grantee = 0
      ) AS public_can_execute;
    ```

8. The role checks, as `anon`. Run the three blocks one at a time.

    The function writes. This block is one statement that ends in an error on purpose. The error carries the counts the function returned, and it undoes the write. Expect exactly this answer. A tool may print a `CONTEXT` line under it.

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

    Any other answer is a failure. `42501` means `anon` may not call the function. No error at all means the block did not run.

    The next two blocks each run inside a transaction that is rolled back. An error ends a transaction, so each block has its own.

    A direct insert fails. Expect `ERROR: 42501: permission denied for table article_stats`.

    ```sql
    BEGIN;
    SET LOCAL ROLE anon;
    INSERT INTO public.article_stats (slug, views) VALUES ('runbook-check', 999);
    ROLLBACK;
    ```

    A truncate fails. Expect `ERROR: 42501: permission denied for table article_stats`.

    ```sql
    BEGIN;
    SET LOCAL ROLE anon;
    TRUNCATE public.article_stats;
    ROLLBACK;
    ```

    If the editor leaves a transaction open after an error, run `ROLLBACK;` on its own.

9. A bad event fails. Expect `ERROR: 22023: invalid article event`.

    ```sql
    SELECT * FROM public.record_article_event('runbook-check', 'purge');
    ```

10. The table is still empty. Expect `0`.

    ```sql
    SELECT count(*) FROM public.article_stats;
    ```

## 5. Rollback

Use the rollback if step 4 finds a wrong grant or a wrong policy, or if the feature is withdrawn.

The rollback destroys every view count and like count. To keep the numbers, export the table first.

```sql
COPY (SELECT * FROM public.article_stats ORDER BY slug) TO STDOUT WITH CSV HEADER;
```

Then paste `schema/migrations/0002_article_stats_rollback.sql` and run it. It is safe to run twice.

The site keeps working after a rollback. The pages render with no counts and a like shows its failure line.

## 6. Known limits

- The site has no rate limit. A script that holds the anon key can call the function directly. It can inflate a count one step for each call, and it can create a row for any slug that matches the pattern. The site reads only the slugs in its registry, so a made-up row is never shown.
- An unlike needs no proof of an earlier like, because the database stores no visitor. A script can also lower a like count one step for each call, down to zero.
- The site gives each call 3 seconds. A call that times out after the database committed counts once in the database while the visitor sees a failure. A second press then counts again.
- The route handler refuses unknown slugs, and refuses a view from a crawler user agent. It writes a like or an unlike from every agent, because the crawler pattern also matches real browsers. The function can refuse neither, because it does not see the request.

## 7. Reload the schema cache

Run this last, after the migration and again after a rollback.

```sql
NOTIFY pgrst, 'reload schema';
```

PostgREST keeps a cache of the schema. Until the cache reloads, PostgREST answers `PGRST205` for the new table and `PGRST202` for the new function.
