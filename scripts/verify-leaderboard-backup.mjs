/**
 * Restores a leaderboard CSV backup into a throwaway Postgres and checks it.
 *
 * A backup nobody has restored is a hope. This loads the file into the live
 * table's own DDL, then runs the country migration over the restored rows, so
 * the backup is proven both readable and forward-compatible before production
 * gains the column.
 *
 * Usage: node scripts/verify-leaderboard-backup.mjs <path-to-csv> [expected-md5]
 */

import { readFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { PGlite } from "@electric-sql/pglite";

const LIVE_DDL = `
CREATE TABLE leaderboard_entries (
  id uuid NOT NULL,
  player_name text NOT NULL,
  difficulty text NOT NULL,
  piece_count integer NOT NULL,
  correct_pieces integer NOT NULL,
  memorize_time numeric(10,3) NOT NULL,
  solution_time numeric(10,3) NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  total_wrong_pieces integer,
  PRIMARY KEY (id)
);
`;

const FINGERPRINT = `
SELECT md5(string_agg(
  id::text || '|' || player_name || '|' || difficulty || '|' ||
  piece_count::text || '|' || correct_pieces::text || '|' ||
  memorize_time::text || '|' || solution_time::text || '|' ||
  (created_at AT TIME ZONE 'UTC')::text || '|' ||
  coalesce(total_wrong_pieces::text, ''),
  chr(10) ORDER BY id)) AS fingerprint
FROM leaderboard_entries;
`;

const checks = [];

function check(name, pass, detail) {
  checks.push({ name, pass, detail });
  console.log(`${pass ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
}

async function scalar(db, sql) {
  const result = await db.query(sql);
  return Object.values(result.rows[0])[0];
}

async function main() {
  const csvPath = process.argv[2];
  const expectedMd5 = process.argv[3];
  if (!csvPath) {
    console.error("usage: node scripts/verify-leaderboard-backup.mjs <csv> [md5]");
    process.exit(2);
  }

  const csv = readFileSync(csvPath, "utf8");
  const localMd5 = createHash("md5").update(csv, "utf8").digest("hex");
  console.log(`backup   ${csvPath}`);
  console.log(`md5      ${localMd5}`);
  if (expectedMd5) {
    check("file md5 matches the one Postgres computed", localMd5 === expectedMd5, expectedMd5);
  }

  const db = await PGlite.create();
  console.log(`engine   ${await scalar(db, "SELECT version()")}`);
  await db.exec("SET TimeZone = 'UTC';");
  await db.exec(LIVE_DDL);

  await db.query("COPY leaderboard_entries FROM '/dev/blob' WITH (FORMAT csv, HEADER)", [], {
    blob: new Blob([csv]),
  });

  const restored = await scalar(db, "SELECT count(*)::int FROM leaderboard_entries");
  const csvRows = csv.trimEnd().split("\n").length - 1;
  check("every CSV row restored into the live DDL", restored === csvRows, `${restored} of ${csvRows}`);
  check(
    "ids are unique",
    (await scalar(db, "SELECT count(DISTINCT id)::int FROM leaderboard_entries")) === restored,
    `${restored} distinct`,
  );
  check(
    "no blank player names",
    (await scalar(db, "SELECT count(*)::int FROM leaderboard_entries WHERE player_name = ''")) === 0,
  );
  check(
    "every row has a timestamp",
    (await scalar(db, "SELECT count(*)::int FROM leaderboard_entries WHERE created_at IS NULL")) === 0,
  );

  const spread = await db.query(
    "SELECT difficulty, count(*)::int AS n FROM leaderboard_entries GROUP BY difficulty ORDER BY difficulty",
  );
  console.log(`         difficulties ${spread.rows.map((r) => `${r.difficulty}=${r.n}`).join(" ")}`);
  const range = (
    await db.query("SELECT min(created_at) AS lo, max(created_at) AS hi FROM leaderboard_entries")
  ).rows[0];
  console.log(`         created_at ${range.lo.toISOString()} to ${range.hi.toISOString()}`);

  const beforeFingerprint = await scalar(db, FINGERPRINT);
  console.log(`         fingerprint ${beforeFingerprint}`);

  const migration = readFileSync("schema/migrations/0001_leaderboard_country_code.sql", "utf8");
  await db.exec(migration);

  check(
    "migration keeps every restored row",
    (await scalar(db, "SELECT count(*)::int FROM leaderboard_entries")) === restored,
  );
  check(
    "migration leaves the existing data untouched",
    (await scalar(db, FINGERPRINT)) === beforeFingerprint,
    beforeFingerprint,
  );
  check(
    "every restored row reads as the world option",
    (await scalar(db, "SELECT count(*)::int FROM leaderboard_entries WHERE country_code = 'ZZ'")) === restored,
  );

  const rollback = readFileSync("schema/migrations/0001_leaderboard_country_code_rollback.sql", "utf8");
  await db.exec(rollback);
  check("rollback returns the table to the backed-up state", (await scalar(db, FINGERPRINT)) === beforeFingerprint);

  await db.close();

  const failed = checks.filter((c) => !c.pass);
  console.log(`\n${checks.length - failed.length} of ${checks.length} checks passed`);
  process.exit(failed.length === 0 ? 0 : 1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
