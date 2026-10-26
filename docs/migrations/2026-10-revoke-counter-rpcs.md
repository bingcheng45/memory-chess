# Runbook: only the server runs `increment_metric` and `record_article_event`

Migration 0010 closes the two counter functions to the public anon key.

Today `anon` and `authenticated` may execute `public.increment_metric` and `public.record_article_event`. Both are `SECURITY DEFINER`, so anyone with the anon key can call them straight through PostgREST (`/rest/v1/rpc/...`), past the site's routes and their rate limits. On 2026-10-25 zero-row probes with invalid arguments got `400` with code `22023` from the function itself, which shows the functions run for the anon key. `total_plays` reads 50,941, and anyone can raise it.

After 0010:

- Only `service_role` may execute the two functions. `PUBLIC`, `anon` and `authenticated` may not.
- The site calls them from `POST /api/game-stats` and `POST /api/articles/<slug>/stats` with `SUPABASE_SERVICE_ROLE_KEY`, server side only. No browser code calls them.
- `POST /api/game-stats` has a limiter of 30 counts a minute per address, a JSON check and a body cap.
- `anon` and `authenticated` still read `game_stats` and `article_stats`.

The migration deletes no row and keeps every count. It needs no backup.

## 1. Order of operations

The app change is safe to merge first. Without the key the server logs one warning per instance, `SUPABASE_SERVICE_ROLE_KEY is not set, so play and article counters are written with the anon key. Migration 0010 refuses those writes.`, and keeps calling the functions with the anon key, as before. Players see no change.

Then, in this order:

1. In Vercel, set `SUPABASE_SERVICE_ROLE_KEY` for Production. Its value is the legacy `service_role` key from Supabase project settings, under API, the long key that starts with `eyJ`. The leaderboard (0006) reads the same variable, so if it is already set and the leaderboard works, keep it and go to step 2. Never prefix the name with `NEXT_PUBLIC_`.
2. Redeploy production so the variable takes effect.
3. Play one round on the site. Read `total_plays` (`/api/game-stats?metric=total_plays`, cached up to a minute) and confirm it rose by one. In the Vercel runtime logs of that deploy, the warning above must not appear. If the count did not move, do not migrate.
4. Apply `schema/migrations/0010_revoke_counter_rpcs.sql` (section 3).
5. Run the checks in section 4, then play one more round and confirm `total_plays` still rises.

If 0010 runs while the site still uses the anon key, every round answers `500` from `/api/game-stats` and article views and likes answer `500` until the key is set and production is redeployed. Run the rollback in section 5 to undo that at once.

## 2. Pre-checks

Run each statement on its own and compare the whole answer.

1. Which roles may execute the functions.

    ```sql
    SELECT
      has_function_privilege('anon', 'public.increment_metric(text, bigint)', 'EXECUTE') AS anon_counts_plays,
      has_function_privilege('anon', 'public.record_article_event(text, text)', 'EXECUTE') AS anon_counts_articles,
      has_function_privilege('service_role', 'public.increment_metric(text, bigint)', 'EXECUTE') AS service_role_counts_plays,
      has_function_privilege('service_role', 'public.record_article_event(text, text)', 'EXECUTE') AS service_role_counts_articles;
    ```

    ```text
    {"anon_counts_plays":true,"anon_counts_articles":true,"service_role_counts_plays":true,"service_role_counts_articles":true}
    ```

## 3. Apply

Paste the whole of `schema/migrations/0010_revoke_counter_rpcs.sql` into the SQL editor and run it once. The file opens with `BEGIN` and ends with `COMMIT`, so it applies all or nothing. It gives up after 5 seconds if it cannot take its lock and then changes nothing. Run it again. The file ends by asking PostgREST to reload its schema cache.

## 4. Verify

1. Which roles may execute the functions now.

    ```sql
    SELECT
      has_function_privilege('anon', 'public.increment_metric(text, bigint)', 'EXECUTE') AS anon_counts_plays,
      has_function_privilege('authenticated', 'public.increment_metric(text, bigint)', 'EXECUTE') AS authenticated_counts_plays,
      has_function_privilege('anon', 'public.record_article_event(text, text)', 'EXECUTE') AS anon_counts_articles,
      has_function_privilege('authenticated', 'public.record_article_event(text, text)', 'EXECUTE') AS authenticated_counts_articles,
      has_function_privilege('service_role', 'public.increment_metric(text, bigint)', 'EXECUTE') AS service_role_counts_plays,
      has_function_privilege('service_role', 'public.record_article_event(text, text)', 'EXECUTE') AS service_role_counts_articles;
    ```

    ```text
    {"anon_counts_plays":false,"authenticated_counts_plays":false,"anon_counts_articles":false,"authenticated_counts_articles":false,"service_role_counts_plays":true,"service_role_counts_articles":true}
    ```

2. No grant to `PUBLIC` is left on either function.

    ```sql
    SELECT count(*)::int AS public_grants
    FROM pg_proc p, aclexplode(p.proacl) AS acl
    WHERE p.oid IN ('public.increment_metric(text, bigint)'::regprocedure, 'public.record_article_event(text, text)'::regprocedure)
      AND acl.grantee = 0;
    ```

    ```text
    {"public_grants":0}
    ```

3. From outside, with the public anon key and no secret, a zero-row probe is now refused. The expected status is `401` or `404` with a permission message, no longer `400` with `22023`.

    ```bash
    curl -s -o /dev/null -w '%{http_code}\n' -X POST "$SUPABASE_URL/rest/v1/rpc/increment_metric" \
      -H "apikey: $ANON_KEY" -H "Content-Type: application/json" \
      -d '{"p_metric_name":"not_a_metric","p_increment":1}'
    ```

    The probe uses an invalid metric name, so even a failed revoke writes nothing.

4. Play one round on the site and confirm `total_plays` rose by one.

## 5. Rollback

Use the rollback if step 4 finds a failure, or if rounds start answering `500`. Paste `schema/migrations/0010_revoke_counter_rpcs_rollback.sql` and run it. It deletes nothing, is safe to run twice, and is safe on a database that never had 0010. It puts the hole back on purpose: anyone with the anon key may again call both functions.

## 6. What the rehearsal proves

`schema/__tests__/revokeCounterRpcs.test.ts` builds a Supabase-like database in-process (PGlite, which is PostgreSQL 18, where production runs 15), with the default privileges that give every web role EXECUTE. It proves that before 0010 `anon` and `authenticated` can run both functions, that after it each gets `42501` and `service_role` counts one play and one view, that both tables stay readable, that a second run is a no-op, and that the rollback restores the grants and keeps the count. Run it with `npx jest schema`. The snapshots `schema/game_stats_schema.sql` and `schema/article_stats_schema.sql` still describe the state 0005 and 0002 produce. They do not yet carry 0010's grants.
