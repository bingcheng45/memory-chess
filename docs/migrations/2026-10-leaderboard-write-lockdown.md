# Runbook: only the server writes `leaderboard_entries`

Migration 0006 closes a hole in `public.leaderboard_entries`.

Today anyone with the anon key can write to the table straight through PostgREST. The policy "Allow public insert" lets any insert through, and `anon` and `authenticated` hold all seven table privileges. On 2026-10-18 an insert sent with the anon key and built to break a check constraint got `23514` from that constraint, not `42501`. No row was stored, but the insert had passed every permission check. The API route's rate limit, name rules, piece counts and time floors can all be skipped. `TRUNCATE` is open too, and row level security does not gate it.

After 0006:

- The policy "Allow public insert" is gone. "Allow public read" stays.
- `anon` and `authenticated` hold `SELECT` on the table and nothing else.
- `service_role` keeps every privilege it holds. The site writes with that key, from the server only, through `SUPABASE_SERVICE_ROLE_KEY`, the variable the lab backup already reads. It bypasses row level security.
- Three new checks hold every new row. `check_board_piece_count` ties each fixed board to its piece count (easy 2, medium 6, hard 12, grandmaster 20), from the presets in `src/lib/game/configPrefill.ts`. A daily row may have any count. `check_solution_time_per_piece` needs a quarter second per piece to rebuild, which is easy 0.5 s, medium 1.5 s, hard 3 s, grandmaster 5 s, and 0.25 s per piece on a daily board. `check_memorize_time_longest` caps study at 60 seconds, the top of the slider.

The three checks are `NOT VALID`. Postgres tests every new insert and every update against them, and leaves the rows already stored alone. Six rows in production rebuild faster than the floor allows. They stay. An optional query at the end of step 4 counts the old rows that break each check. The migration does not validate the checks.

The migration deletes no row. It needs no backup.

You will run SQL through a tool that takes one statement and returns its rows, such as the Supabase SQL editor. Work top to bottom.

## How to read a check

Every check in steps 2 and 4 is one statement. Run the checks one at a time, in order.

Under each check is the exact answer to expect. Rows are printed as JSON, one row to a line. An answer that starts with `ERROR:` is the error code and the error message, and a tool may print a `CONTEXT` line under it.

Compare the whole answer, not only the error code. `P0001` is the passing answer of pre-check 5 and of check 11 in step 4, and it is a failure of checks 6 to 10. `42501` with "row-level security" in its message is a failure of check 6, where the passing answer says "permission denied".

An answer other than the printed one is a failure. On a failure, stop. Before the migration, a failure means production no longer matches this runbook, so do not run it. After the migration has run, roll back with step 5.

**An open transaction.** An answer of `25P02` means the tool kept one transaction open, and the error that an earlier check raises on purpose aborted it. Run `ROLLBACK`, then repeat the check.

**No row is left behind.** Every check that writes ends in an error, and the error undoes the write.

## What the rehearsal proves, and what it does not

`schema/__tests__/leaderboardWriteLockdown.test.ts` builds the production state of 2026-10-18 in an in-process Postgres, applies `schema/migrations/0006_leaderboard_write_lockdown.sql`, and checks the policies, the grants and the three checks. `schema/__tests__/leaderboardWriteLockdownRunbook.test.ts` reads every check out of this file and runs it on that database. From a worktree under `.claude/`, run:

```bash
npx jest schema --testPathIgnorePatterns=/node_modules/
```

From the main checkout, run `npx jest schema`.

The rehearsal proves these points:

