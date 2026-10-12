# Runbook: add `skill_rating` and `daily_day` to `leaderboard_entries`

Migration 0004 changes the live leaderboard table in five ways:

- `skill_rating INTEGER NOT NULL DEFAULT 1000`, checked `BETWEEN 0 AND 5000`. Every row already in the table reads 1000, the rating every player starts from.
- `daily_day DATE`, nullable. It names the UTC day a daily board belongs to.
- The difficulty check also allows `'daily'`. The old check was declared inline, so Postgres named it. The migration finds it by the column it reads and replaces it with `check_difficulty_board`.
- `check_daily_day_matches_board`: a `daily` row must carry a day, and no other row may.
- `idx_leaderboard_daily_ranking`, a partial index for one day's daily board.

You will be in the Supabase dashboard, pasting SQL by hand, against a table of real player scores. Work top to bottom. Do not skip step 1.

Rehearsed before you got here. `schema/__tests__/leaderboardRatingAndDaily.test.ts` applies the migration twice and the rollback twice on PGlite, and checks that the result matches `schema/leaderboard_schema.sql`. The migration and rollback were also run over a 376-row copy of real rows: the checksum of the old columns did not change, and every row read 1000.

---

## 1. Back up first

Take the same three backups as the September runbook, `docs/migrations/2026-09-leaderboard-country-code.md` step 1:

- 1a. Supabase backup. Dashboard → **Database** → **Backups**. Create one, or confirm the newest automatic one is from today.
- 1b. CSV export. Dashboard → **Table Editor** → `leaderboard_entries` → **Export as CSV**.
- 1c. `pg_dump --table=public.leaderboard_entries` over the direct connection on port 5432.

The public API is not a backup. It caps each board at 200 rows and hides rows with no correct piece.

---

## 2. Pre-checks

Run these before you apply, and write the numbers down. Step 4 runs them again.

```sql
SELECT COUNT(*) AS total_rows FROM leaderboard_entries;

SELECT difficulty, COUNT(*) AS rows
FROM leaderboard_entries
GROUP BY difficulty
ORDER BY difficulty;

-- One checksum over every column the table has today.
SELECT md5(string_agg(digest, '' ORDER BY digest)) AS table_checksum
FROM (
  SELECT md5(ROW(
    id, player_name, difficulty, piece_count, correct_pieces,
    memorize_time, solution_time, created_at, total_wrong_pieces, country_code
  )::text) AS digest
  FROM leaderboard_entries
) rows;

-- The checks on the table. Expect exactly one that reads difficulty alone,
-- most likely named leaderboard_entries_difficulty_check.
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass
  AND contype = 'c'
ORDER BY conname;

-- The row-level security policies. An INSERT policy whose WITH CHECK lists
-- columns, or a SELECT policy that filters on difficulty, may need the new
-- columns or the daily board. Write each policy down.
SELECT policyname, cmd, roles, qual, with_check
FROM pg_policies
WHERE tablename = 'leaderboard_entries';

-- Column grants. Empty means anon and authenticated hold table-wide grants,
-- which cover the new columns. Any row means grants are per column, and the
-- new columns need a grant of their own before the app can write them.
SELECT grantee, privilege_type, column_name
FROM information_schema.column_privileges
WHERE table_name = 'leaderboard_entries'
  AND grantee IN ('anon', 'authenticated')
ORDER BY grantee, privilege_type, column_name;
```

| | Before | After |
|---|---|---|
| `total_rows` | | |
| easy / medium / hard / grandmaster | | |
| `table_checksum` | | |
| check on difficulty | | |
| RLS policies | | |
| column grants | | |

If more than one check reads `difficulty` alone, stop and ask. The migration replaces every one of them. If a policy names difficulty values or columns, or grants are per column, stop and ask too.

---

## 3. Apply

Paste the whole of `schema/migrations/0004_leaderboard_rating_and_daily.sql` into the SQL editor and run it in one go, including every `DO $$ ... $$;` block.

**What success looks like.** `Success. No rows returned`, in about a second.

Neither new column rewrites the table. A column with a constant default is stored as metadata since Postgres 11. Each new check scans the table once, and the index build reads it once. On a table of a few thousand rows that is instant. Each `ALTER TABLE` holds an exclusive lock that blocks reads as well as writes, and the index build blocks writes, so a board load or a score submitted in that second waits for it.

The file starts with `SET lock_timeout = '5s'`. If another transaction holds the table, the migration gives up after five seconds with `canceling statement due to lock timeout` rather than queue every leaderboard read behind it. Wait a minute and run it again.

**If it errors,** nothing was applied. The SQL editor runs a paste as one transaction, so a failure rolls back every statement before it. Read the error, fix the cause and run the whole file again. Each statement is also guarded, so a file that ran before does nothing the second time.

Then reload the PostgREST schema cache. Until it reloads, an insert naming `skill_rating` still fails with `PGRST204`:

```sql
NOTIFY pgrst, 'reload schema';
```

---

## 4. Verify

