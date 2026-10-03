/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Postgres, type SqlResult } from "./database";
import { migratedDatabase } from "./articleStatsDatabase";

const RUNBOOK = readFileSync(
  path.join(__dirname, "..", "..", "docs", "migrations", "2026-10-article-stats.md"),
  "utf8",
);
const VERIFY_SECTION = "4. Verify";
const FENCE = /^( *)```(\w+)\n([\s\S]*?)\n\1```$/gm;
const ANON_WRITES = "record_article_event('runbook-check', 'view')";
const ANON_WROTE = "ERROR: P0001: anon wrote through the function: views 1, likes 0";

type Fence = { readonly language: string; readonly body: string };
type Check = { readonly sql: string; readonly expected: string | null };

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
