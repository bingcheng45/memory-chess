/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres, type SqlResult } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");
const MIGRATION = readSql("migrations/0002_article_stats.sql");
const ROLLBACK = readSql("migrations/0002_article_stats_rollback.sql");
const SNAPSHOT = readSql("article_stats_schema.sql");

// A Supabase project has these roles and hands them every privilege on a new
// table and function in public. Without that, a migration that forgot its
// revoke would still pass.
const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE stranger NOLOGIN;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, stranger;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
`;

const PERMISSION_DENIED = "42501";
const INVALID_PARAMETER = "22023";
const CHECK_VIOLATION = "23514";
const UNDEFINED_TABLE = "42P01";
const UNDEFINED_FUNCTION = "42883";
const WEB_ROLES = ["anon", "authenticated"] as const;
const SLUG = "magnus-carlsen";
const LONGEST_SLUG = "a".repeat(80);

const FINGERPRINT = `
  SELECT jsonb_build_object(
    'columns', (
      SELECT jsonb_agg(jsonb_build_array(column_name, data_type, is_nullable, column_default) ORDER BY ordinal_position)
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'article_stats'),
    'constraints', (
      SELECT jsonb_agg(jsonb_build_array(conname, pg_get_constraintdef(oid)) ORDER BY conname)
      FROM pg_constraint WHERE conrelid = 'public.article_stats'::regclass),
    'rowSecurity', (
      SELECT jsonb_build_array(relrowsecurity, relforcerowsecurity)
      FROM pg_class WHERE oid = 'public.article_stats'::regclass),
    'policies', (
      SELECT jsonb_agg(jsonb_build_array(policyname, permissive, roles::text, cmd, qual, with_check) ORDER BY policyname)
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'article_stats'),
    'tableGrants', (
      SELECT jsonb_agg(jsonb_build_array(grantee, privilege_type) ORDER BY grantee, privilege_type)
      FROM information_schema.role_table_grants WHERE table_schema = 'public' AND table_name = 'article_stats'),
    'function', pg_get_functiondef('public.record_article_event(text, text)'::regprocedure),
    'functionAcl', (
      SELECT proacl::text FROM pg_proc WHERE oid = 'public.record_article_event(text, text)'::regprocedure)
  ) AS fingerprint
`;

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

function literal(value: string | null): string {
  return value === null ? "NULL" : `'${value.replaceAll("'", "''")}'`;
}

async function supabaseLike(): Promise<Database> {
  const db = await postgres.open();
  await db.rows(SUPABASE_SHIM);
  return db;
}

async function migrated(): Promise<Database> {
  const db = await supabaseLike();
  await db.rows(MIGRATION);
  return db;
}

function record(db: Database, slug: string | null, event: string | null, as = "anon"): Promise<SqlResult> {
  return db.attempt(`SELECT * FROM public.record_article_event(${literal(slug)}, ${literal(event)})`, { as });
}

async function counts(db: Database, slug = SLUG) {
  const [row] = await db.rows(`SELECT views, likes FROM public.article_stats WHERE slug = ${literal(slug)}`);
  return row;
}

async function fingerprint(db: Database) {
  const [row] = await db.rows(FINGERPRINT);
  return row.fingerprint;
}

function codeOf(result: SqlResult): string | null {
  return result.ok ? null : result.code;
}

describe("the Supabase shim", () => {
  it("lets anon write a new table that has no revoke, as a real project does", async () => {
    const db = await supabaseLike();
    await db.rows("CREATE TABLE public.unguarded (id INT)");

    const insert = await db.attempt("INSERT INTO public.unguarded VALUES (1)", { as: "anon" });

    expect(insert.ok).toBe(true);
  });
});

