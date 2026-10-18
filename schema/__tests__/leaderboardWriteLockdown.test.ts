/** @jest-environment node */

import type { Database, SqlResult } from "./database";
import { MIGRATION, ROLLBACK, SNAPSHOT, leaderboardDatabases } from "./leaderboardWriteLockdownDatabase";

jest.setTimeout(20_000);

const PERMISSION_DENIED = "42501";
const CHECK_VIOLATION = "23514";
const WEB_ROLES = ["anon", "authenticated"] as const;
const UTC_TODAY = "(now() AT TIME ZONE 'UTC')::date";

// convalidated is left out: production holds the 0006 checks NOT VALID, and a
// table rebuilt from the schema file holds them plain. MAINTAIN is left out
// because PostgreSQL 17 added it and production runs 15.
const FINGERPRINT = `
  SELECT jsonb_build_object(
    'columns', (
      SELECT jsonb_agg(jsonb_build_array(column_name, data_type, is_nullable, column_default) ORDER BY ordinal_position)
      FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'leaderboard_entries'),
    'constraints', (
      SELECT jsonb_agg(jsonb_build_array(conname, regexp_replace(pg_get_constraintdef(oid), ' NOT VALID$', '')) ORDER BY conname)
      FROM pg_constraint WHERE conrelid = 'public.leaderboard_entries'::regclass),
    'indexes', (
      SELECT jsonb_agg(indexdef ORDER BY indexname)
      FROM pg_indexes WHERE schemaname = 'public' AND tablename = 'leaderboard_entries'),
    'triggers', (
      SELECT jsonb_agg(pg_get_triggerdef(oid) ORDER BY tgname)
      FROM pg_trigger WHERE tgrelid = 'public.leaderboard_entries'::regclass AND NOT tgisinternal),
    'rowSecurity', (
      SELECT jsonb_build_array(relrowsecurity, relforcerowsecurity)
      FROM pg_class WHERE oid = 'public.leaderboard_entries'::regclass),
    'policies', (
      SELECT jsonb_agg(jsonb_build_array(policyname, permissive, roles::text, cmd, qual, with_check) ORDER BY policyname)
      FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard_entries'),
    'tableGrants', (
      SELECT jsonb_agg(jsonb_build_array(grantee, privilege_type) ORDER BY grantee, privilege_type)
      FROM information_schema.role_table_grants
      WHERE table_schema = 'public' AND table_name = 'leaderboard_entries'
        AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
        AND privilege_type <> 'MAINTAIN')
  ) AS fingerprint
`;

type Entry = {
  readonly difficulty: string;
  readonly pieces: number;
  readonly solve: number;
  readonly study?: number;
};

const { supabaseLike, beforeMigration, migrated } = leaderboardDatabases();

function insertSql({ difficulty, pieces, solve, study = 10 }: Entry): string {
  const day = difficulty === "daily" ? UTC_TODAY : "NULL";
  return `
    INSERT INTO public.leaderboard_entries
      (player_name, difficulty, piece_count, correct_pieces, memorize_time, solution_time, country_code, daily_day)
    VALUES ('Rehearsal', '${difficulty}', ${pieces}, ${pieces}, ${study}, ${solve}, 'GB', ${day})
  `;
}

const MEDIUM: Entry = { difficulty: "medium", pieces: 6, solve: 12.5 };

function codeOf(result: SqlResult): string | null {
  return result.ok ? null : result.code;
}

async function fingerprint(db: Database) {
  const [row] = await db.rows(FINGERPRINT);
  return row.fingerprint;
}

async function stored(db: Database) {
  return db.rows(
    "SELECT difficulty, piece_count, solution_time::text AS solve FROM public.leaderboard_entries ORDER BY solution_time",
  );
}

async function directWrites(db: Database, role: string) {
  const writes = {
    insert: await db.attempt(insertSql(MEDIUM), { as: role }),
    update: await db.attempt("UPDATE public.leaderboard_entries SET solution_time = 0.001", { as: role }),
    delete: await db.attempt("DELETE FROM public.leaderboard_entries", { as: role }),
    truncate: await db.attempt("TRUNCATE public.leaderboard_entries", { as: role }),
  };
  return Object.fromEntries(Object.entries(writes).map(([name, result]) => [name, codeOf(result)]));
}

