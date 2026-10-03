import { readFileSync } from "node:fs";
import path from "node:path";
import type { Database, Postgres } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");

export const MIGRATION = readSql("migrations/0002_article_stats.sql");
export const ROLLBACK = readSql("migrations/0002_article_stats_rollback.sql");
export const SNAPSHOT = readSql("article_stats_schema.sql");

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

export async function supabaseLikeDatabase(postgres: Postgres): Promise<Database> {
  const db = await postgres.open();
  await db.rows(SUPABASE_SHIM);
  return db;
}

export async function migratedDatabase(postgres: Postgres): Promise<Database> {
  const db = await supabaseLikeDatabase(postgres);
  await db.rows(MIGRATION);
  return db;
}
