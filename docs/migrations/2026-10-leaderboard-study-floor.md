# Runbook: a study-time floor on `leaderboard_entries`

Migration 0009 adds one check to the live leaderboard table:

- `check_memorize_time_floor`: `memorize_time >= GREATEST(0.3, piece_count * 0.1)`, created `NOT VALID`.

Postgres tests every new insert and every update against it and leaves the rows already stored alone. The migration does not validate the check, and nothing should: old rows under the floor stay in the table, and the site hides them (below).

**Apply it only after migration 0006.** 0006 adds the other `NOT VALID` checks and revokes anon writes. The site writes through `service_role`, which is subject to table checks, so the order matters only for the counts in step 2. Do not run 0009 first and 0006 later without repeating those counts.

## What the site does without it

The merge that ships this runbook already does the work in code, so 0009 is the second lock, not the first.

- `POST /api/leaderboard` refuses a ranked row (easy, medium, hard, grandmaster, in either mode) whose study time is under `max(0.3, 0.1 per piece)` seconds. That is 0.3 s for 2 pieces, 0.6 s for 6, 1.2 s for 12 and 2 s for 20. The daily board is unchanged: its study time is fixed by the day, and every setting the schedule can produce is above the floor.
- Every ranked board read, the cutoff each board is held to, and the standing a player is shown filter out rows under that floor. The rows stay stored.
- The route also refuses a `skill_rating` above 3700, the most the rating engine reaches in any round a ranked board accepts.

Applying 0009 makes the database refuse what the route already refuses, for anything that writes to the table without going through the route.

## Order

1. Merge the PR and let it deploy. The route and reads change at once. No migration is needed for them.
2. Confirm 0006 is applied (step 2), back up (step 1), then run 0009 (step 3).
3. Verify (step 4).

## 1. Back up first

Take the same backups as `docs/migrations/2026-09-leaderboard-country-code.md` step 1: a Supabase backup, a CSV export of `leaderboard_entries`, and a `pg_dump --table=public.leaderboard_entries`.

## 2. Pre-checks

```sql
-- Expect one row: 0006 is applied.
SELECT conname FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass AND conname = 'check_board_piece_count';

-- Expect no row: 0009 is not applied yet.
SELECT conname FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass AND conname = 'check_memorize_time_floor';

-- The rows the site now hides, per board. They are kept.
SELECT difficulty, COUNT(*) AS rows_under_floor
FROM leaderboard_entries
WHERE memorize_time < GREATEST(0.3, piece_count * 0.1)
GROUP BY difficulty
ORDER BY difficulty;
```

## 3. Apply

Paste `schema/migrations/0009_leaderboard_study_floor.sql` into the SQL editor and run it once. It runs in one transaction with a five-second lock timeout. If it times out, nothing changed. Run it again at a quieter moment. Adding a `NOT VALID` check does not scan the table.

## 4. Verify

```sql
SELECT conname, convalidated, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass AND conname = 'check_memorize_time_floor';
```

Expect `convalidated` false and the definition `CHECK ((memorize_time >= GREATEST(0.3, ((piece_count)::numeric * 0.1)))) NOT VALID`.

Then check the table still has every row the step 2 total counted, and that the board still reads:

```bash
curl -s 'https://thememorychess.com/api/leaderboard?difficulty=easy' | head -c 300
```

The first row should study for at least 0.3 s.

## Rollback

Run `schema/migrations/0009_leaderboard_study_floor_rollback.sql`. It drops the check and nothing else, and is safe to run twice or on a database that never had 0009. The route and the reads keep applying the floor until the PR is reverted.

Rehearsed before you got here. `schema/__tests__/leaderboardStudyFloor.test.ts` applies the migration twice and the rollback twice on PGlite, checks that rows under the floor survive it, and checks the boundary of each board's floor.
