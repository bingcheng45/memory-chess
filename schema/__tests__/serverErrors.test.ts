/** @jest-environment node */

import type { Database, SqlResult } from "./database";
import { MIGRATION, ROLLBACK, serverErrorDatabases } from "./serverErrorsDatabase";

jest.setTimeout(20_000);

const PERMISSION_DENIED = "42501";
const CHECK_VIOLATION = "23514";
const UNDEFINED_TABLE = "42P01";
const WEB_ROLES = ["anon", "authenticated"] as const;

const INSERT = `
  INSERT INTO public.server_errors (route, kind, message, detail, deploy)
  VALUES ('POST /api/leaderboard', 'failed', 'Error: connect ECONNREFUSED', '{"code":"ECONNREFUSED"}', 'e891778c')
`;

const FINGERPRINT = `
  SELECT jsonb_build_object(
    'columns', (
      SELECT jsonb_agg(jsonb_build_array(column_name, data_type, is_nullable, column_default, is_identity) ORDER BY ordinal_position)
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'server_errors'),
    'constraints', (
      SELECT jsonb_agg(jsonb_build_array(conname, pg_get_constraintdef(oid)) ORDER BY conname)
      FROM pg_constraint WHERE conrelid = 'public.server_errors'::regclass),
    'indexes', (
      SELECT jsonb_agg(indexdef ORDER BY indexname)
      FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'server_errors'),
    'rowSecurity', (SELECT relrowsecurity FROM pg_class WHERE oid = 'public.server_errors'::regclass),
    'policies', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public' AND tablename = 'server_errors'),
    'tableGrants', (
      SELECT jsonb_agg(jsonb_build_array(grantee, privilege_type) ORDER BY grantee, privilege_type)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND table_name = 'server_errors'
        AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')),
    'sequenceGrants', (
      SELECT jsonb_agg(jsonb_build_array(r.rolname, has_sequence_privilege(r.rolname, 'public.server_errors_id_seq', 'USAGE,SELECT,UPDATE')) ORDER BY r.rolname)
      FROM pg_roles r WHERE r.rolname IN ('anon', 'authenticated'))
  ) AS fingerprint
`;

const { supabaseLike, migrated } = serverErrorDatabases();

function codeOf(result: SqlResult): string | null {
  return result.ok ? null : result.code;
}

async function fingerprint(db: Database) {
  const [row] = await db.rows(FINGERPRINT);
  return row.fingerprint;
}

const stored = (db: Database) =>
  db.rows("SELECT id::int AS id, route, kind, message, detail, deploy, created_at IS NOT NULL AS dated FROM public.server_errors ORDER BY id");

async function everyOperation(db: Database, role: string) {
  const operations = {
    select: await db.attempt("SELECT count(*) FROM public.server_errors", { as: role }),
    insert: await db.attempt(INSERT, { as: role }),
    update: await db.attempt("UPDATE public.server_errors SET message = 'x'", { as: role }),
    delete: await db.attempt("DELETE FROM public.server_errors", { as: role }),
    truncate: await db.attempt("TRUNCATE public.server_errors", { as: role }),
    nextId: await db.attempt("SELECT nextval('public.server_errors_id_seq')", { as: role }),
  };
  return Object.fromEntries(Object.entries(operations).map(([name, result]) => [name, codeOf(result)]));
}