- Before the migration, `anon` can store an impossible row straight into the table and can empty it with `TRUNCATE`.
- After it, `anon` and `authenticated` each get `42501` for an insert, an update, a delete and a truncate. Both can still read every row.
- `service_role` can store a valid row and read it back.
- On each board, a row at the floor is stored and a row a thousandth of a second under it is refused, naming `check_solution_time_per_piece`. The same holds for 60 and 60.001 seconds of study. A medium row of 5 pieces and a grandmaster row of 2 are refused. A daily row of 9 pieces is stored.
- Old rows under the floor survive the migration, and the three checks stay unvalidated.
- A second run of the migration is a no-op.
- The rollback restores the policies and the grants of the prior state, drops the three checks, and keeps every row. A second run of the rollback is a no-op.
- `schema/leaderboard_schema.sql` describes the same columns, checks, policies and grants as the migration.
- Every check in steps 2 and 4 is one statement, and on the rehearsal database it gives exactly the answer printed under it. After a rollback, the checks in step 2 give their printed answers again.
- The checks in step 4, run top to bottom, leave the rows as they were and leave the session as the owner.

The rehearsal does not prove these points:

- Behaviour on PostgreSQL 15, which production runs. The rehearsal runs PGlite, which is PostgreSQL 18. Step 4 repeats the role checks on production for that reason.
- That production holds what the rehearsal assumes. The rehearsal copies the state the audit read on 2026-10-18. Step 2 checks it.
- That the deployed site writes with the service key. Step 1 checks that by hand, through the server log.

## 1. Order of operations with the deploy

Deploy first, then migrate.

Merging the app change does two things on deploy, before any migration. The API route applies the new per-board rules (fixed piece counts, the quarter second per piece floor, 60 seconds of study at most) to every submission. And the server picks its leaderboard key from `SUPABASE_SERVICE_ROLE_KEY`.

### What the server does with each value of the variable

The server reads the role written inside the key. It does not check the key's signature, so only Supabase can tell whether the key belongs to this project. The log names the problem and never prints the key.

- Not set. The server writes with the anon key and logs one warning at the first score on each server instance (on Vercel, several lines). Scores keep saving until the migration runs.
- A JWT whose role is not `service_role`, such as the anon key pasted by mistake. The server falls back to the anon key and logs one error at the first score on each server instance. Scores keep saving until the migration runs.
- A value that is not a JWT, such as an `sb_secret_` key. The server falls back to the anon key and logs one error that says the variable does not hold a Supabase JWT with a role. Scores keep saving until the migration runs.
- The `service_role` JWT of this project. The server writes with it. This is the only value that keeps scores saving after the migration.
- A JWT whose role is `service_role` that this project rejects, such as the `service_role` key of another project. The server uses the key, and Supabase refuses it. Every score submission answers `500` from the moment that deploy is live, before any migration. No key line appears in the log. Each failed score logs `Leaderboard submission failed:` instead. Item 4 below is the only check that catches this case, so do item 4 as soon as the redeploy in item 3 is live.

### Use the legacy `service_role` JWT, not an `sb_secret_` key

`SUPABASE_SERVICE_ROLE_KEY` must hold the legacy `service_role` key, the JWT that starts with `eyJ`. Supabase also issues secret keys that start with `sb_secret_`, and the lab backup works with either. The leaderboard does not. An `sb_secret_` key carries no role the server can read, so the server cannot tell it apart from a wrong key and falls back to the anon key.

If someone later changes the variable to an `sb_secret_` key, leaderboard writes go back to the anon key with one error in the log. After 0006, every score submission then answers `500`. To move the leaderboard to the new key format, first change the role check in `src/lib/supabase.js`. Also keep the legacy JWT keys enabled in Supabase. Disabling them turns off the anon key and the `service_role` key together, because both are legacy JWTs in this project. The connection check on the anon client then fails first, so score submissions answer `503` and the leaderboard stops loading.

### Steps

