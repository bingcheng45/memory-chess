/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres, type SqlResult } from "./database";
import { TABLE_BEFORE_0006 } from "./leaderboardWriteLockdownDatabase";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");
const MIGRATION = readSql("migrations/0008_leaderboard_mode.sql");
const ROLLBACK = readSql("migrations/0008_leaderboard_mode_rollback.sql");

const CHECK_VIOLATION = "23514";
const RAISED = "P0001";

const SHAPE = `
  SELECT 'column' AS kind, column_name || ' ' || data_type || ' ' || is_nullable || ' ' || coalesce(column_default, '-') AS def
  FROM information_schema.columns
  WHERE table_name = 'leaderboard_entries'
  UNION ALL
  SELECT 'constraint', conname || ' ' || pg_get_constraintdef(oid)
  FROM pg_constraint
  WHERE conrelid = 'leaderboard_entries'::regclass
  UNION ALL
  SELECT 'index', indexdef
  FROM pg_indexes
  WHERE tablename = 'leaderboard_entries'
  ORDER BY 1, 2
`;

let postgres: Postgres;
beforeAll(async () => {
  postgres = await startPostgres();
}, 60_000);
afterEach(() => postgres.closeAll());
afterAll(() => postgres.stop());

async function before0008(): Promise<Database> {
  const db = await postgres.open();
  await db.rows(TABLE_BEFORE_0006);
  return db;
}

const insert = (db: Database, extra: Record<string, string>) =>
  db.attempt(
    `INSERT INTO leaderboard_entries (player_name, piece_count, correct_pieces, memorize_time, solution_time, ${Object.keys(extra).join(", ")})
     VALUES ('Poteto', 6, 4, 8.25, 12.5, ${Object.values(extra).join(", ")})`,
  );

const codeOf = (result: SqlResult) => (result.ok ? null : result.code);

describe("0008 leaderboard mode", () => {
  it("reads 'board' from a row stored before it, and is a no-op the second time", async () => {
    const db = await before0008();
    await db.rows(`INSERT INTO leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
                   VALUES ('Oldtimer', 'medium', 6, 5, 7.5, 11.25)`);

    await db.rows(MIGRATION);
    const once = await db.rows(SHAPE);
    await db.rows(MIGRATION);

    expect(await db.rows(SHAPE)).toEqual(once);
    expect(await db.rows("SELECT player_name, mode FROM leaderboard_entries")).toEqual([{ player_name: "Oldtimer", mode: "board" }]);
  });

  it("stores a blindfold row on a ranked board, never on the daily board, and no unknown mode", async () => {
    const db = await before0008();
    await db.rows(MIGRATION);

    const codes = [
      await insert(db, { difficulty: "'medium'" }),
      await insert(db, { difficulty: "'medium'", mode: "'blindfold'" }),
      await insert(db, { difficulty: "'daily'", daily_day: "(now() AT TIME ZONE 'UTC')::date", mode: "'blindfold'" }),
      await insert(db, { difficulty: "'medium'", mode: "'touch'" }),
    ].map(codeOf);

    expect(codes).toEqual([null, null, CHECK_VIOLATION, CHECK_VIOLATION]);
    expect(await db.rows("SELECT difficulty, mode FROM leaderboard_entries ORDER BY mode")).toEqual([
      { difficulty: "medium", mode: "blindfold" },
      { difficulty: "medium", mode: "board" },
    ]);
  });

  it("rolls back to the table it found, twice over, and on a table that never had it", async () => {
    const db = await before0008();
    const found = await db.rows(SHAPE);
    await db.rows(ROLLBACK);
    await db.rows(MIGRATION);

    await db.rows(ROLLBACK);
    await db.rows(ROLLBACK);

    expect(await db.rows(SHAPE)).toEqual(found);
  });

  it("refuses to roll back while a blindfold row is stored", async () => {
    const db = await before0008();
    await db.rows(MIGRATION);
    await insert(db, { difficulty: "'hard'", mode: "'blindfold'" });

    expect(codeOf(await db.attempt(ROLLBACK))).toBe(RAISED);
    await db.attempt("ROLLBACK");
    expect(await db.rows("SELECT mode FROM leaderboard_entries")).toEqual([{ mode: "blindfold" }]);
  });
});
