# Runbook: add `country_code` to `leaderboard_entries`

Adds one column to the live leaderboard table:
`country_code TEXT NOT NULL DEFAULT 'ZZ'`, checked against `^[A-Z]{2}$`.
Every row already in the table becomes `ZZ`, which is the "world" option.

You will be in the Supabase dashboard, pasting SQL by hand, against a table
with thousands of real player scores and no undo button. Work top to bottom.
Do not skip step 1.

Rehearsed against real Postgres before you got here:
`npm run migrate:rehearse`. It applies this exact file to a seeded copy of the
live rows and fails loudly if any existing row changes. Run it once now if you
want to watch it pass.

---

## 1. Back up first

Take **all three**. They fail in different ways, and this is the only step that
cannot be redone after something goes wrong.

### 1a. Supabase's own backup

Dashboard → **Database** → **Backups** → **Create backup** (or note the
timestamp of the most recent automatic one, and confirm it is from *today*).

This is the only backup that restores the whole project, including RLS policies
and indexes.

### 1b. CSV export of the table

Dashboard → **Table Editor** → `leaderboard_entries` → **Export** → **Export as
CSV**. Save it somewhere you will still be able to find in a hurry.

This is the one you can actually read and diff if a handful of rows look wrong.

### 1c. `pg_dump`

Using a connection string you already have:

```bash
pg_dump "$SUPABASE_DB_URL" \
  --table=public.leaderboard_entries \
  --no-owner --no-privileges \
  --file="leaderboard_entries_$(date +%Y%m%d-%H%M).sql"
```

Two things that bite here:

- Use the **direct connection** string (port `5432`) or the **session pooler**.
  `pg_dump` does not work through the transaction pooler on port `6543`.
- Your local `pg_dump` must be at least as new as the server's Postgres, or it
  refuses to run. `pg_dump --version` against the version shown in
  Dashboard → **Settings** → **Infrastructure**.

### Why the public API is not a backup

Tempting, because `/api/leaderboard` returns JSON and needs no credentials. It
is not a backup:

`LEADERBOARD_ROW_LIMIT` is **200**, applied *per difficulty*, and easy already
returns **exactly 200**. A response that hits the cap exactly is
indistinguishable from a complete one — there is no "there is more" marker. So
the API silently omits an unknown number of easy rows, and will start omitting
medium rows the moment that difficulty crosses 200.

The API also filters `correct_pieces > 0`, so rows scoring zero never appear at
all, at any difficulty.

---

## 2. Pre-checks

Run these **before** applying and write the numbers down. You re-run the same
queries in step 4 and compare.

```sql
-- Total rows
SELECT COUNT(*) AS total_rows FROM leaderboard_entries;

-- Rows per difficulty
SELECT difficulty, COUNT(*) AS rows
FROM leaderboard_entries
GROUP BY difficulty
ORDER BY difficulty;

-- One checksum over every existing column of every row.
-- Ordering by the digest makes it independent of physical row order.
SELECT md5(string_agg(digest, '' ORDER BY digest)) AS table_checksum
FROM (
  SELECT md5(ROW(
    id, player_name, difficulty, piece_count, correct_pieces,
    memorize_time, solution_time, created_at, total_wrong_pieces
  )::text) AS digest
  FROM leaderboard_entries
) rows;
```

Record:

| | Before | After |
|---|---|---|
| `total_rows` | | |
| easy / medium / hard / grandmaster | | |
| `table_checksum` | | |

---

## 3. Apply

Paste this into the SQL editor and run it. It is the contents of
`schema/migrations/0001_leaderboard_country_code.sql` — paste **the whole
thing**, including the `DO $$ ... $$;` block, in one go.

```sql
ALTER TABLE leaderboard_entries
  ADD COLUMN IF NOT EXISTS country_code TEXT NOT NULL DEFAULT 'ZZ';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_country_code_format'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      ADD CONSTRAINT check_country_code_format
      CHECK (country_code ~ '^[A-Z]{2}$');
  END IF;
END
$$;
```

