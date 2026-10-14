/** @jest-environment node */

import type { Database, SqlResult } from "./database";
import { MIGRATION, PLAYS_BEFORE, ROLLBACK, SNAPSHOT, gameStatsDatabases } from "./gameStatsDatabase";

jest.setTimeout(20_000);

const PERMISSION_DENIED = "42501";
const INVALID_PARAMETER = "22023";
const WEB_ROLES = ["anon", "authenticated"] as const;

const FINGERPRINT = `
  SELECT jsonb_build_object(
    'columns', (
      SELECT jsonb_agg(jsonb_build_array(column_name, data_type, is_nullable, column_default) ORDER BY ordinal_position)
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'game_stats'),
    'rowSecurity', (
      SELECT jsonb_build_array(relrowsecurity, relforcerowsecurity)
      FROM pg_class WHERE oid = 'public.game_stats'::regclass),
    'policies', (
      SELECT jsonb_agg(jsonb_build_array(policyname, permissive, roles::text, cmd, qual, with_check) ORDER BY policyname)
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_stats'),
    'tableGrants', (
      SELECT jsonb_agg(jsonb_build_array(grantee, privilege_type) ORDER BY grantee, privilege_type)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND table_name = 'game_stats' AND grantee IN ('anon', 'authenticated', 'PUBLIC')),
    'function', pg_get_functiondef('public.increment_metric(text, bigint)'::regprocedure),
    'functionGrants', (
      SELECT jsonb_agg(grantee ORDER BY grantee)
      FROM (
        SELECT CASE WHEN acl.grantee = 0 THEN 'PUBLIC' ELSE acl.grantee::regrole::text END AS grantee
        FROM pg_proc, aclexplode(proacl) AS acl
        WHERE pg_proc.oid = 'public.increment_metric(text, bigint)'::regprocedure
      ) AS grants)
  ) AS fingerprint
`;

const { supabaseLike, beforeMigration, migrated } = gameStatsDatabases();

function increment(db: Database, args: string, as = "anon"): Promise<SqlResult> {
  return db.attempt(`SELECT public.increment_metric(${args}) AS plays`, { as });
}

async function plays(db: Database): Promise<unknown> {
  const [row] = await db.rows("SELECT metric_value FROM public.game_stats WHERE metric_name = 'total_plays'");
  return row.metric_value;
}

async function fingerprint(db: Database) {
  const [row] = await db.rows(FINGERPRINT);
  return row.fingerprint;
}

function codeOf(result: SqlResult): string | null {
  return result.ok ? null : result.code;
}

async function directWrites(db: Database, role: string) {
  const writes = {
    insert: await db.attempt("INSERT INTO public.game_stats (metric_name, metric_value) VALUES ('made_up', 999)", { as: role }),
    update: await db.attempt("UPDATE public.game_stats SET metric_value = 999999", { as: role }),
    delete: await db.attempt("DELETE FROM public.game_stats", { as: role }),
    truncate: await db.attempt("TRUNCATE public.game_stats", { as: role }),
  };
  return Object.fromEntries(Object.entries(writes).map(([name, result]) => [name, codeOf(result)]));
}

describe("production before 0005", () => {
  it("refuses every increment from anon, which is the bug", async () => {
    const db = await beforeMigration();

    const result = await increment(db, "'total_plays', 1");

    expect(result).toEqual({
      ok: false,
      code: PERMISSION_DENIED,
      message: 'new row violates row-level security policy for table "game_stats"',
    });
  });

  it("lets anon set total_plays to any number, which is the hole", async () => {
    const db = await beforeMigration();

    await db.rows("UPDATE public.game_stats SET metric_value = 999999", { as: "anon" });

    expect(await plays(db)).toBe(999999);
  });
});

describe("increment_metric after 0005", () => {
  it.each(WEB_ROLES)("adds one play for %s and answers the new total", async (role) => {
    const db = await migrated();

    expect(await increment(db, "'total_plays', 1", role)).toEqual({ ok: true, rows: [{ plays: PLAYS_BEFORE + 1 }] });
    expect(await plays(db)).toBe(PLAYS_BEFORE + 1);
  });

  it("adds two plays over two calls", async () => {
    const db = await migrated();

    await increment(db, "'total_plays', 1");
    const second = await increment(db, "'total_plays', 1");

    expect(second).toEqual({ ok: true, rows: [{ plays: PLAYS_BEFORE + 2 }] });
    expect(await plays(db)).toBe(PLAYS_BEFORE + 2);
  });

  it("adds one play when the increment is left to its default", async () => {
    const db = await migrated();

    expect(await increment(db, "'total_plays'")).toEqual({ ok: true, rows: [{ plays: PLAYS_BEFORE + 1 }] });
  });

  it("moves last_updated", async () => {
    const db = await migrated();
    await db.rows("UPDATE public.game_stats SET last_updated = '2000-01-01T00:00:00Z'");

    await increment(db, "'total_plays', 1");

    const [row] = await db.rows("SELECT last_updated > '2026-01-01T00:00:00Z' AS moved FROM public.game_stats");
    expect(row.moved).toBe(true);
  });

  it("creates total_plays at one when the row is missing", async () => {
    const db = await migrated();
    await db.rows("DELETE FROM public.game_stats");

    expect(await increment(db, "'total_plays', 1")).toEqual({ ok: true, rows: [{ plays: 1 }] });
    expect(await db.rows("SELECT metric_name, metric_value FROM public.game_stats")).toEqual([
      { metric_name: "total_plays", metric_value: 1 },
    ]);
  });

  it.each([
    ["another metric", "'total_completed_games', 1"],
    ["a metric in another case", "'TOTAL_PLAYS', 1"],
    ["a null metric", "NULL, 1"],
    ["an increment of two", "'total_plays', 2"],
    ["an increment of zero", "'total_plays', 0"],
    ["a negative increment", "'total_plays', -1"],
    ["a huge increment", "'total_plays', 999999"],
    ["a null increment", "'total_plays', NULL"],
  ])("refuses %s with 22023 and changes nothing", async (_, args) => {
    const db = await migrated();

    const result = await increment(db, args);

    expect(codeOf(result)).toBe(INVALID_PARAMETER);
    expect(await db.rows("SELECT metric_name, metric_value FROM public.game_stats")).toEqual([
      { metric_name: "total_plays", metric_value: PLAYS_BEFORE },
    ]);
  });

  it("refuses the function to a role that was not granted it", async () => {
    const db = await migrated();

    expect(codeOf(await increment(db, "'total_plays', 1", "stranger"))).toBe(PERMISSION_DENIED);
  });

  it("writes only because of the definer: as an invoker function the same call is refused", async () => {
    const db = await migrated();
    await db.rows("ALTER FUNCTION public.increment_metric(text, bigint) SECURITY INVOKER");

    expect(codeOf(await increment(db, "'total_plays', 1"))).toBe(PERMISSION_DENIED);
  });

  it("is not fooled by a table of the same name earlier on the caller's search path", async () => {
    const db = await migrated();
    await db.rows(`
      CREATE SCHEMA decoy;
      CREATE TABLE decoy.game_stats (id UUID, metric_name TEXT UNIQUE, metric_value BIGINT, last_updated TIMESTAMPTZ);
      GRANT USAGE ON SCHEMA decoy TO anon;
      SET search_path = decoy, public;
    `);

    await increment(db, "'total_plays', 1");

    expect(await db.rows("SELECT metric_name FROM decoy.game_stats")).toEqual([]);
    expect(await plays(db)).toBe(PLAYS_BEFORE + 1);
  });
});

