/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Database, SqlResult } from "./database";
import { MIGRATION, articleStatsDatabases } from "./articleStatsDatabase";

const RUNBOOK = readFileSync(
  path.join(__dirname, "..", "..", "docs", "migrations", "2026-10-article-stats.md"),
  "utf8",
);
const HOW_TO_READ_SECTION = "How to read a check";
const PRE_CHECK_SECTION = "2. Pre-checks";
const VERIFY_SECTION = "4. Verify";
const ROLLBACK_SECTION = "5. Rollback";
const FENCE = /^( *)```(\w+)\n([\s\S]*?)\n\1```$/gm;
const NUMBERED_ITEM = /^\d+\. /gm;
const ANON_WROTE = "ERROR: P0001: anon wrote through the function: views 1, likes 0";
const BATCH_REFUSED = "42601";
const WHO_MAY_RUN_CHECK = 9;
const ANON_WRITES_CHECK = 10;
const DIRECT_INSERT_CHECK = 11;
const BAD_EVENT_CHECK = 13;
const NO_ROW_LEFT_CHECK = 14;
const EVENT_GUARD = `  IF p_event IS NULL OR p_event NOT IN ('view', 'like', 'unlike') THEN
    RAISE EXCEPTION 'invalid article event' USING ERRCODE = '22023';
  END IF;
`;
const FUNCTION_GRANTS = `REVOKE EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_article_event(TEXT, TEXT) TO anon, authenticated;
`;
const NO_DEFAULT_FUNCTION_PRIVILEGES =
  "ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON FUNCTIONS FROM anon, authenticated";
const FUNCTION_ACL =
  "SELECT proacl::text AS proacl FROM pg_proc WHERE oid = 'public.record_article_event(text, text)'::regprocedure";
const ROWS_LEFT = "SELECT count(*)::int AS rows_left FROM public.article_stats";

type Fence = { readonly language: string; readonly body: string };
type Check = { readonly sql: string; readonly expected: string | null };

const { supabaseLike, migrated } = articleStatsDatabases();

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
    if (fence.language !== "sql") return [];
    const next = fences[index + 1];
    return [{ sql: fence.body, expected: next?.language === "text" ? next.body : null }];
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

function wrongAnswers(checks: readonly Check[], given: readonly string[]): readonly number[] {
  return checks.flatMap((check, index) => (given[index] === check.expected ? [] : [index + 1]));
}

async function checksWithWrongAnswer(db: Database, checks: readonly Check[]): Promise<readonly number[]> {
  return wrongAnswers(checks, await answers(db, checks));
}

async function answerTo(db: Database, checks: readonly Check[], checkNumber: number): Promise<string> {
  return printed(await db.singleStatement(checks[checkNumber - 1].sql));
}

function migrationWithout(part: string): string {
  if (!MIGRATION.includes(part)) throw new Error(`the migration has no "${part}"`);
  return MIGRATION.replace(part, "");
}

describe("a single statement", () => {
  it("is all Database.singleStatement runs: a batch is refused", async () => {
    const db = await supabaseLike();

    const batch = await db.singleStatement("SELECT 1 AS a; SELECT 2 AS b");

    expect(batch).toMatchObject({ ok: false, code: BATCH_REFUSED });
  });
});

describe("the runbook's pre-checks", () => {
  it("are single statements that give the printed answers before the migration", async () => {
    const db = await supabaseLike();
    const checks = checksIn(PRE_CHECK_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(PRE_CHECK_SECTION));
    expect(await answers(db, checks)).toEqual(expectedIn(checks));
  });

  it("no longer give those answers once the migration has run", async () => {
    const db = await migrated();

    expect(await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))).toEqual([1, 2]);
  });
});

