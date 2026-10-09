/** @jest-environment node */

import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres, type SqlResult } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");
const MIGRATION = readSql("migrations/0003_lab_backups.sql");
const ROLLBACK = readSql("migrations/0003_lab_backups_rollback.sql");

// A Supabase project has these roles, grants the web roles everything new in
// public, and gives the server's service_role its own login.
const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated, service_role;
`;

const PERMISSION_DENIED = "42501";
const INVALID_PARAMETER = "22023";
const CHECK_VIOLATION = "23514";
const LOOKUP = "A".repeat(43);
const OTHER_LOOKUP = "b".repeat(42) + "_";
// 29 bytes, the smallest sealed record: a version byte, a 12-byte nonce and a 16-byte tag.
const SEALED = Buffer.alloc(29, 7).toString("base64");

let postgres: Postgres;
beforeAll(async () => {
  postgres = await startPostgres();
}, 60_000);
afterEach(() => postgres.closeAll());
afterAll(() => postgres.stop());

async function migrated(): Promise<Database> {
  const db = await postgres.open();
  await db.rows(SUPABASE_SHIM);
  await db.rows(MIGRATION);
  return db;
}

const codeOf = (result: SqlResult) => (result.ok ? null : result.code);
const put = (db: Database, lookup: string, sealed: string, as = "service_role") =>
  db.attempt(`SELECT public.lab_backup_put('${lookup}', '${sealed}') AS saved`, { as });
const get = (db: Database, lookup: string) => db.rows(`SELECT sealed FROM public.lab_backup_get('${lookup}')`, { as: "service_role" });

describe("0003 lab_backups", () => {
  it("lets service_role store, read back, replace and delete a backup by its lookup", async () => {
    const db = await migrated();
    const replaced = Buffer.alloc(40, 9).toString("base64");

    expect((await put(db, LOOKUP, SEALED)).ok).toBe(true);
    expect(await get(db, LOOKUP)).toEqual([{ sealed: SEALED }]);
    expect((await put(db, LOOKUP, replaced)).ok).toBe(true);
    expect(await get(db, LOOKUP)).toEqual([{ sealed: replaced }]);
    expect(await get(db, OTHER_LOOKUP)).toEqual([]);
    expect(await db.rows(`SELECT public.lab_backup_delete('${LOOKUP}') AS deleted`, { as: "service_role" })).toEqual([{ deleted: true }]);
    expect(await db.rows(`SELECT public.lab_backup_delete('${LOOKUP}') AS deleted`, { as: "service_role" })).toEqual([{ deleted: false }]);
    expect(await get(db, LOOKUP)).toEqual([]);
  });

  it("keeps only the hash of the lookup, never the lookup itself", async () => {
    const db = await migrated();
    await put(db, LOOKUP, SEALED);

    expect(await db.rows(`SELECT encode(lookup_hash, 'hex') AS hash FROM public.lab_backups`)).toEqual([
      { hash: "0f007385b6f9d4b7eeb2748605afe1a984a0a3bfa3f014d09e2a784ce9e5cd1a" },
    ]);
  });

  it("returns a large backup as one line of base64", async () => {
    const db = await migrated();
    const large = Buffer.alloc(100_000, 3).toString("base64");
    await put(db, LOOKUP, large);

    expect(await get(db, LOOKUP)).toEqual([{ sealed: large }]);
  });

  it("refuses a malformed lookup and a record over 1 MiB", async () => {
    const db = await migrated();

    expect(codeOf(await put(db, "short", SEALED))).toBe(INVALID_PARAMETER);
    expect(codeOf(await put(db, `${LOOKUP.slice(1)}=`, SEALED))).toBe(INVALID_PARAMETER);
    expect(codeOf(await put(db, LOOKUP, Buffer.alloc(1_048_579).toString("base64")))).toBe(INVALID_PARAMETER);
    expect(codeOf(await put(db, LOOKUP, Buffer.alloc(1_048_577).toString("base64")))).toBe(CHECK_VIOLATION);
    expect(codeOf(await put(db, LOOKUP, Buffer.alloc(28).toString("base64")))).toBe(CHECK_VIOLATION);
    expect(await db.rows(`SELECT count(*)::int AS n FROM public.lab_backups`)).toEqual([{ n: 0 }]);
  });

  it.each(["anon", "authenticated"])("gives %s no way to read, write, empty or call into backups", async (role) => {
    const db = await migrated();
    await put(db, LOOKUP, SEALED);

    expect(codeOf(await db.attempt(`SELECT * FROM public.lab_backups`, { as: role }))).toBe(PERMISSION_DENIED);
    expect(codeOf(await db.attempt(`TRUNCATE public.lab_backups`, { as: role }))).toBe(PERMISSION_DENIED);
    expect(codeOf(await put(db, OTHER_LOOKUP, SEALED, role))).toBe(PERMISSION_DENIED);
    expect(codeOf(await db.attempt(`SELECT * FROM public.lab_backup_get('${LOOKUP}')`, { as: role }))).toBe(PERMISSION_DENIED);
    expect(codeOf(await db.attempt(`SELECT public.lab_backup_delete('${LOOKUP}')`, { as: role }))).toBe(PERMISSION_DENIED);
    expect(codeOf(await db.attempt(`SELECT public.lab_backup_expire()`, { as: role }))).toBe(PERMISSION_DENIED);
  });

  it("expires only backups not written for 12 months", async () => {
    const db = await migrated();
    await put(db, LOOKUP, SEALED);
    await put(db, OTHER_LOOKUP, SEALED);
    await db.rows(`UPDATE public.lab_backups SET updated_at = now() - INTERVAL '13 months' WHERE lookup_hash = sha256(convert_to('${LOOKUP}', 'UTF8'))`);

    expect(await db.rows(`SELECT public.lab_backup_expire() AS deleted`, { as: "service_role" })).toEqual([{ deleted: 1 }]);
    expect(await get(db, LOOKUP)).toEqual([]);
    expect(await get(db, OTHER_LOOKUP)).toEqual([{ sealed: SEALED }]);
  });

  it("runs a second time without error and keeps the backups", async () => {
    const db = await migrated();
    await put(db, LOOKUP, SEALED);

    await db.rows(MIGRATION);

    expect(await get(db, LOOKUP)).toEqual([{ sealed: SEALED }]);
  });

  it("rolls back to nothing, twice in a row", async () => {
    const db = await migrated();

    await db.rows(ROLLBACK);
    await db.rows(ROLLBACK);

    expect(
      await db.rows(`SELECT
        to_regclass('public.lab_backups') IS NULL AS table_gone,
        (SELECT count(*)::int FROM pg_proc WHERE proname LIKE 'lab_backup%') AS functions`),
    ).toEqual([{ table_gone: true, functions: 0 }]);
  });
});