describe("the server_errors table after 0007", () => {
  it.each(WEB_ROLES)("refuses every operation from %s and keeps the rows", async (role) => {
    const db = await migrated();
    await db.rows(INSERT);

    expect(await everyOperation(db, role)).toEqual({
      select: PERMISSION_DENIED,
      insert: PERMISSION_DENIED,
      update: PERMISSION_DENIED,
      delete: PERMISSION_DENIED,
      truncate: PERMISSION_DENIED,
      nextId: PERMISSION_DENIED,
    });
    expect(await stored(db)).toHaveLength(1);
  });

  it("refuses anon even after a table grant is added by mistake, because no policy shows it a row", async () => {
    const db = await migrated();
    await db.rows(INSERT);
    await db.rows("GRANT SELECT, INSERT ON public.server_errors TO anon");

    const read = await db.attempt("SELECT count(*)::int AS rows FROM public.server_errors", { as: "anon" });
    const insert = await db.attempt(INSERT, { as: "anon" });

    expect(read).toEqual({ ok: true, rows: [{ rows: 0 }] });
    expect(codeOf(insert)).toBe(PERMISSION_DENIED);
  });

  it("lets service_role insert a row and read it back with an id, a time and the deploy", async () => {
    const db = await migrated();

    await db.rows(INSERT, { as: "service_role" });
    const read = await db.rows("SELECT route, kind, message, detail, deploy FROM public.server_errors", { as: "service_role" });

    expect(read).toEqual([
      {
        route: "POST /api/leaderboard",
        kind: "failed",
        message: "Error: connect ECONNREFUSED",
        detail: { code: "ECONNREFUSED" },
        deploy: "e891778c",
      },
    ]);
    expect(await stored(db)).toEqual([
      {
        id: 1,
        route: "POST /api/leaderboard",
        kind: "failed",
        message: "Error: connect ECONNREFUSED",
        detail: { code: "ECONNREFUSED" },
        deploy: "e891778c",
        dated: true,
      },
    ]);
  });

  it("lets service_role neither change nor erase the log", async () => {
    const db = await migrated();
    await db.rows(INSERT);

    const changes = {
      update: codeOf(await db.attempt("UPDATE public.server_errors SET message = 'x'", { as: "service_role" })),
      delete: codeOf(await db.attempt("DELETE FROM public.server_errors", { as: "service_role" })),
      truncate: codeOf(await db.attempt("TRUNCATE public.server_errors", { as: "service_role" })),
    };

    expect(changes).toEqual({ update: PERMISSION_DENIED, delete: PERMISSION_DENIED, truncate: PERMISSION_DENIED });
    expect(await stored(db)).toHaveLength(1);
  });

  it.each([
    ["a message of 501 characters", `'${"m".repeat(501)}'`, "'{}'", "server_errors_message_length"],
    ["a detail over 2 kB", "'short'", `'{"blob":"${"d".repeat(2100)}"}'`, "server_errors_detail_size"],
  ])("refuses %s", async (_, message, detail, constraint) => {
    const db = await migrated();

    const result = await db.attempt(
      `INSERT INTO public.server_errors (route, kind, message, detail) VALUES ('GET /api/leaderboard', 'failed', ${message}, ${detail})`,
      { as: "service_role" },
    );

    expect(result).toEqual({
      ok: false,
      code: CHECK_VIOLATION,
      message: `new row for relation "server_errors" violates check constraint "${constraint}"`,
    });
  });

  it("stores a message of exactly 500 characters", async () => {
    const db = await migrated();

    await db.rows(
      `INSERT INTO public.server_errors (route, kind, message) VALUES ('GET /api/leaderboard', 'failed', '${"m".repeat(500)}')`,
      { as: "service_role" },
    );

    expect(await db.rows("SELECT char_length(message) AS length FROM public.server_errors")).toEqual([{ length: 500 }]);
  });

  it("reads the newest rows through the created_at index", async () => {
    const db = await migrated();
    await db.rows("SET enable_seqscan = off");

    const [plan] = await db.rows(
      "EXPLAIN (FORMAT JSON) SELECT * FROM public.server_errors WHERE created_at > now() - interval '1 day' ORDER BY created_at DESC LIMIT 50",
    );

    expect(JSON.stringify(plan)).toContain('"Index Name":"server_errors_created_at_idx"');
  });
});

describe("running 0007 again", () => {
  it("is a no-op that keeps the rows", async () => {
    const db = await migrated();
    await db.rows(INSERT);
    const before = await fingerprint(db);

    await db.rows(MIGRATION);

    expect(await fingerprint(db)).toEqual(before);
    expect(await stored(db)).toHaveLength(1);
  });
});

describe("the 0007 rollback", () => {
  it("removes the table, as on a database that never had 0007", async () => {
    const db = await migrated();
    await db.rows(INSERT);

    await db.rows(ROLLBACK);

    expect(codeOf(await db.attempt("SELECT 1 FROM public.server_errors"))).toBe(UNDEFINED_TABLE);
    expect(await db.rows("SELECT to_regclass('public.server_errors_id_seq') AS sequence")).toEqual([{ sequence: null }]);
  });

  it("is safe to run twice, and on a database that never had 0007", async () => {
    const db = await supabaseLike();

    const first = await db.attempt(ROLLBACK);
    const second = await db.attempt(ROLLBACK);

    expect([first.ok, second.ok]).toEqual([true, true]);
  });

  it("lets 0007 run again afterwards and land in the same state", async () => {
    const db = await migrated();
    const before = await fingerprint(db);

    await db.rows(ROLLBACK);
    await db.rows(MIGRATION);

    expect(await fingerprint(db)).toEqual(before);
  });
});
