import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");

export const MIGRATION = readSql("migrations/0007_server_errors.sql");
export const ROLLBACK = readSql("migrations/0007_server_errors_rollback.sql");

const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;
`;

type ServerErrorDatabases = {
  readonly supabaseLike: () => Promise<Database>;
  readonly migrated: () => Promise<Database>;
};

export function serverErrorDatabases(): ServerErrorDatabases {
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

  const supabaseLike = async () => {
    const db = await postgres.open();
    await db.rows(SUPABASE_SHIM);
    return db;
  };

  const migrated = async () => {
    const db = await supabaseLike();
    await db.rows(MIGRATION);
    return db;
  };

  return { supabaseLike, migrated };
}
