import { readFileSync } from "node:fs";
import path from "node:path";
import { startPostgres, type Database, type Postgres } from "./database";

const readSql = (file: string) => readFileSync(path.join(__dirname, "..", file), "utf8");

export const MIGRATION = readSql("migrations/0006_leaderboard_write_lockdown.sql");
export const ROLLBACK = readSql("migrations/0006_leaderboard_write_lockdown_rollback.sql");
// PGlite has no uuid-ossp. The default is never part of what the tests compare.
export const SNAPSHOT = readSql("leaderboard_schema.sql").replace("uuid_generate_v4()", "gen_random_uuid()");

// A Supabase project has these roles and hands them every privilege on a new
// table in public. service_role is the key the server writes with.
const SUPABASE_SHIM = `
  CREATE ROLE anon NOLOGIN;
  CREATE ROLE authenticated NOLOGIN;
  CREATE ROLE service_role NOLOGIN BYPASSRLS;
  GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
  ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
`;

// leaderboard_entries as schema/leaderboard_schema.sql described it after 0004.
export const TABLE_BEFORE_0006 = `
  CREATE TABLE leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    player_name TEXT NOT NULL,
    difficulty TEXT NOT NULL,
    piece_count INTEGER NOT NULL,
    correct_pieces INTEGER NOT NULL,
    memorize_time DECIMAL(10, 3) NOT NULL,
    solution_time DECIMAL(10, 3) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    total_wrong_pieces INTEGER,
    country_code TEXT NOT NULL DEFAULT 'ZZ',
    skill_rating INTEGER NOT NULL DEFAULT 1000,
    daily_day DATE,
    CHECK (correct_pieces <= piece_count),
    CHECK (memorize_time > 0),
    CHECK (solution_time > 0)
  );
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_player_name_length
    CHECK (LENGTH(player_name) >= 4 AND LENGTH(player_name) <= 16);
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_country_code_format
    CHECK (country_code ~ '^[A-Z]{2}$');
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_skill_rating_range
    CHECK (skill_rating BETWEEN 0 AND 5000);
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_difficulty_board
    CHECK (difficulty IN ('easy', 'medium', 'hard', 'grandmaster', 'daily'));
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_daily_day_matches_board
    CHECK ((difficulty = 'daily') = (daily_day IS NOT NULL));
  ALTER TABLE leaderboard_entries
    ADD CONSTRAINT check_daily_day_recent
    CHECK (daily_day IS NULL OR daily_day BETWEEN (created_at AT TIME ZONE 'UTC')::date - 1 AND (created_at AT TIME ZONE 'UTC')::date);
  CREATE FUNCTION leaderboard_daily_created_at() RETURNS trigger
  LANGUAGE plpgsql
  SET search_path = ''
  AS $$
  BEGIN
    NEW.created_at := now();
    RETURN NEW;
  END
  $$;
  CREATE TRIGGER leaderboard_daily_created_at
    BEFORE INSERT ON leaderboard_entries
    FOR EACH ROW
    WHEN (NEW.daily_day IS NOT NULL)
    EXECUTE FUNCTION leaderboard_daily_created_at();
  CREATE INDEX idx_leaderboard_ranking ON leaderboard_entries (
    difficulty, correct_pieces DESC, memorize_time ASC, solution_time ASC
  );
  CREATE INDEX idx_leaderboard_daily_ranking ON leaderboard_entries (
    daily_day, correct_pieces DESC, total_wrong_pieces ASC NULLS LAST, memorize_time ASC, solution_time ASC
  ) WHERE difficulty = 'daily';
`;

// The policies and grants production held on 2026-10-18. The seven table
// privileges are named because PostgreSQL 17 and later add MAINTAIN to ALL,
// and production runs 15.
const PRODUCTION_BEFORE_0006 = `
  ${TABLE_BEFORE_0006}
  ALTER TABLE leaderboard_entries ENABLE ROW LEVEL SECURITY;
  CREATE POLICY "Allow public read" ON leaderboard_entries FOR SELECT USING (true);
  CREATE POLICY "Allow public insert" ON leaderboard_entries FOR INSERT TO public WITH CHECK (true);
  REVOKE ALL ON leaderboard_entries FROM anon, authenticated, service_role;
  GRANT SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER
    ON leaderboard_entries TO anon, authenticated, service_role;
`;

type LeaderboardDatabases = {
  readonly supabaseLike: () => Promise<Database>;
  readonly beforeMigration: () => Promise<Database>;
  readonly migrated: () => Promise<Database>;
};

export function leaderboardDatabases(): LeaderboardDatabases {
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
    await db.rows(PRODUCTION_BEFORE_0006);
    return db;
  };

  const migrated = async () => {
    const db = await beforeMigration();
    await db.rows(MIGRATION);
    return db;
  };

  return { supabaseLike, beforeMigration, migrated };
}
