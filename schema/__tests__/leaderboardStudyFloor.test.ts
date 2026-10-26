/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres, type SqlResult } from "./database";
import { TABLE_BEFORE_0006 } from "./leaderboardWriteLockdownDatabase";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");
const MIGRATION = readSql("migrations/0009_leaderboard_study_floor.sql");
const ROLLBACK = readSql("migrations/0009_leaderboard_study_floor_rollback.sql");

const CHECK_VIOLATION = "23514";

const CONSTRAINTS = `
  SELECT conname, convalidated, pg_get_constraintdef(oid) AS def
  FROM pg_constraint
  WHERE conrelid = 'leaderboard_entries'::regclass
  ORDER BY conname
`;

let postgres: Postgres;
beforeAll(async () => {
  postgres = await startPostgres();
}, 60_000);
afterEach(() => postgres.closeAll());
afterAll(() => postgres.stop());

async function before0009(): Promise<Database> {
  const db = await postgres.open();
  await db.rows(TABLE_BEFORE_0006);
  return db;
}

const insert = (db: Database, pieces: number, memorize: number) =>
  db.attempt(
    `INSERT INTO leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
     VALUES ('Poteto', 'medium', ${pieces}, 1, ${memorize}, ${pieces * 3})`,
  );

const codeOf = (result: SqlResult) => (result.ok ? null : result.code);

describe("0009 leaderboard study floor", () => {
  it("keeps the 0.067 s and 0.565 s rows it found, unvalidated, and is a no-op the second time", async () => {
    const db = await before0009();
    await db.rows(`INSERT INTO leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
                   VALUES ('Quickdraw', 'easy', 2, 2, 0.067, 1.5), ('Sprinter', 'medium', 6, 6, 0.565, 9)`);

    await db.rows(MIGRATION);
    const once = await db.rows(CONSTRAINTS);
    await db.rows(MIGRATION);

    expect(await db.rows(CONSTRAINTS)).toEqual(once);
    expect(once.filter((row) => row.conname === "check_memorize_time_floor")).toEqual([
      { conname: "check_memorize_time_floor", convalidated: false, def: "CHECK ((memorize_time >= GREATEST(0.3, ((piece_count)::numeric * 0.1)))) NOT VALID" },
    ]);
    expect(await db.rows("SELECT player_name FROM leaderboard_entries ORDER BY player_name")).toEqual([{ player_name: "Quickdraw" }, { player_name: "Sprinter" }]);
  });

  it.each([
    [2, 0.299, CHECK_VIOLATION],
    [2, 0.3, null],
    [6, 0.599, CHECK_VIOLATION],
    [6, 0.6, null],
    [12, 1.199, CHECK_VIOLATION],
    [12, 1.2, null],
    [20, 1.999, CHECK_VIOLATION],
    [20, 2, null],
  ])("refuses or stores a %i-piece row studied %f s", async (pieces, memorize, code) => {
    const db = await before0009();
    await db.rows(MIGRATION);

    expect(codeOf(await insert(db, pieces, memorize))).toBe(code);
  });

  it("rolls back to the table it found, twice over, and on a table that never had it", async () => {
    const db = await before0009();
    const found = await db.rows(CONSTRAINTS);
    await db.rows(ROLLBACK);
    await db.rows(MIGRATION);

    await db.rows(ROLLBACK);
    await db.rows(ROLLBACK);

    expect(await db.rows(CONSTRAINTS)).toEqual(found);
    expect(codeOf(await insert(db, 6, 0.1))).toBeNull();
  });
});