Run the pre-checks again. Rows, counts per board and `table_checksum` must match what you wrote down. The checksum lists the old columns only, so it compares directly. If it differs, stop and restore from step 1.

Then confirm the new shape:

```sql
-- Exactly one row: 1000, with the full row count.
SELECT skill_rating, COUNT(*) AS rows
FROM leaderboard_entries
GROUP BY skill_rating;

-- 0.
SELECT COUNT(*) AS rows_with_a_day FROM leaderboard_entries WHERE daily_day IS NOT NULL;

-- Lists check_daily_day_matches_board, check_difficulty_board and
-- check_skill_rating_range, and no other check on difficulty alone.
SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass
  AND contype = 'c'
ORDER BY conname;

-- One row, idx_leaderboard_daily_ranking, ending in WHERE (difficulty = 'daily'::text).
SELECT indexname, indexdef FROM pg_indexes WHERE indexname = 'idx_leaderboard_daily_ranking';
```

Probe the checks as the role the site uses, inside a transaction you roll back, so production gains no rows. `SET LOCAL ROLE anon` runs the insert under the same RLS policies and grants as a player's submission:

```sql
BEGIN;
SET LOCAL ROLE anon;
INSERT INTO leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time, skill_rating, daily_day)
VALUES ('Runbook probe', 'daily', 6, 4, 8.25, 12.5, 1240, '2026-10-13');
SELECT difficulty, skill_rating, daily_day FROM leaderboard_entries WHERE player_name = 'Runbook probe';
ROLLBACK;
```

Expect one row back, `daily | 1240 | 2026-10-13`. A permission or policy error means anon cannot write the new columns: stop and fix the grant or policy before the deploy. A `daily` insert without the day, or a `medium` insert with one, must fail with `check_daily_day_matches_board`, and a `skill_rating` of 5001 with `check_skill_rating_range`.

Finally read a row through the site. `GET /api/leaderboard?difficulty=medium` returns `skill_rating` on every row.

---

## 5. Order of operations with the deploy

**Migrate first, then deploy.** Either order keeps scores flowing, but this one loses no ratings.

- Migrate first. The running app never names the new columns. Its inserts take the default 1000, and its `select('*')` reads ignore the extra fields.
- Deploy first. The new app sends `skill_rating`, PostgREST answers `PGRST204`, and the service retries without it. The score is stored with a rating of 1000 and the server log says `the rating and daily migration (0004) is outstanding`. Every rating submitted in the gap is lost. A daily score cannot be stored at all until the migration runs.

A browser tab that loaded the old app before the deploy submits without `skill_rating`. The new API stores that score with 1000. A rating above 5000 is stored as 5000.

### After the deploy

Submit one probe score through the site's own API and read it back:

```bash
curl -s -X POST https://thememorychess.com/api/leaderboard \
  -H 'Content-Type: application/json' \
  -d '{"player_name":"Runbook probe","difficulty":"easy","piece_count":2,"correct_pieces":1,"memorize_time":1.5,"solution_time":2.5,"total_wrong_pieces":1,"skill_rating":1240}'
```

Expect `"success":true` and a row carrying `"skill_rating":1240` and `"daily_day":null`. The probe shows on the Easy board until you delete it. The server log must not say `the rating and daily migration (0004) is outstanding`. Then delete the probe in the SQL editor, by the `id` the response returned:

```sql
DELETE FROM leaderboard_entries WHERE id = '<id from the response>' AND player_name = 'Runbook probe';
```

Once the migration is applied everywhere, delete the 0004 retry in `submitLeaderboardEntry` in `src/lib/services/leaderboardService.ts`.

---

## 6. Rollback

### When to use it

Only if the migration itself went wrong: the checksum in step 4 did not match, or a check rejects writes it should accept. A bug in the app is a reason to roll back the deploy, not the columns. Unused columns cost nothing.

### Daily rows block it

The old difficulty check cannot hold a `daily` row, so the rollback stops with an error and changes nothing while any exist. Export them first, then decide:

```sql
SELECT * FROM leaderboard_entries WHERE difficulty = 'daily';
-- Only after exporting them, and only if you mean to discard them:
DELETE FROM leaderboard_entries WHERE difficulty = 'daily';
```

### The SQL

Paste the whole of `schema/migrations/0004_leaderboard_rating_and_daily_rollback.sql` and run it. Like the migration, it sets a five-second lock timeout and applies nothing if it fails. It is safe to run twice and safe on a half-applied migration. It drops the index and the two new checks, restores the original difficulty check as `leaderboard_entries_difficulty_check`, and drops both columns. Run `NOTIFY pgrst, 'reload schema';` afterwards.

### What it does not undo

**It destroys every rating and every daily day that was written.**

- After the new app has been live, players have submitted real ratings. Dropping the column discards them. Re-running the migration gives every row 1000 again.
- The only way back to those values is the backup from step 1, which also reverts every score submitted since.
- So the rollback is safe only between apply and deploy, while every row still reads 1000. After the deploy, prefer rolling back the app.

Rows, the other columns, the other checks, `idx_leaderboard_ranking` and the RLS policies stay as they were.