**What success looks like:** `Success. No rows returned`. It finishes in well
under a second. There is no progress bar and no row count — that is correct,
neither statement returns rows.

Adding the column does **not** rewrite the table: since Postgres 11, a new
column with a constant default is stored as metadata rather than written into
every row, and Supabase runs 15 or later. Adding the `CHECK` does scan the
table once to verify existing rows, but a scan of a few thousand rows is
instant.

**If it errors, nothing has been half-applied** — each statement is atomic, and
the whole file is safe to re-run. Read the error, fix it, run the file again.

---

## 4. Verify

```sql
-- Same three pre-checks. All three must match what you wrote down.
SELECT COUNT(*) AS total_rows FROM leaderboard_entries;

SELECT difficulty, COUNT(*) AS rows
FROM leaderboard_entries
GROUP BY difficulty
ORDER BY difficulty;

SELECT md5(string_agg(digest, '' ORDER BY digest)) AS table_checksum
FROM (
  SELECT md5(ROW(
    id, player_name, difficulty, piece_count, correct_pieces,
    memorize_time, solution_time, created_at, total_wrong_pieces
  )::text) AS digest
  FROM leaderboard_entries
) rows;
```

The checksum deliberately lists the old columns only, so it is directly
comparable across the migration. **It must be identical.** If it is not, stop
and restore from step 1.

Then confirm the new column landed the way it should:

```sql
-- Must return exactly one row: ZZ, with the full row count.
SELECT country_code, COUNT(*) AS rows
FROM leaderboard_entries
GROUP BY country_code;

-- Must return 0.
SELECT COUNT(*) AS not_zz
FROM leaderboard_entries
WHERE country_code <> 'ZZ';

-- Must list check_country_code_format.
SELECT conname
FROM pg_constraint
WHERE conrelid = 'leaderboard_entries'::regclass
  AND contype = 'c';
```

---

## 5. Order of operations with the deploy

**Migrate first, then deploy. Not the other way round.**

The old app never mentions `country_code` — it inserts an explicit column list
without it, and the `DEFAULT 'ZZ'` covers what it leaves out. So the running
site keeps working normally between the migration and the deploy. Its reads use
`select('*')`, so it will start receiving a `country_code` field it simply
ignores.

Deploy first and every score submission breaks: the new code sends
`country_code`, the column does not exist yet, and PostgREST rejects the insert.
Players lose scores for the length of the gap.

There is no reverse hazard. Migrating early is free; the column just sits there
full of `ZZ` until the new code ships.

---

## 6. Rollback

### When to use it

Only if the migration itself went wrong — the checksum in step 4 did not match,
or the constraint is rejecting writes it should accept. A bug in the *app* is
not a reason to drop the column; roll back the deploy instead and leave the
column alone. An unused column costs nothing.

### The SQL

Contents of `schema/migrations/0001_leaderboard_country_code_rollback.sql`:

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'check_country_code_format'
      AND conrelid = 'leaderboard_entries'::regclass
  ) THEN
    ALTER TABLE leaderboard_entries
      DROP CONSTRAINT check_country_code_format;
  END IF;
END
$$;

ALTER TABLE leaderboard_entries
  DROP COLUMN IF EXISTS country_code;
```

### What it does not undo

**It destroys every country code that was written.** Be clear-eyed about this:

- If the new app code has been live for any amount of time, players have been
  submitting real countries. `DROP COLUMN` discards all of those values
  permanently. They are not recoverable by re-adding the column — re-running
  the migration gives every row `ZZ` again, including the ones that had a real
  country a minute earlier.
- The only way back to those values is restoring the backup from step 1, which
  also reverts every score submitted since the backup was taken.
- So the rollback is genuinely safe **only in the window between apply and
  deploy**, when every row still reads `ZZ` and there is nothing to lose. After
  the deploy, treat it as destructive and prefer rolling back the app.

Everything else in the table is untouched: the rollback only removes the column
and its constraint, and leaves rows, indexes, RLS policies and every other
column exactly as they were.