describe("production before 0006", () => {
  it("lets anon store an impossible row straight into the table, which is the bug", async () => {
    const db = await beforeMigration();

    await db.rows(insertSql({ difficulty: "grandmaster", pieces: 20, solve: 0.1 }), { as: "anon" });

    expect(await stored(db)).toEqual([{ difficulty: "grandmaster", piece_count: 20, solve: "0.100" }]);
  });

  it("lets anon empty the board with TRUNCATE", async () => {
    const db = await beforeMigration();
    await db.rows(insertSql(MEDIUM));

    await db.rows("TRUNCATE public.leaderboard_entries", { as: "anon" });

    expect(await stored(db)).toEqual([]);
  });

  it("lets anon's update and delete through the grant, and changes no row, because no policy shows anon one", async () => {
    const db = await beforeMigration();
    await db.rows(insertSql(MEDIUM));

    const update = await db.attempt("UPDATE public.leaderboard_entries SET solution_time = 0.001", { as: "anon" });
    const remove = await db.attempt("DELETE FROM public.leaderboard_entries", { as: "anon" });

    expect([update, remove]).toEqual([
      { ok: true, rows: [] },
      { ok: true, rows: [] },
    ]);
    expect(await stored(db)).toEqual([{ difficulty: "medium", piece_count: 6, solve: "12.500" }]);
  });
});

describe("the table after 0006", () => {
  it.each(WEB_ROLES)("refuses every direct write from %s and keeps the rows", async (role) => {
    const db = await migrated();
    await db.rows(insertSql(MEDIUM));

    expect(await directWrites(db, role)).toEqual({
      insert: PERMISSION_DENIED,
      update: PERMISSION_DENIED,
      delete: PERMISSION_DENIED,
      truncate: PERMISSION_DENIED,
    });
    expect(await stored(db)).toEqual([{ difficulty: "medium", piece_count: 6, solve: "12.500" }]);
  });

  it.each(WEB_ROLES)("lets %s read the board", async (role) => {
    const db = await migrated();
    await db.rows(insertSql(MEDIUM));

    const read = await db.attempt("SELECT player_name, difficulty FROM public.leaderboard_entries", { as: role });

    expect(read).toEqual({ ok: true, rows: [{ player_name: "Rehearsal", difficulty: "medium" }] });
  });

  it("lets service_role store a valid row and read it back", async () => {
    const db = await migrated();

    await db.rows(insertSql(MEDIUM), { as: "service_role" });
    const read = await db.attempt("SELECT player_name, piece_count FROM public.leaderboard_entries", { as: "service_role" });

    expect(read).toEqual({ ok: true, rows: [{ player_name: "Rehearsal", piece_count: 6 }] });
  });

  it("keeps the read policy and drops the insert policy", async () => {
    const db = await migrated();

    const policies = await db.rows(
      "SELECT policyname, cmd, roles::text AS roles, qual FROM pg_policies WHERE schemaname = 'public' AND tablename = 'leaderboard_entries'",
    );

    expect(policies).toEqual([{ policyname: "Allow public read", cmd: "SELECT", roles: "{public}", qual: "true" }]);
  });
});

