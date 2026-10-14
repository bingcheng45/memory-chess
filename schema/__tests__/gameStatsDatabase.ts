import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");

export const MIGRATION = readSql("migrations/0005_game_stats_increment.sql");
export const ROLLBACK = readSql("migrations/0005_game_stats_increment_rollback.sql");
// PGlite has no uuid-ossp. The default is never part of what the tests compare.
export const SNAPSHOT = readSql("game_stats_schema.sql").replace("uuid_generate_v4()", "gen_random_uuid()");

export const PLAYS_BEFORE = 1042;

// A Supabase project has these roles and hands them every privilege on a new
// table and function in public.
const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE stranger NOLOGIN;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, stranger;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON FUNCTIONS TO anon, authenticated;
`;

// game_stats and increment_metric as production held them on 2026-10-14,
// read from the live database. The seven table privileges are named because
// PostgreSQL 17 and later add MAINTAIN to ALL, and production runs 15.
const PRODUCTION_BEFORE_0005 = `
  CREATE TABLE game_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_name TEXT NOT NULL UNIQUE,
    metric_value BIGINT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  );
  CREATE INDEX idx_game_stats_metric_name ON game_stats (metric_name);
  INSERT INTO game_stats (metric_name, metric_value) VALUES ('total_plays', ${PLAYS_BEFORE});

  ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Allow public read" ON game_stats FOR SELECT USING (true);
  CREATE POLICY "Allow public increment" ON game_stats FOR UPDATE USING (true);
  REVOKE ALL ON game_stats FROM anon, authenticated;
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON game_stats TO anon, authenticated;

-- Not indented, so the body text matches the one the rollback restores.
CREATE OR REPLACE FUNCTION increment_metric(p_metric_name TEXT, p_increment BIGINT DEFAULT 1)
RETURNS BIGINT AS $$
DECLARE
  v_new_value BIGINT;
BEGIN
  -- Insert the metric if it doesn't exist, otherwise update it
  INSERT INTO game_stats (metric_name, metric_value, last_updated)
  VALUES (p_metric_name, p_increment, NOW())
  ON CONFLICT (metric_name)
  DO UPDATE SET
    metric_value = game_stats.metric_value + p_increment,
    last_updated = NOW()
  RETURNING metric_value INTO v_new_value;

  RETURN v_new_value;
END;
$$ LANGUAGE plpgsql;
  GRANT EXECUTE ON FUNCTION increment_metric(TEXT, BIGINT) TO PUBLIC, anon, authenticated;
`;

type GameStatsDatabases = {
  readonly supabaseLike: () => Promise<Database>;
  readonly beforeMigration: () => Promise<Database>;
  readonly migrated: () => Promise<Database>;
};

export function gameStatsDatabases(): GameStatsDatabases {
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

  const beforeMigration = async () => {
    const db = await supabaseLike();
    await db.rows(PRODUCTION_BEFORE_0005);
    return db;
  };

  const migrated = async () => {
    const db = await beforeMigration();
    await db.rows(MIGRATION);
    return db;
  };

  return { supabaseLike, beforeMigration, migrated };
}
