/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres } from "./database";

jest.setTimeout(20_000);

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");
const MIGRATION = readSql("migrations/0010_revoke_counter_rpcs.sql");
const ROLLBACK = readSql("migrations/0010_revoke_counter_rpcs_rollback.sql");
const GAME_STATS = readSql("game_stats_schema.sql").replace("uuid_generate_v4()", "gen_random_uuid()");
const ARTICLE_STATS = readSql("article_stats_schema.sql");

const PLAYS_BEFORE = 50941;
const PERMISSION_DENIED = "42501";
const WEB_ROLES = ["anon", "authenticated"] as const;

// The state 0002 and 0005 leave on a Supabase project, where every web role
// holds EXECUTE through default privileges.
const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
`;

const CALLS = {
  increment: "SELECT public.increment_metric('total_plays', 1) AS value",
  article: "SELECT * FROM public.record_article_event('magnus-carlsen', 'view')",
};

let postgres: Postgres;

beforeAll(async () => {
  postgres = await startPostgres();
}, 60_000);

afterEach(() => postgres.closeAll());
afterAll(() => postgres.stop());

async function productionBefore0010(): Promise<Database> {
  const db = await postgres.open();
  await db.rows(`${SUPABASE_SHIM}\n${GAME_STATS}\n${ARTICLE_STATS}`);
  await db.rows(`INSERT INTO public.game_stats (metric_name, metric_value) VALUES ('total_plays', ${PLAYS_BEFORE}) ON CONFLICT (metric_name) DO UPDATE SET metric_value = ${PLAYS_BEFORE}`);
  return db;
}

async function executors(db: Database): Promise<unknown> {
  const [row] = await db.rows(`
    SELECT jsonb_build_object(
      'increment_metric', (SELECT jsonb_agg(role ORDER BY role) FROM (
        SELECT unnest(ARRAY['anon','authenticated','public','service_role']) AS role) r
        WHERE has_function_privilege(role, 'public.increment_metric(text, bigint)', 'EXECUTE')),
      'record_article_event', (SELECT jsonb_agg(role ORDER BY role) FROM (
        SELECT unnest(ARRAY['anon','authenticated','public','service_role']) AS role) r
        WHERE has_function_privilege(role, 'public.record_article_event(text, text)', 'EXECUTE'))
    ) AS answer`);
  return row.answer;
}

describe("before 0010", () => {
  it("lets anon and authenticated inflate both counters, which is the hole", async () => {
    const db = await productionBefore0010();

    for (const role of WEB_ROLES) {
      expect((await db.attempt(CALLS.increment, { as: role })).ok).toBe(true);
      expect((await db.attempt(CALLS.article, { as: role })).ok).toBe(true);
    }
    expect(await executors(db)).toEqual({
      increment_metric: ["anon", "authenticated", "service_role"],
      record_article_event: ["anon", "authenticated", "service_role"],
    });
  });
});

describe("after 0010", () => {
  it.each(WEB_ROLES)("refuses both functions to %s with 42501", async (role) => {
    const db = await productionBefore0010();
    await db.rows(MIGRATION);

    for (const call of Object.values(CALLS)) {
      const result = await db.attempt(call, { as: role });
      expect(result.ok ? null : result.code).toBe(PERMISSION_DENIED);
    }
  });

  it("leaves service_role the only executor and counts one play and one view for it", async () => {
    const db = await productionBefore0010();
    await db.rows(MIGRATION);

    expect(await executors(db)).toEqual({ increment_metric: ["service_role"], record_article_event: ["service_role"] });
    expect(await db.attempt(CALLS.increment, { as: "service_role" })).toEqual({ ok: true, rows: [{ value: 50942 }] });
    expect(await db.attempt(CALLS.article, { as: "service_role" })).toEqual({ ok: true, rows: [{ views: 1, likes: 0 }] });
  });

  it("still lets anon read both tables", async () => {
    const db = await productionBefore0010();
    await db.rows(MIGRATION);

    expect(await db.rows("SELECT metric_value FROM public.game_stats", { as: "anon" })).toEqual([{ metric_value: 50941 }]);
    expect((await db.attempt("SELECT * FROM public.article_stats", { as: "anon" })).ok).toBe(true);
  });

  it("is a no-op the second time", async () => {
    const db = await productionBefore0010();
    await db.rows(MIGRATION);
    const once = await executors(db);

    await db.rows(MIGRATION);

    expect(await executors(db)).toEqual(once);
  });
});

describe("rollback of 0010", () => {
  it("gives anon and authenticated both functions back, keeps the count, and is a no-op twice", async () => {
    const db = await productionBefore0010();
    await db.rows(MIGRATION);
    await db.rows(CALLS.increment, { as: "service_role" });

    await db.rows(ROLLBACK);
    await db.rows(ROLLBACK);

    expect(await executors(db)).toEqual({
      increment_metric: ["anon", "authenticated", "service_role"],
      record_article_event: ["anon", "authenticated", "service_role"],
    });
    expect(await db.rows("SELECT metric_value FROM public.game_stats")).toEqual([{ metric_value: 50942 }]);
  });
});