describe("record_article_event", () => {
  it("adds one view at a time and leaves likes alone", async () => {
    const db = await migrated();

    expect(await record(db, SLUG, "view")).toEqual({ ok: true, rows: [{ views: 1, likes: 0 }] });
    expect(await record(db, SLUG, "view")).toEqual({ ok: true, rows: [{ views: 2, likes: 0 }] });
    expect(await counts(db)).toEqual({ views: 2, likes: 0 });
  });

  it("adds one like, removes one, and stops at zero", async () => {
    const db = await migrated();

    expect(await record(db, SLUG, "like")).toEqual({ ok: true, rows: [{ views: 0, likes: 1 }] });
    expect(await record(db, SLUG, "like")).toEqual({ ok: true, rows: [{ views: 0, likes: 2 }] });
    expect(await record(db, SLUG, "unlike")).toEqual({ ok: true, rows: [{ views: 0, likes: 1 }] });
    expect(await record(db, SLUG, "unlike")).toEqual({ ok: true, rows: [{ views: 0, likes: 0 }] });
    expect(await record(db, SLUG, "unlike")).toEqual({ ok: true, rows: [{ views: 0, likes: 0 }] });
  });

  it("answers zero likes for an unlike of an article nobody has opened", async () => {
    const db = await migrated();

    expect(await record(db, SLUG, "unlike")).toEqual({ ok: true, rows: [{ views: 0, likes: 0 }] });
  });

  it("keeps each article's counts apart", async () => {
    const db = await migrated();
    await record(db, SLUG, "view");
    await record(db, "judit-polgar", "like");

    expect(await counts(db, SLUG)).toEqual({ views: 1, likes: 0 });
    expect(await counts(db, "judit-polgar")).toEqual({ views: 0, likes: 1 });
  });

  it("moves updated_at on every write", async () => {
    const db = await migrated();
    await record(db, SLUG, "view");
    await db.rows("UPDATE public.article_stats SET updated_at = '2000-01-01T00:00:00Z'");

    await record(db, SLUG, "like");

    const [row] = await db.rows("SELECT updated_at > '2026-01-01T00:00:00Z' AS moved FROM public.article_stats");
    expect(row.moved).toBe(true);
  });

  it.each(["purge", "VIEW", "views", " view", "", null])("refuses the event %p", async (event) => {
    const db = await migrated();

    const result = await record(db, SLUG, event);

    expect(codeOf(result)).toBe(INVALID_PARAMETER);
    expect(await db.rows("SELECT slug FROM public.article_stats")).toEqual([]);
  });

  it.each([
    ["upper case", "Magnus-Carlsen"],
    ["a space", "magnus carlsen"],
    ["a leading hyphen", "-magnus"],
    ["a trailing hyphen", "magnus-"],
    ["a double hyphen", "magnus--carlsen"],
    ["an underscore", "magnus_carlsen"],
    ["a quote", "magnus'; DROP TABLE public.article_stats; --"],
    ["a trailing newline", "magnus\n"],
    ["81 characters", "a".repeat(81)],
    ["an empty string", ""],
    ["null", null],
  ])("refuses a slug with %s", async (_, slug) => {
    const db = await migrated();

    const result = await record(db, slug, "view");

    expect(codeOf(result)).toBe(INVALID_PARAMETER);
    expect(await db.rows("SELECT slug FROM public.article_stats")).toEqual([]);
  });

  it("accepts a slug of exactly 80 characters", async () => {
    const db = await migrated();

    expect(await record(db, LONGEST_SLUG, "view")).toEqual({ ok: true, rows: [{ views: 1, likes: 0 }] });
  });

  it("never repeats its input in the error it raises", async () => {
    const db = await migrated();

    const badEvent = await record(db, SLUG, "zzmarker");
    const badSlug = await record(db, "ZZMARKER", "view");

    expect(badEvent.ok ? "" : badEvent.message).not.toMatch(/zzmarker/i);
    expect(badSlug.ok ? "" : badSlug.message).not.toMatch(/zzmarker/i);
  });
});

