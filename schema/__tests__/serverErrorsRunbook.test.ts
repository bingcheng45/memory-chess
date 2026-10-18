/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import type { Database, SqlResult } from "./database";
import { ROLLBACK, serverErrorDatabases } from "./serverErrorsDatabase";

jest.setTimeout(20_000);

const RUNBOOK = readFileSync(path.join(__dirname, "..", "..", "docs", "migrations", "2026-10-server-errors.md"), "utf8");
const PRE_CHECK_SECTION = "2. Pre-checks";
const VERIFY_SECTION = "4. Verify";
const READ_SECTION = "5. Read the log";
const RETENTION_SECTION = "6. Retention: keep 30 days";
const FENCE = /^( *)```(\w+)\n([\s\S]*?)\n\1```$/gm;
const NUMBERED_ITEM = /^\d+\. /gm;

type Fence = { readonly language: string; readonly body: string };
type Check = { readonly sql: string; readonly expected: string };

const { supabaseLike, migrated } = serverErrorDatabases();

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

const sqlIn = (heading: string) => fencesIn(sectionOf(heading)).filter(({ language }) => language === "sql").map(({ body }) => body);
const numberedItemsIn = (heading: string) => sectionOf(heading).match(NUMBERED_ITEM)?.length ?? 0;

function printed(result: SqlResult): string {
  return result.ok ? result.rows.map((row) => JSON.stringify(row)).join("\n") : `ERROR: ${result.code}: ${result.message}`;
}

async function answers(db: Database, checks: readonly Check[]): Promise<readonly string[]> {
  let given: readonly string[] = [];
  for (const { sql } of checks) given = [...given, printed(await db.singleStatement(sql))];
  return given;
}

async function checksWithWrongAnswer(db: Database, checks: readonly Check[]): Promise<readonly number[]> {
  const given = await answers(db, checks);
  return checks.flatMap((check, index) => (given[index] === check.expected ? [] : [index + 1]));
}

const STORED = `
  INSERT INTO public.server_errors (route, kind, message, created_at) VALUES
    ('POST /api/leaderboard', 'failed', 'fresh', now() - interval '2 hours'),
    ('POST /api/leaderboard', 'failed', 'last week', now() - interval '6 days'),
    ('GET /api/leaderboard/rank', 'unavailable', 'old', now() - interval '31 days')
`;

const messages = (db: Database) => db.rows("SELECT message FROM public.server_errors ORDER BY created_at DESC");

describe("the runbook's pre-checks", () => {
  it("are single statements that give the printed answers on a Supabase-like database without 0007", async () => {
    const db = await supabaseLike();
    const checks = checksIn(PRE_CHECK_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(PRE_CHECK_SECTION));
    expect(await checksWithWrongAnswer(db, checks)).toEqual([]);
  });

  it("no longer give the first answer once the migration has run, and give it again after the rollback", async () => {
    const db = await migrated();
    const afterMigration = await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION));
    await db.rows(ROLLBACK);

    expect([afterMigration, await checksWithWrongAnswer(db, checksIn(PRE_CHECK_SECTION))]).toEqual([[1], []]);
  });
});

describe("the runbook's checks after the migration", () => {
  it("are single statements that give the printed answers, top to bottom, and leave no row behind", async () => {
    const db = await migrated();
    const checks = checksIn(VERIFY_SECTION);

    expect(checks).toHaveLength(numberedItemsIn(VERIFY_SECTION));
    expect(await answers(db, checks)).toEqual(checks.map(({ expected }) => expected));
    expect(await db.rows("SELECT current_user AS role, count(*)::int AS rows FROM public.server_errors")).toEqual([
      { role: "postgres", rows: 0 },
    ]);
  });

  it.each([
    ["leaves anon its default grants", "GRANT ALL ON public.server_errors TO anon", [2, 3, 5, 6]],
    ["leaves service_role able to delete", "GRANT DELETE ON public.server_errors TO service_role", [2, 8]],
    ["has a policy that shows anon every row", "CREATE POLICY open ON public.server_errors FOR SELECT TO anon USING (true)", [1]],
    ["lets anon use the id sequence", "GRANT USAGE ON SEQUENCE public.server_errors_id_seq TO anon", [3]],
    ["lost its index", "DROP INDEX public.server_errors_created_at_idx", [4]],
    ["took INSERT from service_role", "REVOKE INSERT ON public.server_errors FROM service_role", [2, 7]],
  ])("give a wrong answer on a database that %s", async (_, sabotage, caughtBy) => {
    const db = await migrated();
    await db.rows(sabotage);

    expect(await checksWithWrongAnswer(db, checksIn(VERIFY_SECTION))).toEqual(caughtBy);
  });
});

describe("the runbook's reading and retention queries", () => {
  it("read the last day and count the last week by route and kind", async () => {
    const db = await migrated();
    await db.rows(STORED);
    const [lastDay, lastWeek] = sqlIn(READ_SECTION);

    expect((await db.rows(lastDay)).map(({ message }) => message)).toEqual(["fresh"]);
    expect((await db.rows(lastWeek)).map(({ route, kind, errors }) => [route, kind, errors])).toEqual([
      ["POST /api/leaderboard", "failed", 2],
    ]);
  });

  it("delete only the rows older than 30 days", async () => {
    const db = await migrated();
    await db.rows(STORED);
    const [retention] = sqlIn(RETENTION_SECTION);

    await db.rows(retention);

    expect(await messages(db)).toEqual([{ message: "fresh" }, { message: "last week" }]);
  });

  it("schedule the same delete that the one-off statement runs", () => {
    const [retention, schedule] = sqlIn(RETENTION_SECTION);

    expect(schedule).toContain(`$$${retention.replace(/;$/, "")}$$`);
  });
});
