/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres, type SqlResult } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");
const MIGRATION = readSql("migrations/0004_leaderboard_rating_and_daily.sql");
const ROLLBACK = readSql("migrations/0004_leaderboard_rating_and_daily_rollback.sql");
// uuid_generate_v4 needs the uuid-ossp extension, which PGlite does not ship.
const SCHEMA = readSql("leaderboard_schema.sql").replace("uuid_generate_v4()", "gen_random_uuid()");

// The live table as it stood after 0001, with its difficulty check declared
// inline the way the production table was created.
const BEFORE_0004 = `
  CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster')),
    piece_count INTEGER NOT NULL,
    correct_pieces INTEGER NOT NULL,
    memorize_time DECIMAL(10, 3) NOT NULL,
    solution_time DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_wrong_pieces INTEGER,
    country_code TEXT NOT NULL DEFAULT 'ZZ',
    CHECK (correct_pieces <= piece_count),
    CHECK (memorize_time > 0),
    CHECK (solution_time > 0)
  );
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_player_name_length
    CHECK (LENGTH(player_name) >= 4 AND LENGTH(player_name) <= 16);
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_country_code_format
    CHECK (country_code ~ '^[A-Z]{2}$');
  CREATE INDEX idx_leaderboard_ranking ON leaderboard_entries (
    difficulty, correct_pieces DESC, memorize_time ASC, solution_time ASC
  );
`;

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

async function before0004(): Promise<Database> {
  const db = await postgres.open();
  await db.rows(BEFORE_0004);
  return db;
}

/** Inserts one round with the given extra columns, each value written as SQL. */
const insert = (db: Database, extra: Record<string, string>) =>
  db.attempt(
    `INSERT INTO leaderboard_entries (player_name, piece_count, correct_pieces, memorize_time, solution_time, ${Object.keys(extra).join(", ")})
     VALUES ('Poteto', 6, 4, 8.25, 12.5, ${Object.values(extra).join(", ")})`,
  );

const codeOf = (result: SqlResult) => (result.ok ? null : result.code);

describe("0004 leaderboard rating and daily", () => {
  it("reads 1000 and no daily day from a row stored before it, and is a no-op the second time", async () => {
    const db = await before0004();
    await db.rows(`INSERT INTO leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
                   VALUES ('Oldtimer', 'medium', 6, 5, 7.5, 11.25)`);

    await db.rows(MIGRATION);
    const once = await db.rows(SHAPE);
    await db.rows(MIGRATION);

    expect(await db.rows(SHAPE)).toEqual(once);
    expect(await db.rows("SELECT player_name, skill_rating, daily_day FROM leaderboard_entries")).toEqual([
      { player_name: "Oldtimer", skill_rating: 1000, daily_day: null },
    ]);
  });

  it("stores a daily row only with its day, a board row only without one, and a rating from 0 to 5000", async () => {
    const db = await before0004();
    await db.rows(MIGRATION);

    expect(codeOf(await insert(db, { difficulty: "'daily'", daily_day: "'2026-10-13'", skill_rating: "1240" }))).toBeNull();
    expect(codeOf(await insert(db, { difficulty: "'medium'", skill_rating: "1240" }))).toBeNull();
    expect(codeOf(await insert(db, { difficulty: "'daily'", skill_rating: "1240" }))).toBe(CHECK_VIOLATION);
    expect(codeOf(await insert(db, { difficulty: "'medium'", daily_day: "'2026-10-13'", skill_rating: "1240" }))).toBe(CHECK_VIOLATION);
    expect(codeOf(await insert(db, { difficulty: "'weekly'", skill_rating: "1240" }))).toBe(CHECK_VIOLATION);
    expect(codeOf(await insert(db, { difficulty: "'medium'", skill_rating: "-1" }))).toBe(CHECK_VIOLATION);
    expect(codeOf(await insert(db, { difficulty: "'hard'", skill_rating: "5000" }))).toBeNull();
    expect(codeOf(await insert(db, { difficulty: "'hard'", skill_rating: "5001" }))).toBe(CHECK_VIOLATION);
    expect(await db.rows("SELECT difficulty, daily_day::text AS daily_day, skill_rating FROM leaderboard_entries ORDER BY difficulty")).toEqual([
      { difficulty: "daily", daily_day: "2026-10-13", skill_rating: 1240 },
      { difficulty: "hard", daily_day: null, skill_rating: 5000 },
      { difficulty: "medium", daily_day: null, skill_rating: 1240 },
    ]);
  });

  it("leaves the table exactly as leaderboard_schema.sql describes it", async () => {
    const migrated = await before0004();
    await migrated.rows(MIGRATION);
    const fromSchema = await postgres.open();
    await fromSchema.rows(SCHEMA);

    expect(await fromSchema.rows(SHAPE)).toEqual(await migrated.rows(SHAPE));
  });

  it("rolls back to the table it found, twice over", async () => {
    const db = await before0004();
    const found = await db.rows(SHAPE);
    await db.rows(MIGRATION);

    await db.rows(ROLLBACK);
    await db.rows(ROLLBACK);

    expect(await db.rows(SHAPE)).toEqual(found);
  });

  it("refuses to roll back while daily rows exist, and changes nothing", async () => {
    const db = await before0004();
    await db.rows(MIGRATION);
    await insert(db, { difficulty: "'daily'", daily_day: "'2026-10-13'", skill_rating: "1240" });
    const migrated = await db.rows(SHAPE);

    expect(codeOf(await db.attempt(ROLLBACK))).toBe(RAISED);
    expect(await db.rows(SHAPE)).toEqual(migrated);
  });
});
