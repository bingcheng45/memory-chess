/** @jest-environment node */

import { getLeaderboard, getStanding } from "@/lib/services/leaderboardService";

type Row = Record<string, string | number | null>;

const daily = (id: string, day: string, country: string, correct: number, wrong: number, memorize: number, solve: number): Row => ({
  id,
  player_name: `Player ${id.slice(-4)}`,
  difficulty: "daily",
  daily_day: day,
  country_code: country,
  piece_count: day === "2026-10-13" ? 6 : 5,
  correct_pieces: correct,
  total_wrong_pieces: wrong,
  memorize_time: memorize,
  solution_time: solve,
  skill_rating: 1000,
  created_at: `${day}T09:00:00Z`,
});

const TODAY_ENTRY = "3c3c3c3c-0000-4000-8000-000000000003";

const ROWS: readonly Row[] = [
  daily("1a1a1a1a-0000-4000-8000-000000000001", "2026-10-12", "SG", 5, 0, 12, 9),
  daily("1a1a1a1a-0000-4000-8000-000000000002", "2026-10-12", "JP", 5, 0, 12, 11),
  daily("1a1a1a1a-0000-4000-8000-000000000003", "2026-10-12", "SG", 4, 1, 12, 8),
  daily("3c3c3c3c-0000-4000-8000-000000000001", "2026-10-13", "SG", 6, 0, 10, 20),
  daily("3c3c3c3c-0000-4000-8000-000000000002", "2026-10-13", "JP", 5, 1, 10, 15),
  daily(TODAY_ENTRY, "2026-10-13", "SG", 4, 2, 10, 12),
  daily("3c3c3c3c-0000-4000-8000-000000000004", "2026-10-13", "BR", 3, 3, 10, 30),
  { ...daily("5e5e5e5e-0000-4000-8000-000000000001", "2026-10-13", "SG", 6, 0, 10, 5), difficulty: "medium", daily_day: null },
];

const CONTROL = new Set(["select", "order", "limit", "offset"]);

function splitTop(list: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let start = 0;
  [...list].forEach((char, index) => {
    if (char === "(") depth += 1;
    if (char === ")") depth -= 1;
    if (char === "," && depth === 0) {
      parts.push(list.slice(start, index));
      start = index + 1;
    }
  });
  return [...parts, list.slice(start)];
}

function test(column: string, condition: string): (row: Row) => boolean {
  if (condition === "is.null") return (row) => row[column] == null;
  if (condition === "not.is.null") return (row) => row[column] != null;
  const [operator, ...rest] = condition.split(".");
  const value = rest.join(".");
  if (operator === "eq") return (row) => String(row[column]) === value;
  if (operator === "gt") return (row) => row[column] != null && Number(row[column]) > Number(value);
  if (operator === "lt") return (row) => row[column] != null && Number(row[column]) < Number(value);
  throw new Error(`the test fixture cannot run ${column}=${condition}`);
}

function clause(text: string): (row: Row) => boolean {
  if (text.startsWith("and(")) {
    const all = splitTop(text.slice(4, -1)).map(clause);
    return (row) => all.every((check) => check(row));
  }
  const [column, ...condition] = text.split(".");
  return test(column, condition.join("."));
}

function order(spec: string | null): (a: Row, b: Row) => number {
  const keys = (spec ?? "").split(",").filter(Boolean).map((part) => {
    const [column, direction] = part.split(".");
    return { column, sign: direction === "desc" ? -1 : 1 };
  });
  return (a, b) => {
    for (const { column, sign } of keys) {
      if (a[column] === b[column]) continue;
      if (a[column] == null) return 1;
      if (b[column] == null) return -1;
      return (Number(a[column]) < Number(b[column]) ? -1 : 1) * sign;
    }
    return 0;
  };
}

function mockFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const url = new URL(typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url);
  const checks = [...url.searchParams]
    .filter(([key]) => !CONTROL.has(key))
    .map(([key, value]) => (key === "or" ? ((row: Row) => splitTop(value.slice(1, -1)).some((part) => clause(part)(row))) : test(key, value)));
  const found = ROWS.filter((row) => checks.every((check) => check(row))).sort(order(url.searchParams.get("order")));
  const offset = Number(url.searchParams.get("offset") ?? 0);
  const page = found.slice(offset, offset + Number(url.searchParams.get("limit") ?? found.length));
  const headers = { "Content-Type": "application/json", "content-range": `*/${found.length}` };
  if (new Headers(init?.headers).get("Accept")?.includes("vnd.pgrst.object")) {
    return Promise.resolve(page.length === 1 ? new Response(JSON.stringify(page[0]), { status: 200, headers }) : new Response(JSON.stringify({ code: "PGRST116" }), { status: 406 }));
  }
  return Promise.resolve(new Response(init?.method === "HEAD" ? null : JSON.stringify(page), { status: 200, headers }));
}

jest.mock("@/lib/supabase", () => ({
  checkSupabaseConnection: jest.fn().mockResolvedValue({ connected: true }),
  supabase: jest
    .requireActual("@supabase/supabase-js")
    .createClient("http://127.0.0.1:1", "test-anon-key", { global: { fetch: mockFetch } }),
}));

describe("a daily board is one UTC day", () => {
  it("lists only 2026-10-13's daily rows, best first, leaving out 2026-10-12 and the medium board", async () => {
    const { data, error } = await getLeaderboard({ difficulty: "daily", daily_day: "2026-10-13" });

    expect(error).toBeUndefined();
    expect(data.map((row) => [row.daily_day, row.correct_pieces, row.solution_time])).toEqual([
      ["2026-10-13", 6, 20],
      ["2026-10-13", 5, 15],
      ["2026-10-13", 4, 12],
      ["2026-10-13", 3, 30],
    ]);
  });

  it("ranks a 2026-10-13 entry among that day's entries only, third of four, though two of 2026-10-12's scored higher", async () => {
    await expect(getStanding(TODAY_ENTRY, "world")).resolves.toEqual({
      status: "ranked",
      standing: { difficulty: "daily", daily_day: "2026-10-13", country: null, rank: 3, total: 4 },
    });
  });

  it("ranks the same entry second of two in Singapore that day", async () => {
    await expect(getStanding(TODAY_ENTRY, "country")).resolves.toEqual({
      status: "ranked",
      standing: { difficulty: "daily", daily_day: "2026-10-13", country: "SG", rank: 2, total: 2 },
    });
  });
});
