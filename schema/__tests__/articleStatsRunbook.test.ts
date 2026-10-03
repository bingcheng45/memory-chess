/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres, type SqlResult } from "./database";
import { migratedDatabase, supabaseLikeDatabase } from "./articleStatsDatabase";

const RUNBOOK = readFileSync(
  path.join(__dirname, "..", "..", "docs", "migrations", "2026-10-article-stats.md"),
  "utf8",
);
const PRE_CHECK_SECTION = "2. Pre-checks";
const VERIFY_SECTION = "4. Verify";
const ROLLBACK_SECTION = "5. Rollback";
const FENCE = /^( *)```(\w+)\n([\s\S]*?)\n\1```$/gm;
const ANON_WRITES = "record_article_event('runbook-check', 'view')";
const ANON_WROTE = "ERROR: P0001: anon wrote through the function: views 1, likes 0";

type Fence = { readonly language: string; readonly body: string };
type Check = { readonly sql: string; readonly expected: string | null };
type Answer = { readonly check: string; readonly answer: string | null };

let postgres: Postgres;

beforeAll(async () => {
  postgres = await startPostgres();
}, 60_000);

afterEach(async () => {
  await postgres.closeAll();
});

afterAll(async () => {
  await postgres.stop();
});

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

function printed(result: SqlResult): string {
  return result.ok
    ? result.rows.map((row) => JSON.stringify(row)).join("\n")
    : `ERROR: ${result.code}: ${result.message}`;
}

function checkThat(heading: string, holds: string): Check {
  const found = checksIn(heading).filter((check) => check.sql.includes(holds));
  if (found.length !== 1) throw new Error(`"${heading}" has ${found.length} checks that hold ${holds}`);
  return found[0];
}

const firstLine = (sql: string) => sql.split("\n")[0];

function expectedAnswers(checks: readonly Check[]): readonly Answer[] {
  return checks.map(({ sql, expected }) => ({ check: firstLine(sql), answer: expected }));
}

async function answers(db: Database, checks: readonly Check[]): Promise<readonly Answer[]> {
  let given: readonly Answer[] = [];
  for (const { sql } of checks) {
    given = [...given, { check: firstLine(sql), answer: printed(await db.statement(sql)) }];
  }
  return given;
}

async function wrongAnswers(db: Database, checks: readonly Check[]): Promise<readonly string[]> {
  const given = await answers(db, checks);
  return given.filter(({ answer }, index) => answer !== checks[index].expected).map(({ check }) => check);
}

describe("the runbook's pre-checks", () => {
  it("are single statements that give the printed answers before the migration", async () => {
    const db = await supabaseLikeDatabase(postgres);
    const checks = checksIn(PRE_CHECK_SECTION);

    expect(checks.length).toBeGreaterThan(0);
    expect(await answers(db, checks)).toEqual(expectedAnswers(checks));
  });

  it("no longer give those answers once the migration has run", async () => {
    const db = await migratedDatabase(postgres);

    expect(await wrongAnswers(db, checksIn(PRE_CHECK_SECTION))).not.toEqual([]);
  });
});

describe("the runbook's checks after the migration", () => {
  it("are single statements that give the printed answers, run top to bottom on one database", async () => {
    const db = await migratedDatabase(postgres);
    const checks = checksIn(VERIFY_SECTION);

    expect(checks.length).toBeGreaterThan(0);
    expect(await answers(db, checks)).toEqual(expectedAnswers(checks));
  });

  it("leave the table empty and the session as the owner", async () => {
    const db = await migratedDatabase(postgres);

    await answers(db, checksIn(VERIFY_SECTION));

    expect(await db.rows("SELECT current_user AS role, count(*)::int AS rows_left FROM public.article_stats")).toEqual([
      { role: "postgres", rows_left: 0 },
    ]);
  });

  it("cover the grants both ways: no write privilege, the read privilege and the execute privilege", () => {
    const sql = checksIn(VERIFY_SECTION).map((check) => check.sql.replace(/\s+/g, " "));

    expect(sql).toEqual(
      expect.arrayContaining([
        expect.stringContaining(
          "has_table_privilege('anon', 'public.article_stats', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')",
        ),
        expect.stringContaining(
          "has_table_privilege('authenticated', 'public.article_stats', 'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')",
        ),
        expect.stringContaining("has_table_privilege('anon', 'public.article_stats', 'SELECT')"),
        expect.stringContaining("has_table_privilege('authenticated', 'public.article_stats', 'SELECT')"),
        expect.stringContaining("has_function_privilege('anon', 'public.record_article_event(text, text)', 'EXECUTE')"),
      ]),
    );
  });

  it.each([
    ["lets anon insert", "GRANT INSERT ON public.article_stats TO anon"],
    ["lets everyone run the function", "GRANT EXECUTE ON FUNCTION public.record_article_event(text, text) TO PUBLIC"],
    ["runs the function as its caller", "ALTER FUNCTION public.record_article_event(text, text) SECURITY INVOKER"],
    ["keeps the caller's search path", "ALTER FUNCTION public.record_article_event(text, text) RESET search_path"],
    ["has row level security off", "ALTER TABLE public.article_stats DISABLE ROW LEVEL SECURITY"],
    ["hides the counts from authenticated", "REVOKE SELECT ON public.article_stats FROM authenticated"],
  ])("give a wrong answer on a database that %s", async (_, sabotage) => {
    const db = await migratedDatabase(postgres);
    await db.rows(sabotage);

    expect(await wrongAnswers(db, checksIn(VERIFY_SECTION))).not.toEqual([]);
  });
});

describe("the runbook's export before a rollback", () => {
  it("is one statement that returns every count", async () => {
    const db = await migratedDatabase(postgres);
    await db.rows("SELECT * FROM public.record_article_event('magnus-carlsen', 'view')");
    const [exportRows, ...others] = checksIn(ROLLBACK_SECTION);

    const exported = await db.statement(exportRows.sql);

    expect(others).toEqual([]);
    expect(exported).toEqual({
      ok: true,
      rows: [{ slug: "magnus-carlsen", views: 1, likes: 0, updated_at: expect.anything() }],
    });
  });
});

describe("the runbook's check that anon writes through the function", () => {
  it("is one statement that answers with the counts and leaves no row behind", async () => {
    const db = await migratedDatabase(postgres);
    const check = checkThat(VERIFY_SECTION, ANON_WRITES);

    const answer = printed(await db.statement(check.sql));

    expect(answer).toBe(ANON_WROTE);
    expect(check.expected).toBe(answer);
    expect(await db.rows("SELECT current_user AS role, count(*)::int AS rows_left FROM public.article_stats")).toEqual([
      { role: "postgres", rows_left: 0 },
    ]);
  });
});
