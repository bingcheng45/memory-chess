/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Database, SqlResult } from "./database";
import { MIGRATION, ROLLBACK, leaderboardDatabases } from "./leaderboardWriteLockdownDatabase";

jest.setTimeout(20_000);

const RUNBOOK = readFileSync(
  path.join(__dirname, "..", "..", "docs", "migrations", "2026-10-leaderboard-write-lockdown.md"),
  "utf8",
);
const PRE_CHECK_SECTION = "2. Pre-checks";
const VERIFY_SECTION = "4. Verify";
const OLD_ROWS_HEADING = "\n### Old rows that break the new checks\n";
const FENCE = /^( *)```(\w+)\n([\s\S]*?)\n\1```$/gm;
const NUMBERED_ITEM = /^\d+\. /gm;
const STORED_ROW = `
  INSERT INTO public.leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
  VALUES ('Keeper', 'hard', 12, 11, 8, 30.25)
`;

type Fence = { readonly language: string; readonly body: string };
type Check = { readonly sql: string; readonly expected: string | null };

const { beforeMigration, migrated } = leaderboardDatabases();

function sectionOf(heading: string): string {
  const start = RUNBOOK.indexOf(`\n## ${heading}\n`);
  if (start === -1) throw new Error(`the runbook has no section "${heading}"`);
  const end = RUNBOOK.indexOf("\n## ", start + 1);
  return RUNBOOK.slice(start, end === -1 ? undefined : end);
}

function fencesIn(markdown: string): readonly Fence[] {
  return [...markdown.matchAll(FENCE)].map(([, indent, language, body]) => ({
    language,
    body: body
      .split("\n")
      .map((line) => line.slice(indent.length))
      .join("\n"),
  }));
}

function checksIn(heading: string): readonly Check[] {
  const fences = fencesIn(sectionOf(heading));
  return fences.flatMap((fence, index) => {
    const next = fences[index + 1];
    if (fence.language !== "sql" || next?.language !== "text") return [];
    return [{ sql: fence.body, expected: next.body }];
  });
}

function oldRowsQuery(): string {
  const start = RUNBOOK.indexOf(OLD_ROWS_HEADING);
  if (start === -1) throw new Error("the runbook no longer carries the old-rows query");
  const [query] = fencesIn(RUNBOOK.slice(start, RUNBOOK.indexOf("\n## ", start)));
  return query.body;
}

const numberedItemsIn = (heading: string) => sectionOf(heading).match(NUMBERED_ITEM)?.length ?? 0;
const expectedIn = (checks: readonly Check[]) => checks.map((check) => check.expected);

function printed(result: SqlResult): string {
  return result.ok
    ? result.rows.map((row) => JSON.stringify(row)).join("\n")
    : `ERROR: ${result.code}: ${result.message}`;
}

async function answers(db: Database, checks: readonly Check[]): Promise<readonly string[]> {
  let given: readonly string[] = [];
  for (const { sql } of checks) {
    given = [...given, printed(await db.singleStatement(sql))];
  }
  return given;
}

async function checksWithWrongAnswer(db: Database, checks: readonly Check[]): Promise<readonly number[]> {
  const given = await answers(db, checks);
  return checks.flatMap((check, index) => (given[index] === check.expected ? [] : [index + 1]));
}

const leftBehind = (db: Database) =>
  db.rows("SELECT current_user AS role, player_name FROM public.leaderboard_entries ORDER BY player_name");

describe("the runbook's pre-checks", () => {
  it("are single statements that give the printed answers on production's prior state, and leave no row", async () => {
    const db = await beforeMigration();
    await db.rows(STORED_ROW);
    const checks = checksIn(PRE_CHECK_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(PRE_CHECK_SECTION));
    expect(await answers(db, checks)).toEqual(expectedIn(checks));
    expect(await leftBehind(db)).toEqual([{ role: "postgres", player_name: "Keeper" }]);
  });

  it("no longer give those answers once the migration has run", async () => {
    const db = await migrated();

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([1, 2, 4, 5]);
  });

  it("give the printed answers again after the rollback", async () => {
    const db = await migrated();
    await db.rows(ROLLBACK);

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([]);
  });

  it("report a service_role that cannot write past row level security", async () => {
    const db = await beforeMigration();
    await db.rows("ALTER ROLE service_role NOBYPASSRLS");

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([3]);
  });
});

describe("the runbook's checks after the migration", () => {
  it("are single statements that give the printed answers, top to bottom, and leave no row behind", async () => {
    const db = await migrated();
    await db.rows(STORED_ROW);
    const checks = checksIn(VERIFY_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(VERIFY_SECTION));
    expect(await answers(db, checks)).toEqual(expectedIn(checks));
    expect(await leftBehind(db)).toEqual([{ role: "postgres", player_name: "Keeper" }]);
  });

  it("give a wrong answer on production's prior state", async () => {
    const db = await beforeMigration();

    expect(await checksWithWrongAnswer(db, checksIn(VERIFY_SECTION))).toEqual([1, 2, 3, 5, 6, 7, 8, 9, 10]);
  });

  it.each([
    [
      "keeps the insert policy",
      'CREATE POLICY "Allow public insert" ON public.leaderboard_entries FOR INSERT TO public WITH CHECK (true)',
      [1],
    ],
    ["lets anon update", "GRANT UPDATE ON public.leaderboard_entries TO anon", [2, 3, 7]],
    [
      "lets anon insert through another role",
      "CREATE ROLE helper NOLOGIN; GRANT INSERT ON public.leaderboard_entries TO helper; GRANT helper TO anon",
      [3, 6],
    ],
    ["lost the floor", "ALTER TABLE public.leaderboard_entries DROP CONSTRAINT check_solution_time_per_piece", [5, 10]],
    ["took INSERT from service_role", "REVOKE INSERT ON public.leaderboard_entries FROM service_role", [4, 10, 11]],
  ])("give a wrong answer on a database that %s", async (_, sabotage, caughtBy) => {
    const db = await migrated();
    await db.rows(sabotage);

    expect(await checksWithWrongAnswer(db, checksIn(VERIFY_SECTION))).toEqual(caughtBy);
  });
});

describe("the runbook's old-rows query", () => {
  it("counts, after the migration, the rows stored before it that break each check", async () => {
    const db = await beforeMigration();
    await db.rows(`
      INSERT INTO public.leaderboard_entries (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time)
      VALUES ('Quickhand', 'medium', 6, 6, 10, 0.565),
             ('Quickhand', 'grandmaster', 20, 20, 5, 0.725),
             ('Oddboard', 'medium', 7, 7, 10, 12.5),
             ('Longlook', 'hard', 12, 12, 75, 30),
             ('Keeper', 'hard', 12, 11, 8, 30.25)
    `);
    await db.rows(MIGRATION);

    expect(await db.rows(oldRowsQuery())).toEqual([
      { break_board_piece_count: 1, break_solution_time_per_piece: 2, break_memorize_time_longest: 1 },
    ]);
  });
});
