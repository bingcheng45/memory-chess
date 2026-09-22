#!/usr/bin/env node
/**
 * Rehearses schema/migrations/0001_leaderboard_country_code.sql on a real
 * Postgres before anyone runs it against production.
 *
 * The migration is applied by hand in the Supabase SQL editor against a table
 * with thousands of rows and no undo button. Reading the SQL is not evidence
 * that it leaves those rows alone. This builds the pre-migration table in an
 * in-process Postgres, seeds it from a snapshot of real rows, applies the
 * migration, and checks that every pre-existing row is byte-identical
 * afterwards.
 *
 * The snapshot is gitignored evidence. Copy it in before running:
 *   .verify-evidence/fixtures/leaderboard-rows.json
 *
 * Usage: npm run migrate:rehearse
 * Exits non-zero if any check fails.
 */
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const SCHEMA_FILE = new URL("../schema/leaderboard_schema.sql", import.meta.url);
const MIGRATION_FILE = new URL(
  "../schema/migrations/0001_leaderboard_country_code.sql",
  import.meta.url,
);
const ROLLBACK_FILE = new URL(
  "../schema/migrations/0001_leaderboard_country_code_rollback.sql",
  import.meta.url,
);
const FIXTURE_FILE = new URL(
  "../.verify-evidence/fixtures/leaderboard-rows.json",
  import.meta.url,
);

/**
 * The columns the table has before the migration, in their live order. The
 * migration is only allowed to append country_code to this list.
 */
const PRE_MIGRATION_COLUMNS = [
  "id",
  "player_name",
  "difficulty",
  "piece_count",
  "correct_pieces",
  "memorize_time",
  "solution_time",
  "created_at",
  "total_wrong_pieces",
];

/**
 * PGlite ships without uuid-ossp, but the live table's id default calls
 * uuid_generate_v4(). Shimming the function keeps the schema file describing
 * production rather than being bent to fit the rehearsal harness.
 */
const UUID_SHIM = `
CREATE OR REPLACE FUNCTION uuid_generate_v4() RETURNS uuid
LANGUAGE sql VOLATILE AS 'SELECT gen_random_uuid()';
`;

/**
 * Drops country_code to reach the pre-migration shape. Spelled out here rather
 * than reused from the rollback file: if setup ran the rollback, a rollback
 * that silently did nothing would still produce a green rehearsal.
 */
const STRIP_NEW_COLUMN = `
ALTER TABLE leaderboard_entries DROP CONSTRAINT check_country_code_format;
ALTER TABLE leaderboard_entries DROP COLUMN country_code;
`;

const checks = [];
let failed = false;

function check(name, detail, ok) {
  checks.push({ name, detail, ok });
  if (!ok) {
    failed = true;
  }
}

function readSql(url) {
  try {
    return readFileSync(url, "utf8");
  } catch (error) {
    throw new Error(`Could not read ${url.pathname}: ${error.message}`);
  }
}

function readFixture() {
  let raw;
  try {
    raw = readFileSync(FIXTURE_FILE, "utf8");
  } catch (error) {
    throw new Error(
      `Could not read the row snapshot at ${FIXTURE_FILE.pathname}: ` +
        `${error.message}\n` +
        "It is gitignored evidence, so a fresh clone will not have it. " +
        "Copy it from a checkout that does before rehearsing.",
    );
  }
  const rows = JSON.parse(raw);
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("The row snapshot is empty; there is nothing to rehearse.");
  }
  return rows;
}

async function columnsOf(db) {
  const result = await db.query(
    `SELECT column_name
       FROM information_schema.columns
      WHERE table_name = 'leaderboard_entries'
      ORDER BY ordinal_position`,
  );
  return result.rows.map((row) => row.column_name);
}

/**
 * One md5 per row over the pre-migration columns only. ROW(...)::text is
 * Postgres's own record rendering, so a change to any value, or to how a value
 * is stored, moves the digest.
 */
async function checksums(db) {
  const columnList = PRE_MIGRATION_COLUMNS.join(", ");
  const result = await db.query(
    `SELECT id::text AS id, md5(ROW(${columnList})::text) AS digest
       FROM leaderboard_entries
      ORDER BY id`,
  );
  return result.rows.map((row) => `${row.id}:${row.digest}`).join("\n");
}

async function rowCount(db) {
  const result = await db.query("SELECT COUNT(*)::int AS n FROM leaderboard_entries");
  return result.rows[0].n;
}

async function seed(db, rows) {
  const columnList = PRE_MIGRATION_COLUMNS.join(", ");
  const placeholders = PRE_MIGRATION_COLUMNS.map((_, i) => `$${i + 1}`).join(", ");
  for (const row of rows) {
    await db.query(
      `INSERT INTO leaderboard_entries (${columnList}) VALUES (${placeholders})`,
      PRE_MIGRATION_COLUMNS.map((column) => row[column] ?? null),
    );
  }
}

/**
 * Returns null when the insert succeeded, or the error message when it was
 * rejected, so callers can assert on either outcome.
 */