describe("the three checks after 0006, on rows service_role stores", () => {
  it.each<[string, Entry, string | null]>([
    ["easy at the floor", { difficulty: "easy", pieces: 2, solve: 0.5 }, null],
    ["easy under the floor", { difficulty: "easy", pieces: 2, solve: 0.499 }, "check_solution_time_per_piece"],
    ["medium at the floor", { difficulty: "medium", pieces: 6, solve: 1.5 }, null],
    ["medium under the floor", { difficulty: "medium", pieces: 6, solve: 1.499 }, "check_solution_time_per_piece"],
    ["hard at the floor", { difficulty: "hard", pieces: 12, solve: 3 }, null],
    ["hard under the floor", { difficulty: "hard", pieces: 12, solve: 2.999 }, "check_solution_time_per_piece"],
    ["grandmaster at the floor", { difficulty: "grandmaster", pieces: 20, solve: 5 }, null],
    ["grandmaster under the floor", { difficulty: "grandmaster", pieces: 20, solve: 4.999 }, "check_solution_time_per_piece"],
    ["daily of 7 at the floor", { difficulty: "daily", pieces: 7, solve: 1.75 }, null],
    ["daily of 7 under the floor", { difficulty: "daily", pieces: 7, solve: 1.749 }, "check_solution_time_per_piece"],
    ["60 seconds of study", { ...MEDIUM, study: 60 }, null],
    ["60.001 seconds of study", { ...MEDIUM, study: 60.001 }, "check_memorize_time_longest"],
    ["medium with 5 pieces", { difficulty: "medium", pieces: 5, solve: 12.5 }, "check_board_piece_count"],
    ["grandmaster with 2 pieces", { difficulty: "grandmaster", pieces: 2, solve: 12.5 }, "check_board_piece_count"],
    ["daily with 9 pieces", { difficulty: "daily", pieces: 9, solve: 12.5 }, null],
  ])("%s", async (_, entry, brokenCheck) => {
    const db = await migrated();

    const result = await db.attempt(insertSql(entry), { as: "service_role" });

    expect(result).toEqual(
      brokenCheck === null
        ? { ok: true, rows: [] }
        : {
            ok: false,
            code: CHECK_VIOLATION,
            message: `new row for relation "leaderboard_entries" violates check constraint "${brokenCheck}"`,
          },
    );
  });

  it("holds an update to the floor too", async () => {
    const db = await migrated();
    await db.rows(insertSql(MEDIUM), { as: "service_role" });

    const result = await db.attempt("UPDATE public.leaderboard_entries SET solution_time = 1", { as: "service_role" });

    expect(codeOf(result)).toBe(CHECK_VIOLATION);
  });
});

describe("rows stored before 0006", () => {
  it("survive the migration even when they break the floor, and the checks stay unvalidated", async () => {
    const db = await beforeMigration();
    await db.rows(insertSql({ difficulty: "medium", pieces: 6, solve: 0.565 }));
    await db.rows(insertSql({ difficulty: "grandmaster", pieces: 20, solve: 0.725 }));

    expect(codeOf(await db.attempt(MIGRATION))).toBeNull();

    expect(await stored(db)).toEqual([
      { difficulty: "medium", piece_count: 6, solve: "0.565" },
      { difficulty: "grandmaster", piece_count: 20, solve: "0.725" },
    ]);
    expect(
      await db.rows(`
        SELECT conname, convalidated FROM pg_constraint
        WHERE conrelid = 'public.leaderboard_entries'::regclass
          AND conname IN ('check_board_piece_count', 'check_solution_time_per_piece', 'check_memorize_time_longest')
        ORDER BY conname
      `),
    ).toEqual([
      { conname: "check_board_piece_count", convalidated: false },
      { conname: "check_memorize_time_longest", convalidated: false },
      { conname: "check_solution_time_per_piece", convalidated: false },
    ]);
  });
});

describe("applying and rolling back", () => {
  it("is a no-op the second time", async () => {
    const db = await migrated();
    const before = await fingerprint(db);

    await db.rows(MIGRATION);

    expect(await fingerprint(db)).toEqual(before);
  });

  it("restores production's prior policies and grants on rollback, drops the checks, and keeps the rows", async () => {
    const db = await beforeMigration();
    const prior = await fingerprint(db);
    await db.rows(MIGRATION);
    await db.rows(insertSql(MEDIUM), { as: "service_role" });

    await db.rows(ROLLBACK);

    expect(await fingerprint(db)).toEqual(prior);
    expect(await stored(db)).toEqual([{ difficulty: "medium", piece_count: 6, solve: "12.500" }]);
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

describe("schema/leaderboard_schema.sql", () => {
  it("describes the same table, checks, policies and grants as production after the migration", async () => {
    const fromMigration = await migrated();
    const fromSnapshot = await supabaseLike();
    await fromSnapshot.rows(SNAPSHOT);

    expect(await fingerprint(fromSnapshot)).toEqual(await fingerprint(fromMigration));
  });
});