1. Merge the PR. Vercel deploys it to production.
2. In Vercel, open the project's environment variables. If `SUPABASE_SERVICE_ROLE_KEY` is already set for production, confirm it starts with `eyJ` and keep it. If it holds an `sb_secret_` key or is not set, set it for production only. Its value is the legacy `service_role` key from Supabase project settings, under API, the long key that starts with `eyJ`. Never prefix the name with `NEXT_PUBLIC_`.
3. Redeploy production so the variable takes effect. A variable added after a deploy reaches only the next deploy.
4. As soon as the redeploy is live, submit one real score on the site and confirm it appears on the leaderboard. If it does not, the variable may hold a `service_role` JWT this project rejects, and every player's score is failing.
5. In the Vercel runtime logs of that deploy, find the `POST /api/leaderboard` request from item 4. Neither of these lines may appear anywhere in the deploy's logs:
    - `SUPABASE_SERVICE_ROLE_KEY is not set, so leaderboard scores are written with the anon key. ...`
    - `SUPABASE_SERVICE_ROLE_KEY holds a key whose role is ...` or `SUPABASE_SERVICE_ROLE_KEY does not hold a Supabase JWT with a role ...`

    Optionally, the Supabase API logs show the insert from item 4 with role `service_role`.
6. Only then run the migration, from step 2 on.

If the score in item 4 does not appear, or item 5 finds either line, do not migrate. Fix the variable or remove it, redeploy, and repeat items 4 and 5.

- If item 5 found a key line, the server fell back to the anon key. Scores keep saving while you fix the variable.
- If the score did not appear and item 5 found no key line, every score is failing now. Remove the variable and redeploy at once if you cannot fix it right away. Without the variable, the site writes with the anon key and scores save again. This does not help if the legacy JWT keys are disabled in Supabase, since the anon key is rejected too. Re-enable the legacy keys instead.

If the migration runs while the site still writes with the anon key, every score submission fails with `500` until the key is fixed and production is redeployed. To undo that at once, run the rollback in step 5.

### Old scripts that stop working

Four scripts in the repo root write to `leaderboard_entries` with the anon key: `populate-leaderboard.js`, `clean-leaderboard.js`, `clean-leaderboard.mjs` and `clear-leaderboard.mjs`. After the migration each of them gets `42501` for every insert, update or delete. That is intended. Writing with the anon key is the hole this migration closes.

## 2. Pre-checks

Run these before the migration. They confirm that production still holds the state the rehearsal starts from and the rollback restores. A different answer means stop.

1. The two policies.

    ```sql
    SELECT policyname, cmd, roles::text AS roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leaderboard_entries'
    ORDER BY policyname;
    ```

    ```text
    {"policyname":"Allow public insert","cmd":"INSERT","roles":"{public}","qual":null,"with_check":"true"}
    {"policyname":"Allow public read","cmd":"SELECT","roles":"{public}","qual":"true","with_check":null}
    ```

2. The table grants of the two roles.

    ```sql
    SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'leaderboard_entries'
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
    GROUP BY grantee
    ORDER BY grantee;
    ```

    ```text
    {"grantee":"anon","privileges":"DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE"}
    {"grantee":"authenticated","privileges":"DELETE,INSERT,REFERENCES,SELECT,TRIGGER,TRUNCATE,UPDATE"}
    ```

3. `service_role` may insert and read, and bypasses row level security. The site writes with this role after the migration.

    ```sql
    SELECT
      has_table_privilege('service_role', 'public.leaderboard_entries', 'INSERT') AS service_role_may_insert,
      has_table_privilege('service_role', 'public.leaderboard_entries', 'SELECT') AS service_role_may_select,
      (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'service_role') AS service_role_bypasses_rls;
    ```

    ```text
    {"service_role_may_insert":true,"service_role_may_select":true,"service_role_bypasses_rls":true}
    ```

4. None of the three checks exists yet.

    ```sql
    SELECT count(*)::int AS existing
    FROM pg_constraint
    WHERE conrelid = 'public.leaderboard_entries'::regclass
      AND conname IN ('check_board_piece_count', 'check_solution_time_per_piece', 'check_memorize_time_longest');
    ```

    ```text
    {"existing":0}
    ```