async function tryInsert(db, countryCode) {
  try {
    await db.query(
      `INSERT INTO leaderboard_entries
         (player_name, difficulty, piece_count, correct_pieces,
          memorize_time, solution_time, total_wrong_pieces, country_code)
       VALUES ('RehearsalBot', 'easy', 2, 2, 1.5, 2.5, 0, $1)`,
      [countryCode],
    );
    return null;
  } catch (error) {
    return error.message;
  }
}

async function main() {
  const schemaSql = readSql(SCHEMA_FILE);
  const migrationSql = readSql(MIGRATION_FILE);
  const rollbackSql = readSql(ROLLBACK_FILE);
  const fixtureRows = readFixture();

  const db = await PGlite.create();
  const version = (await db.query("SELECT version()")).rows[0].version;

  await db.exec(UUID_SHIM);
  await db.exec(schemaSql);
  await db.exec(STRIP_NEW_COLUMN);

  const columnsBefore = await columnsOf(db);
  check(
    "pre-migration shape",
    `${columnsBefore.length} columns, no country_code`,
    columnsBefore.join(",") === PRE_MIGRATION_COLUMNS.join(","),
  );

  await seed(db, fixtureRows);
  const countBefore = await rowCount(db);
  const digestsBefore = await checksums(db);
  check(
    "snapshot seeded",
    `${countBefore} rows from the live snapshot`,
    countBefore === fixtureRows.length,
  );

  await db.exec(migrationSql);

  const countAfter = await rowCount(db);
  check("row count unchanged", `${countBefore} -> ${countAfter}`, countAfter === countBefore);

  const notZZ = (
    await db.query(
      "SELECT COUNT(*)::int AS n FROM leaderboard_entries WHERE country_code <> 'ZZ'",
    )
  ).rows[0].n;
  check("every existing row is ZZ", `${notZZ} rows not ZZ`, notZZ === 0);

  const digestsAfter = await checksums(db);
  check(
    "existing columns byte-identical",
    `md5 per row over ${PRE_MIGRATION_COLUMNS.length} columns`,
    digestsAfter === digestsBefore,
  );

  const columnsAfter = await columnsOf(db);
  check(
    "country_code appended",
    columnsAfter.join(","),
    columnsAfter.join(",") === [...PRE_MIGRATION_COLUMNS, "country_code"].join(","),
  );

  const validInsertError = await tryInsert(db, "SG");
  check("insert accepts 'SG'", validInsertError ?? "accepted", validInsertError === null);
  await db.query("DELETE FROM leaderboard_entries WHERE player_name = 'RehearsalBot'");

  for (const bad of ["zz", "USA", ""]) {
    const error = await tryInsert(db, bad);
    check(
      `insert rejects ${JSON.stringify(bad)}`,
      error ? "rejected by check_country_code_format" : "ACCEPTED",
      error !== null && error.includes("check_country_code_format"),
    );
  }

  const countBeforeRerun = await rowCount(db);
  const digestsBeforeRerun = await checksums(db);
  await db.exec(migrationSql);
  const countAfterRerun = await rowCount(db);
  const digestsAfterRerun = await checksums(db);
  const columnsAfterRerun = await columnsOf(db);
  check(
    "second apply is a no-op",
    "same rows, same columns, no error",
    countAfterRerun === countBeforeRerun &&
      digestsAfterRerun === digestsBeforeRerun &&
      columnsAfterRerun.join(",") ===
        [...PRE_MIGRATION_COLUMNS, "country_code"].join(","),
  );

  await db.exec(rollbackSql);
  const columnsRolledBack = await columnsOf(db);
  const countRolledBack = await rowCount(db);
  const digestsRolledBack = await checksums(db);
  check(
    "rollback restores column list",
    columnsRolledBack.join(","),
    columnsRolledBack.join(",") === PRE_MIGRATION_COLUMNS.join(","),
  );
  check(
    "rollback keeps rows intact",
    `${countRolledBack} rows, digests match`,
    countRolledBack === countBefore && digestsRolledBack === digestsBefore,
  );

  await db.exec(rollbackSql);
  const columnsRolledBackTwice = await columnsOf(db);
  check(
    "second rollback is a no-op",
    "no error, column list unchanged",
    columnsRolledBackTwice.join(",") === PRE_MIGRATION_COLUMNS.join(","),
  );

  await db.close();

  const nameWidth = Math.max(...checks.map((c) => c.name.length));
  console.log("\nMigration rehearsal  0001_leaderboard_country_code");
  console.log(`${version.split(" on ")[0]}\n`);
  for (const { name, detail, ok } of checks) {
    const mark = ok ? "pass" : "FAIL";
    console.log(`  ${mark}  ${name.padEnd(nameWidth)}  ${detail}`);
  }

  if (failed) {
    const names = checks.filter((c) => !c.ok).map((c) => c.name);
    console.error(
      `\n${names.length} check(s) failed: ${names.join(", ")}\n` +
        "Do not apply this migration to production.",
    );
    process.exit(1);
  }
  console.log(`\nAll ${checks.length} checks passed.`);
}

main().catch((error) => {
  console.error(`\nRehearsal could not run: ${error.message}`);
  process.exit(1);
});
