/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Database, SqlResult } from "./database";
import { PLAYS_BEFORE, ROLLBACK, gameStatsDatabases } from "./gameStatsDatabase";

jest.setTimeout(20_000);

const RUNBOOK = readFileSync(
  path.join(__dirname, "..", "..", "docs", "migrations", "2026-10-game-stats-increment.md"),
  "utf8",
);
const PRE_CHECK_SECTION = "2. Pre-checks";
const VERIFY_SECTION = "4. Verify";
const FENCE = /^( *)```(\w+)\n([\s\S]*?)\n\1```$/gm;
const NUMBERED_ITEM = /^\d+\. /gm;
const ANON_ADDED_ONE = "ERROR: P0001: anon added 1 to total_plays";

type Fence = { readonly language: string; readonly body: string };
type Check = { readonly sql: string; readonly expected: string | null };

const { beforeMigration, migrated } = gameStatsDatabases();

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

// A sql fence counts as a check only when a text fence with its answer follows.
// Pre-check 3's note carries one sql statement with no printed answer.
function checksIn(heading: string): readonly Check[] {
  const fences = fencesIn(sectionOf(heading));
  return fences.flatMap((fence, index) => {
    const next = fences[index + 1];
    if (fence.language !== "sql" || next?.language !== "text") return [];
    return [{ sql: fence.body, expected: next.body }];
  });
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

describe("the runbook's pre-checks", () => {
  it("are single statements that give the printed answers on production's prior state", async () => {
    const db = await beforeMigration();
    const checks = checksIn(PRE_CHECK_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(PRE_CHECK_SECTION));
    expect(await answers(db, checks)).toEqual(expectedIn(checks));
  });

  it("no longer give those answers once the migration has run", async () => {
    const db = await migrated();

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([1, 2, 3, 4, 5]);
  });

  it("give the printed answers again after the rollback", async () => {
    const db = await migrated();
    await db.rows(ROLLBACK);

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([]);
  });

  it("report a live body that differs from the one the rollback restores", async () => {
    const db = await beforeMigration();
    await db.rows(`
      CREATE OR REPLACE FUNCTION increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
      RETURNS BIGINT AS $$ BEGIN RETURN 0; END; $$ LANGUAGE plpgsql
    `);

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([3, 5]);
  });
});

describe("the runbook's checks after the migration", () => {
  it("are single statements that give the printed answers, top to bottom, and leave the count alone", async () => {
    const db = await migrated();
    const checks = checksIn(VERIFY_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(VERIFY_SECTION));
    expect(expectedIn(checks)).toContain(ANON_ADDED_ONE);
    expect(await answers(db, checks)).toEqual(expectedIn(checks));
    expect(await db.rows("SELECT current_user AS role, metric_value FROM public.game_stats")).toEqual([
      { role: "postgres", metric_value: PLAYS_BEFORE },
    ]);
  });

  it("give a wrong answer on production's prior state", async () => {
    const db = await beforeMigration();

    expect(await checksWithWrongAnswer(db, checksIn(VERIFY_SECTION))).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  });

  it.each([
    ["keeps the increment policy", 'CREATE POLICY "Allow public increment" ON public.game_stats FOR UPDATE USING (true)', [1]],
    ["lets anon update", "GRANT UPDATE ON public.game_stats TO anon", [2, 3, 7]],
    [
      "lets anon truncate through another role",
      "CREATE ROLE helper NOLOGIN; GRANT TRUNCATE ON public.game_stats TO helper; GRANT helper TO anon",
      [3],
    ],
    ["runs the function as its caller", "ALTER FUNCTION public.increment_metric(text, bigint) SECURITY INVOKER", [4, 6]],
    ["keeps the caller's search path", "ALTER FUNCTION public.increment_metric(text, bigint) RESET search_path", [4]],
    ["lets everyone run the function", "GRANT EXECUTE ON FUNCTION public.increment_metric(text, bigint) TO PUBLIC", [5]],
    ["refuses the function to anon", "REVOKE EXECUTE ON FUNCTION public.increment_metric(text, bigint) FROM anon", [5, 6, 8, 9]],
  ])("give a wrong answer on a database that %s", async (_, sabotage, caughtBy) => {
    const db = await migrated();
    await db.rows(sabotage);

    expect(await checksWithWrongAnswer(db, checksIn(VERIFY_SECTION))).toEqual(caughtBy);
  });
});