describe("who may do what", () => {
  it.each(WEB_ROLES)("lets %s read the counts", async (role) => {
    const db = await migrated();
    await record(db, SLUG, "view");

    const read = await db.attempt("SELECT slug, views, likes FROM public.article_stats", { as: role });

    expect(read).toEqual({ ok: true, rows: [{ slug: SLUG, views: 1, likes: 0 }] });
  });

  it.each(WEB_ROLES)("refuses every direct write from %s", async (role) => {
    const db = await migrated();
    await record(db, SLUG, "view");

    const writes = {
      insert: await db.attempt("INSERT INTO public.article_stats (slug, views) VALUES ('made-up', 999)", { as: role }),
      update: await db.attempt("UPDATE public.article_stats SET views = 999", { as: role }),
      delete: await db.attempt("DELETE FROM public.article_stats", { as: role }),
      truncate: await db.attempt("TRUNCATE public.article_stats", { as: role }),
    };

    expect(Object.fromEntries(Object.entries(writes).map(([name, result]) => [name, codeOf(result)]))).toEqual({
      insert: PERMISSION_DENIED,
      update: PERMISSION_DENIED,
      delete: PERMISSION_DENIED,
      truncate: PERMISSION_DENIED,
    });
    expect(await db.rows("SELECT slug, views, likes FROM public.article_stats")).toEqual([
      { slug: SLUG, views: 1, likes: 0 },
    ]);
  });

  it.each(WEB_ROLES)("lets %s write through the function", async (role) => {
    const db = await migrated();

    expect(await record(db, SLUG, "like", role)).toEqual({ ok: true, rows: [{ views: 0, likes: 1 }] });
  });

  it("refuses the function to a role that was not granted it", async () => {
    const db = await migrated();

    expect(codeOf(await record(db, SLUG, "view", "stranger"))).toBe(PERMISSION_DENIED);
  });

  it("refuses the read to a role that was not granted it", async () => {
    const db = await migrated();

    const read = await db.attempt("SELECT * FROM public.article_stats", { as: "stranger" });

    expect(codeOf(read)).toBe(PERMISSION_DENIED);
  });

  it("runs the function as its owner with an empty search path", async () => {
    const db = await migrated();

    const [row] = await db.rows(`
      SELECT p.prosecdef, p.proconfig::text AS config, p.proowner = c.relowner AS owned_by_table_owner
      FROM pg_proc p, pg_class c
      WHERE p.oid = 'public.record_article_event(text, text)'::regprocedure
        AND c.oid = 'public.article_stats'::regclass
    `);

    expect(row).toEqual({ prosecdef: true, config: '{"search_path=\\"\\""}', owned_by_table_owner: true });
  });

  it("writes only because of the definer: as an invoker function the same call is refused", async () => {
    const db = await migrated();
    await db.rows("ALTER FUNCTION public.record_article_event(text, text) SECURITY INVOKER");

    expect(codeOf(await record(db, SLUG, "view"))).toBe(PERMISSION_DENIED);
  });

  it("is not fooled by a table of the same name earlier on the caller's search path", async () => {
    const db = await migrated();
    await db.rows(`
      CREATE SCHEMA decoy;
      CREATE TABLE decoy.article_stats (slug TEXT PRIMARY KEY, views BIGINT DEFAULT 0, likes BIGINT DEFAULT 0, updated_at TIMESTAMPTZ);
      GRANT USAGE ON SCHEMA decoy TO anon;
      SET search_path = decoy, public;
    `);

    await record(db, SLUG, "view");

    expect(await db.rows("SELECT slug FROM decoy.article_stats")).toEqual([]);
    expect(await counts(db)).toEqual({ views: 1, likes: 0 });
  });

  it("has row level security on, with one policy, for reads", async () => {
    const db = await migrated();

    const [table] = await db.rows("SELECT relrowsecurity FROM pg_class WHERE oid = 'public.article_stats'::regclass");
    const policies = await db.rows(
      "SELECT cmd, roles::text AS roles, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'article_stats'",
    );

    expect(table.relrowsecurity).toBe(true);
    expect(policies).toEqual([{ cmd: "SELECT", roles: "{anon,authenticated}", qual: "true" }]);
  });

  it("grants anon and authenticated select on the table and nothing else", async () => {
    const db = await migrated();

    const grants = await db.rows(`
      SELECT grantee, privilege_type FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND table_name = 'article_stats' AND grantee IN ('anon', 'authenticated')
      ORDER BY grantee
    `);

    expect(grants).toEqual([
      { grantee: "anon", privilege_type: "SELECT" },
      { grantee: "authenticated", privilege_type: "SELECT" },
    ]);
  });
});