describe("the runbook's checks after the migration", () => {
  it("are single statements that give the printed answers, top to bottom, and leave nothing behind", async () => {
    const db = await migrated();
    const checks = checksIn(VERIFY_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(VERIFY_SECTION));
    expect(expectedIn(checks)).toContain(ANON_WROTE);
    expect(await answers(db, checks)).toEqual(expectedIn(checks));
    expect(await db.rows("SELECT current_user AS role, count(*)::int AS rows_left FROM public.article_stats")).toEqual([
      { role: "postgres", rows_left: 0 },
    ]);
  });

  it.each([
    ["lets anon insert", "GRANT INSERT ON public.article_stats TO anon", [5, 6, 11]],
    [
      "has a write policy and lets anon insert",
      "CREATE POLICY anon_writes ON public.article_stats FOR ALL TO anon USING (true) WITH CHECK (true); GRANT INSERT ON public.article_stats TO anon",
      [4, 5, 6, 11],
    ],
    ["lets anon truncate", "GRANT TRUNCATE ON public.article_stats TO anon", [5, 6, 12]],
    [
      "lets anon set a trigger through another role",
      "CREATE ROLE helper NOLOGIN; GRANT TRIGGER ON public.article_stats TO helper; GRANT helper TO anon",
      [6],
    ],
    ["hides the counts from authenticated", "REVOKE SELECT ON public.article_stats FROM authenticated", [5, 7]],
    ["has row level security off", "ALTER TABLE public.article_stats DISABLE ROW LEVEL SECURITY", [3]],
    ["runs the function as its caller", "ALTER FUNCTION public.record_article_event(text, text) SECURITY INVOKER", [8, 10]],
    ["keeps the caller's search path", "ALTER FUNCTION public.record_article_event(text, text) RESET search_path", [8]],
    ["lets everyone run the function", "GRANT EXECUTE ON FUNCTION public.record_article_event(text, text) TO PUBLIC", [9]],
    ["refuses the function to anon", "REVOKE EXECUTE ON FUNCTION public.record_article_event(text, text) FROM anon", [9, 10]],
  ])("give a wrong answer on a database that %s", async (_, sabotage, caughtBy) => {
    const db = await migrated();
    await db.rows(sabotage);

    expect(await checksWithWrongAnswer(db, checksIn(VERIFY_SECTION))).toEqual(caughtBy);
  });

  it("report a function that accepts a bad event, and undo its write", async () => {
    const db = await supabaseLike();
    await db.rows(migrationWithout(EVENT_GUARD));
    const checks = checksIn(VERIFY_SECTION);

    const given = await answers(db, checks);
    const [{ rows_left: rowsLeft }] = await db.rows(ROWS_LEFT);

    expect({ badEventAnswer: given[BAD_EVENT_CHECK - 1], wrong: wrongAnswers(checks, given), rowsLeft }).toEqual({
      badEventAnswer: "ERROR: P0001: a bad event was accepted",
      wrong: [BAD_EVENT_CHECK],
      rowsLeft: 0,
    });
  });

  it("answer 25P02 once a tool keeps one transaction open, and as printed again after ROLLBACK", async () => {
    const db = await migrated();
    const checks = checksIn(VERIFY_SECTION);
    await db.rows("BEGIN");
    await answerTo(db, checks, ANON_WRITES_CHECK);

    const inOpenTransaction = await answerTo(db, checks, DIRECT_INSERT_CHECK);
    await db.rows("ROLLBACK");
    const repeated = await answerTo(db, checks, DIRECT_INSERT_CHECK);

    expect(inOpenTransaction).toBe(
      "ERROR: 25P02: current transaction is aborted, commands ignored until end of transaction block",
    );
    expect(repeated).toBe("ERROR: 42501: permission denied for table article_stats");
  });
});

describe("the runbook's check of who may run the function", () => {
  it("says PUBLIC may not, on a correct database", async () => {
    const db = await migrated();

    expect(await answerTo(db, checksIn(VERIFY_SECTION), WHO_MAY_RUN_CHECK)).toBe(
      '{"anon_may_execute":true,"authenticated_may_execute":true,"public_may_execute":false}',
    );
  });

  it("says PUBLIC may, when the function grants never ran and no function privilege is granted by default", async () => {
    const db = await supabaseLike();
    await db.rows(NO_DEFAULT_FUNCTION_PRIVILEGES);
    await db.rows(migrationWithout(FUNCTION_GRANTS));
    const checks = checksIn(VERIFY_SECTION);

    expect(await db.rows(FUNCTION_ACL)).toEqual([{ proacl: null }]);
    expect(await answerTo(db, checks, WHO_MAY_RUN_CHECK)).toBe(
      '{"anon_may_execute":true,"authenticated_may_execute":true,"public_may_execute":true}',
    );
    expect(await checksWithWrongAnswer(db, checks)).toEqual([WHO_MAY_RUN_CHECK]);
  });
});

describe("the runbook's answer to a stray runbook-check row", () => {
  it("is one statement that deletes the row, after which every check gives its printed answer", async () => {
    const db = await migrated();
    await db.rows("SELECT * FROM public.record_article_event('runbook-check', 'view')", { as: "anon" });
    const checks = checksIn(VERIFY_SECTION);
    const [deleteStrayRow, ...others] = checksIn(HOW_TO_READ_SECTION);

    const wrongBefore = await checksWithWrongAnswer(db, checks);
    const deleted = await db.singleStatement(deleteStrayRow.sql);
    const wrongAfter = await checksWithWrongAnswer(db, checks);

    expect(others).toEqual([]);
    expect(wrongBefore).toEqual([ANON_WRITES_CHECK, NO_ROW_LEFT_CHECK]);
    expect(deleted).toEqual({ ok: true, rows: [] });
    expect(wrongAfter).toEqual([]);
  });
});

describe("the runbook's export before a rollback", () => {
  it("is one statement that returns every count", async () => {
    const db = await migrated();
    await db.rows("SELECT * FROM public.record_article_event('magnus-carlsen', 'view')");
    const [exportRows, ...others] = checksIn(ROLLBACK_SECTION);

    const exported = await db.singleStatement(exportRows.sql);

    expect(others).toEqual([]);
    expect(exported).toEqual({
      ok: true,
      rows: [{ slug: "magnus-carlsen", views: 1, likes: 0, updated_at: expect.anything() }],
    });
  });
});