describe("the table after 0005", () => {
  it.each(WEB_ROLES)("lets %s read the count", async (role) => {
    const db = await migrated();

    const read = await db.attempt("SELECT metric_name, metric_value FROM public.game_stats", { as: role });

    expect(read).toEqual({ ok: true, rows: [{ metric_name: "total_plays", metric_value: PLAYS_BEFORE }] });
  });

  it.each(WEB_ROLES)("refuses every direct write from %s", async (role) => {
    const db = await migrated();

    expect(await directWrites(db, role)).toEqual({
      insert: PERMISSION_DENIED,
      update: PERMISSION_DENIED,
      delete: PERMISSION_DENIED,
      truncate: PERMISSION_DENIED,
    });
    expect(await plays(db)).toBe(PLAYS_BEFORE);
  });

  it("keeps the read policy and drops the increment policy", async () => {
    const db = await migrated();

    const policies = await db.rows(
      "SELECT policyname, cmd, roles::text AS roles, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'game_stats'",
    );

    expect(policies).toEqual([{ policyname: "Allow public read", cmd: "SELECT", roles: "{public}", qual: "true" }]);
  });
});

describe("applying and rolling back", () => {
  it("is a no-op the second time, and keeps the plays counted in between", async () => {
    const db = await migrated();
    await increment(db, "'total_plays', 1");
    const before = await fingerprint(db);

    await db.rows(MIGRATION);

    expect(await fingerprint(db)).toEqual(before);
    expect(await plays(db)).toBe(PLAYS_BEFORE + 1);
  });

  it("restores production's prior state on rollback, and keeps the count", async () => {
    const db = await beforeMigration();
    const prior = await fingerprint(db);
    await db.rows(MIGRATION);
    await increment(db, "'total_plays', 1");

    await db.rows(ROLLBACK);

    expect(await fingerprint(db)).toEqual(prior);
    expect(await plays(db)).toBe(PLAYS_BEFORE + 1);
  });

  it("brings the bug back on rollback, so the fixture and the rollback agree on the old function", async () => {
    const db = await migrated();

    await db.rows(ROLLBACK);

    expect(codeOf(await increment(db, "'total_plays', 1"))).toBe(PERMISSION_DENIED);
  });

  it("rolls back twice, and on a database that never had the migration, with no change", async () => {
    const db = await beforeMigration();
    const prior = await fingerprint(db);

    await db.rows(ROLLBACK);
    const once = await fingerprint(db);
    await db.rows(ROLLBACK);

    expect([once, await fingerprint(db)]).toEqual([prior, prior]);
  });

  it("leaves no lock timeout behind on the session that ran the migration or the rollback", async () => {
    const db = await beforeMigration();

    await db.rows(MIGRATION);
    const afterMigration = await db.rows("SELECT current_setting('lock_timeout') AS lock_timeout");
    await db.rows(ROLLBACK);
    const afterRollback = await db.rows("SELECT current_setting('lock_timeout') AS lock_timeout");

    expect([afterMigration, afterRollback]).toEqual([[{ lock_timeout: "0" }], [{ lock_timeout: "0" }]]);
  });

  it("changes nothing when a statement fails halfway", async () => {
    const db = await beforeMigration();
    const prior = await fingerprint(db);
    const failing = MIGRATION.replace("NOTIFY pgrst", "SELECT 1/0; NOTIFY pgrst");

    const result = await db.attempt(failing);
    await db.attempt("ROLLBACK");

    expect(codeOf(result)).toBe("22012");
    expect(await fingerprint(db)).toEqual(prior);
  });
});

describe("schema/game_stats_schema.sql", () => {
  it("describes the same table, policies, grants and function as production after the migration", async () => {
    const fromMigration = await migrated();
    const fromSnapshot = await supabaseLike();
    await fromSnapshot.rows(SNAPSHOT);

    expect(await fingerprint(fromSnapshot)).toEqual(await fingerprint(fromMigration));
  });
});