describe("the table's own checks", () => {
  it.each([
    ["a slug the pattern refuses", "INSERT INTO public.article_stats (slug) VALUES ('Bad Slug')"],
    ["a slug of 81 characters", `INSERT INTO public.article_stats (slug) VALUES ('${"a".repeat(81)}')`],
    ["a negative view count", "INSERT INTO public.article_stats (slug, views) VALUES ('magnus-carlsen', -1)"],
    ["a negative like count", "INSERT INTO public.article_stats (slug, likes) VALUES ('magnus-carlsen', -1)"],
  ])("refuse %s even from the owner", async (_, sql) => {
    const db = await migrated();

    expect(codeOf(await db.attempt(sql))).toBe(CHECK_VIOLATION);
  });
});

describe("applying and rolling back", () => {
  it("is a no-op the second time, and keeps the counts written in between", async () => {
    const db = await migrated();
    await record(db, SLUG, "view");
    await record(db, SLUG, "like");
    const before = await fingerprint(db);

    await db.rows(MIGRATION);

    expect(await fingerprint(db)).toEqual(before);
    expect(await counts(db)).toEqual({ views: 1, likes: 1 });
    expect(codeOf(await db.attempt("TRUNCATE public.article_stats", { as: "anon" }))).toBe(PERMISSION_DENIED);
  });

  it("removes the table and the function on rollback", async () => {
    const db = await migrated();

    await db.rows(ROLLBACK);

    expect(codeOf(await db.attempt("SELECT * FROM public.article_stats"))).toBe(UNDEFINED_TABLE);
    expect(codeOf(await db.attempt("SELECT * FROM public.record_article_event('magnus-carlsen', 'view')"))).toBe(
      UNDEFINED_FUNCTION,
    );
  });

  it("rolls back twice, and on a database that never had the migration, without an error", async () => {
    const db = await migrated();
    await db.rows(ROLLBACK);

    expect((await db.attempt(ROLLBACK)).ok).toBe(true);
    expect((await (await supabaseLike()).attempt(ROLLBACK)).ok).toBe(true);
  });

  it("rolls back a half-applied migration that has the table and no function", async () => {
    const db = await migrated();
    await db.rows("DROP FUNCTION public.record_article_event(text, text)");

    await db.rows(ROLLBACK);

    expect(codeOf(await db.attempt("SELECT * FROM public.article_stats"))).toBe(UNDEFINED_TABLE);
  });

  it("applies again after a rollback and starts from empty counts", async () => {
    const db = await migrated();
    await record(db, SLUG, "view");
    await db.rows(ROLLBACK);

    await db.rows(MIGRATION);

    expect(await record(db, SLUG, "view")).toEqual({ ok: true, rows: [{ views: 1, likes: 0 }] });
  });
});

describe("schema/article_stats_schema.sql", () => {
  it("describes the same table, policy, grants and function as the migration", async () => {
    const fromMigration = await migrated();
    const fromSnapshot = await supabaseLike();
    await fromSnapshot.rows(SNAPSHOT);

    expect(await fingerprint(fromSnapshot)).toEqual(await fingerprint(fromMigration));
  });
});
