# Runbook: add `mode` to `leaderboard_entries` for the blindfold boards

Migration 0008 changes the live leaderboard table in four ways:

- `mode TEXT NOT NULL DEFAULT 'board'`. Every row already in the table reads `'board'`, a round studied on the board. A constant default is kept in the catalog, so the table is not rewritten.
- `check_mode_known`: the mode is `'board'` or `'blindfold'`.
- `check_daily_board_mode`: a daily row is always `'board'`. The daily board is one position every player studies on the board.
- `idx_leaderboard_blindfold_ranking`, a partial index for one blindfold board, in `RANKING_ORDER`.

The site reads and writes the column only when the build sets `NEXT_PUBLIC_BLINDFOLD_LEADERBOARD=1`. Until then a board read names no mode, a board score is stored exactly as before, and the API refuses a blindfold score or read with a 400. That is what makes the order below safe.

Rehearsed before you got here. `schema/__tests__/leaderboardMode.test.ts` applies the migration twice and the rollback twice on PGlite, checks the old row reads `'board'`, and checks the rollback refuses while blindfold rows exist.

---

## Order

1. Merge the PR and let it deploy with `NEXT_PUBLIC_BLINDFOLD_LEADERBOARD` unset. Blindfold rounds play, and their result screens offer no submission.
2. Back up (step 1 below), then run 0008 (step 3).
3. Verify (step 4).
4. In Vercel, set `NEXT_PUBLIC_BLINDFOLD_LEADERBOARD` to `1` for Production, then redeploy. A `NEXT_PUBLIC_` value is inlined at build time, so changing it without a redeploy does nothing.
5. Check the live site (step 5).

Never set the variable before 0008 has run. A board read would then filter on a column that does not exist, and every ranked board would show the unavailable state.

---

## 1. Back up first

Take the same backups as `docs/migrations/2026-09-leaderboard-country-code.md` step 1: a Supabase backup, a CSV export of `leaderboard_entries`, and a `pg_dump --table=public.leaderboard_entries`.

## 2. Pre-checks

```sql
SELECT COUNT(*) AS total_rows FROM leaderboard_entries;

SELECT difficulty, COUNT(*) AS rows
FROM leaderboard_entries
GROUP BY difficulty
ORDER BY difficulty;

-- Expect no row: the column does not exist yet.
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'leaderboard_entries' AND column_name = 'mode';
```

## 3. Apply

Paste `schema/migrations/0008_leaderboard_mode.sql` into the SQL editor and run it once. It runs in one transaction with a five-second lock timeout. If it times out, nothing changed. Run it again at a quieter moment.

## 4. Verify

```sql
-- The same totals as step 2, every row now 'board'.
SELECT mode, COUNT(*) AS rows FROM leaderboard_entries GROUP BY mode;

SELECT conname, pg_get_constraintdef(oid) AS definition
FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass
  AND conname IN ('check_mode_known', 'check_daily_board_mode')
ORDER BY conname;

SELECT indexdef FROM pg_indexes WHERE indexname = 'idx_leaderboard_blindfold_ranking';
```

Expect one `board` group with the step 2 total, both constraints, and the index.

## 5. After the redeploy

```bash
curl -s -o /dev/null -w '%{http_code}\n' 'https://thememorychess.com/api/leaderboard?difficulty=medium&mode=blindfold'
curl -s 'https://thememorychess.com/api/leaderboard?difficulty=medium' | head -c 300
```

Expect `200` for the blindfold board and the usual medium rows for the board board. Open `/leaderboard`, press **Blindfold**, and confirm the empty blindfold board shows. Then update `schema/leaderboard_schema.sql` to describe the table after 0008, in its own PR.

---

## Rollback

1. Unset `NEXT_PUBLIC_BLINDFOLD_LEADERBOARD` and redeploy. The site stops reading the column.
2. Run `schema/migrations/0008_leaderboard_mode_rollback.sql`. It refuses while any blindfold row is stored, since dropping the column would file those scores on the board-study boards. Export or delete them first:

```sql
SELECT * FROM leaderboard_entries WHERE mode = 'blindfold';
```