5. As `anon`, a direct insert goes through. This is the hole. The error at the end undoes the insert. An answer of `42501` means production no longer matches this runbook.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      INSERT INTO public.leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
      VALUES ('Rehearsal', 'medium', 6, 6, 10, 12.5);
      RAISE EXCEPTION 'anon stored the row';
    END
    $$;
    ```

    ```text
    ERROR: P0001: anon stored the row
    ```

**When the tool cannot switch roles.** Pre-check 5 and checks 6 to 11 in step 4 switch to `anon` or `service_role` with `SET LOCAL ROLE`. The Supabase SQL editor runs as `postgres`, which may switch to both. Some tools connect as a user that may not. Such a tool answers `ERROR: 42501: permission denied to set role "anon"` (or `"service_role"`). That answer says nothing about the table, and it is not the `42501` of a closed hole. It means the tool cannot run these checks. Run them with `psql` and the `postgres` connection string from Supabase project settings, under Database. If no tool can switch roles, do not migrate on the strength of checks 1 to 4 alone, because pre-check 5 is the only check that shows the hole is open the way the rehearsal assumes.

## 3. Apply

Paste the whole of `schema/migrations/0006_leaderboard_write_lockdown.sql` into the SQL editor and run it once. The file opens with `BEGIN` and ends with `COMMIT`, so it applies all or nothing. With `psql`, run it with `-f`.

The file gives up after 5 seconds if it cannot take its lock, and then changes nothing. Run it again. If the retry answers `25P02`, the tool kept the failed transaction open. Run `ROLLBACK`, then run the file again.

The file ends by asking PostgREST to reload its schema cache, so step 4 can start at once.

## 4. Verify

Run these after the migration.

1. One policy is left, and it only reads.

    ```sql
    SELECT policyname, cmd, roles::text AS roles, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public' AND tablename = 'leaderboard_entries'
    ORDER BY policyname;
    ```

    ```text
    {"policyname":"Allow public read","cmd":"SELECT","roles":"{public}","qual":"true","with_check":null}
    ```

2. The table grants of the two roles. Any other privilege is a wrong grant.

    ```sql
    SELECT grantee, string_agg(privilege_type, ',' ORDER BY privilege_type) AS privileges
    FROM information_schema.role_table_grants
    WHERE table_schema = 'public' AND table_name = 'leaderboard_entries'
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
      has_table_privilege('anon', 'public.leaderboard_entries', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS anon_may_change,
      has_table_privilege('authenticated', 'public.leaderboard_entries', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER') AS authenticated_may_change;
    ```

    ```text
    {"anon_may_change":false,"authenticated_may_change":false}
    ```

4. `service_role` still may insert and read, and bypasses row level security.

    ```sql
    SELECT
      has_table_privilege('service_role', 'public.leaderboard_entries', 'INSERT') AS service_role_may_insert,
      has_table_privilege('service_role', 'public.leaderboard_entries', 'SELECT') AS service_role_may_select,
      (SELECT rolbypassrls FROM pg_roles WHERE rolname = 'service_role') AS service_role_bypasses_rls;
    ```

    ```text
    {"service_role_may_insert":true,"service_role_may_select":true,"service_role_bypasses_rls":true}
    ```

5. The three checks exist, unvalidated, with these exact definitions.

    ```sql
    SELECT conname, convalidated, pg_get_constraintdef(oid) AS definition
    FROM pg_constraint
    WHERE conrelid = 'public.leaderboard_entries'::regclass
      AND conname IN ('check_board_piece_count', 'check_solution_time_per_piece', 'check_memorize_time_longest')
    ORDER BY conname;
    ```

    ```text
    {"conname":"check_board_piece_count","convalidated":false,"definition":"CHECK (((difficulty = 'daily'::text) OR ((difficulty = 'easy'::text) AND (piece_count = 2)) OR ((difficulty = 'medium'::text) AND (piece_count = 6)) OR ((difficulty = 'hard'::text) AND (piece_count = 12)) OR ((difficulty = 'grandmaster'::text) AND (piece_count = 20)))) NOT VALID"}
    {"conname":"check_memorize_time_longest","convalidated":false,"definition":"CHECK ((memorize_time <= (60)::numeric)) NOT VALID"}
    {"conname":"check_solution_time_per_piece","convalidated":false,"definition":"CHECK ((solution_time >= ((piece_count)::numeric * 0.25))) NOT VALID"}
    ```

6. As `anon`, a well-formed insert is refused. An answer of `P0001` means the insert went through, which is a failure. The error still undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      INSERT INTO public.leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
      VALUES ('Rehearsal', 'medium', 6, 6, 10, 12.5);
      RAISE EXCEPTION 'anon stored the row';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table leaderboard_entries
    ```

7. As `anon`, an update is refused. `WHERE false` keeps it from touching a row even if it were allowed.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      UPDATE public.leaderboard_entries SET solution_time = 1 WHERE false;
      RAISE EXCEPTION 'anon was allowed to update';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table leaderboard_entries
    ```

8. As `anon`, a delete is refused.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      DELETE FROM public.leaderboard_entries WHERE false;
      RAISE EXCEPTION 'anon was allowed to delete';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table leaderboard_entries
    ```

9. As `anon`, a truncate is refused. If it went through, the error at the end undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE anon;
      TRUNCATE public.leaderboard_entries;
      RAISE EXCEPTION 'anon was allowed to truncate';
    END
    $$;
    ```

    ```text
    ERROR: 42501: permission denied for table leaderboard_entries
    ```

10. As `service_role`, a grandmaster rebuild under 5 seconds is refused by the floor.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE service_role;
      INSERT INTO public.leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
      VALUES ('Rehearsal', 'grandmaster', 20, 20, 5, 4.999);
      RAISE EXCEPTION 'service_role stored a row under the floor';
    END
    $$;
    ```

    ```text
    ERROR: 23514: new row for relation "leaderboard_entries" violates check constraint "check_solution_time_per_piece"
    ```

11. As `service_role`, a valid medium row is stored. The error at the end undoes it.

    ```sql
    DO $$
    BEGIN
      SET LOCAL ROLE service_role;
      INSERT INTO public.leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
      VALUES ('Rehearsal', 'medium', 6, 6, 10, 12.5);
      RAISE EXCEPTION 'service_role stored the row';
    END
    $$;
    ```

    ```text
    ERROR: P0001: service_role stored the row
    ```

### Old rows that break the new checks

This query is optional and separate from the checks above. It only reads. Each column counts the stored rows that break one check. The audit of 2026-10-18 found 6 rows under the floor. It did not count the other two.

```sql
SELECT
  count(*) FILTER (WHERE NOT (
    difficulty = 'daily'
    OR (difficulty = 'easy' AND piece_count = 2)
    OR (difficulty = 'medium' AND piece_count = 6)
    OR (difficulty = 'hard' AND piece_count = 12)
    OR (difficulty = 'grandmaster' AND piece_count = 20)
  ))::int AS break_board_piece_count,
  count(*) FILTER (WHERE NOT (solution_time >= piece_count * 0.25))::int AS break_solution_time_per_piece,
  count(*) FILTER (WHERE NOT (memorize_time <= 60))::int AS break_memorize_time_longest
FROM public.leaderboard_entries;
```

## 5. Rollback

Use the rollback if step 4 finds a failure. It deletes nothing and keeps every row, including rows stored while 0006 held.

Paste `schema/migrations/0006_leaderboard_write_lockdown_rollback.sql` and run it. It is safe to run twice, and safe on a database that never had 0006. Then run the checks in step 2 again. Each gives its printed answer.

If the app change is still writing with the anon key when you roll back, nothing breaks. The rollback gives that key its insert back. A site that writes with the service key keeps working too.

The rollback brings the hole back on purpose. Anyone with the anon key may again store any row past the API route, and may again empty the table.

## 6. Known limits

- A script can still post through the API within its rules. Board positions are public in the repo, so a script can send a perfect row at the floor.
- The API's rate limit counts per server instance. Each new instance starts its own count.
- The piece count and study seconds of a daily row are checked by the API only. The daily schedule lives in code, so the table cannot know a day's setting. The table still holds a daily row to the floor for its own piece count and caps study at 60 seconds.
