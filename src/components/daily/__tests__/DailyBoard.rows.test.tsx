import { act, fireEvent, render, screen, waitFor, within } from "@/test-utils/intl";
import { DailyBoard } from "@/components/daily/DailyBoard";
import type { DailyTopRender } from "@/lib/daily/topTen";
import type { DailyRound } from "@/lib/lab/daily";
import { DAILY_ENTRY_KEY } from "@/lib/lab/entries";
import type { CountryCode } from "@/lib/leaderboard/countries";
import type { LeaderboardEntry } from "@/types/leaderboard";
import { useSettingsStore } from "@/stores/settingsStore";

const row = (n: number, day: string, name: string): LeaderboardEntry => ({
  id: `3c3c3c3c-0000-4000-8000-${String(n).padStart(12, "0")}`,
  player_name: name,
  country_code: "SG" as CountryCode,
  difficulty: "daily",
  daily_day: day,
  piece_count: 6,
  correct_pieces: 6 - n,
  total_wrong_pieces: n,
  memorize_time: 10,
  solution_time: 10 + n,
  skill_rating: 1200,
  created_at: `${day}T09:00:00Z`,
});

const ADA = row(1, "2026-10-13", "Ada Lovelace");
const BO = row(2, "2026-10-14", "Bo Early");
const RENDERED: DailyTopRender = { today: "2026-10-13", board: { day: "2026-10-13", rows: [ADA], playedLike: null }, readAt: Date.parse("2026-10-13T23:59:00Z") };

const ROUND_ON_13 = {
  v: 2,
  kind: "daily",
  dailyDay: "2026-10-13",
  endedAt: Date.parse("2026-10-13T12:00:00Z"),
  correct: 5,
  wrong: 1,
  extra: 0,
  solveMs: 11_000,
  memorizeMs: 10_000,
  config: { pieceCount: 6, memorizeSeconds: 10, difficulty: "medium" },
  squares: "ccccc" + "w" + ".".repeat(58),
} as unknown as DailyRound;

let mockRecords: readonly DailyRound[] = [];
jest.mock("@/hooks/useLabData", () => ({
  useLabData: () => ({ storage: "available", records: mockRecords }),
}));

let reads: string[] = [];
let rowsByDay: Record<string, LeaderboardEntry[]> = {};

beforeEach(() => {
  reads = [];
  rowsByDay = {};
  mockRecords = [];
  window.localStorage.clear();
  useSettingsStore.setState({ countryCode: "SG" as CountryCode });
  global.fetch = jest.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = String(input);
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body));
      const stored = { ...row(3, body.daily_day, body.player_name), ...body };
      rowsByDay[body.daily_day] = [...(rowsByDay[body.daily_day] ?? []), stored];
      return { ok: true, status: 200, json: async () => ({ success: true, data: stored }) };
    }
    if (url.startsWith("/api/leaderboard/rank")) return { ok: false, status: 503, json: async () => ({}) };
    if (url.startsWith("/api/geo")) return { ok: true, status: 200, json: async () => ({ country: null }) };
    reads.push(url);
    const day = new URL(url, "http://localhost").searchParams.get("daily_day") ?? "";
    return { ok: true, status: 200, json: async () => ({ data: rowsByDay[day] ?? [], playedLike: null }) };
  }) as unknown as typeof fetch;
});

afterEach(() => jest.useRealTimers());

const topTen = () => screen.getByRole("region", { name: /top 10|^(Today|Yesterday)'s board$/ });
const CROWD = (day: string) => [row(4, day, "Cy Third"), row(5, day, "Di Fourth")];
const names = () => [...topTen().querySelectorAll(".daily-name")].map((name) => name.textContent);

describe("the daily board at midnight UTC", () => {
  it("switches to the new day's date and shows yesterday's rows, labelled, until the new day has rows", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-13T23:59:30Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    rowsByDay = { "2026-10-13": [ADA] };

    render(<DailyBoard rendered={RENDERED} />);
    await act(async () => {});
    expect(reads).toEqual([]);
    expect(screen.getByText("Daily board · Tuesday, October 13")).toBeInTheDocument();

    await act(async () => {
      jest.advanceTimersByTime(60_000);
    });
    await act(async () => {});

    expect(screen.getByText("Daily board · Wednesday, October 14")).toBeInTheDocument();
    expect(within(topTen()).getByRole("heading", { name: "Yesterday's board" })).toBeInTheDocument();
    expect(within(topTen()).getByText("Players who joined yesterday's board: 1")).toBeInTheDocument();
    expect(within(topTen()).queryByRole("table")).not.toBeInTheDocument();
    expect(reads).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-14", "/api/leaderboard?difficulty=daily&daily_day=2026-10-13"]);
  });

  it("shows the new day's rows once someone has joined it", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-14T00:05:00Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    rowsByDay = { "2026-10-13": [ADA], "2026-10-14": [BO] };

    render(<DailyBoard rendered={RENDERED} />);
    await act(async () => {});
    await act(async () => {});

    expect(within(topTen()).getByRole("heading", { name: "Today's board" })).toBeInTheDocument();
    expect(within(topTen()).getByText("Players who have joined today's board: 1")).toBeInTheDocument();
    expect(within(topTen()).queryByRole("table")).not.toBeInTheDocument();
  });

  it("lists the new day's top 10 once three players have joined it", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-14T00:05:00Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    rowsByDay = { "2026-10-13": [ADA], "2026-10-14": [BO, ...CROWD("2026-10-14")] };

    render(<DailyBoard rendered={RENDERED} />);
    await act(async () => {});
    await act(async () => {});

    expect(within(topTen()).getByRole("heading", { name: "Today's top 10" })).toBeInTheDocument();
    expect(names()).toEqual(["🇸🇬 Bo Early", "🇸🇬 Cy Third", "🇸🇬 Di Fourth"]);
  });
});

describe("joining today's board", () => {
  it("reads the board again past the shared cache and highlights the player's own row", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-13T23:59:10Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    mockRecords = [ROUND_ON_13];
    rowsByDay = { "2026-10-13": [ADA, ...CROWD("2026-10-13")] };

    render(<DailyBoard rendered={RENDERED} />);
    await act(async () => {});
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "Poteto" } });
    fireEvent.click(screen.getByRole("button", { name: "Join the board" }));

    await waitFor(() => expect(topTen().querySelector("[data-you]")).toHaveTextContent("PotetoYou"));
    expect(reads).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-13&after=3c3c3c3c-0000-4000-8000-000000000003"]);
  });
});

describe("coming back after joining today's board", () => {
  it("reads the board past the shared cache on load, so a fresh render without the player's row is corrected", async () => {
    jest.useFakeTimers({ now: Date.parse("2026-10-13T23:59:10Z"), doNotFake: ["queueMicrotask", "nextTick"] });
    const own = row(3, "2026-10-13", "Poteto");
    rowsByDay = { "2026-10-13": [ADA, own, ...CROWD("2026-10-13")] };
    window.localStorage.setItem(
      DAILY_ENTRY_KEY,
      JSON.stringify([{ id: own.id, difficulty: "daily", dailyDay: "2026-10-13", country: "SG", score: { correctPieces: 3, totalWrongPieces: 3, memorizeTime: 10, solutionTime: 13 }, submittedAt: 1 }]),
    );

    render(<DailyBoard rendered={RENDERED} />);
    await act(async () => {});

    await waitFor(() => expect(topTen().querySelector("[data-you]")).toHaveTextContent("PotetoYou"));
    expect(reads).toEqual(["/api/leaderboard?difficulty=daily&daily_day=2026-10-13&after=3c3c3c3c-0000-4000-8000-000000000003"]);
  });
});
